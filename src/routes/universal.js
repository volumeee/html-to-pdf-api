/**
 * Unified API Engine — v7.2.0 (Complete)
 *
 * ALL feature routes consolidated into three endpoints:
 *   POST /render      → Generate PDFs/Images from HTML, URL, or Templates
 *   POST /pdf-action  → Post-process existing PDFs
 *   POST /queue       → Async background job submission
 *   GET  /jobs/:id    → Check job status
 *   GET  /queue/stats → Queue statistics
 *   POST /cetak_struk_pdf → Legacy receipt endpoint
 *
 * Every service module is wired in. Nothing left behind.
 */
const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const { renderPdf, renderImage } = require("../services/renderer");
const { getTemplate } = require("../templates");
const { generateFilename } = require("../utils/format");
const { getFilePath } = require("../services/fileManager");
const { success, error } = require("../utils/response");

// ─── 1. Universal Renderer (/render) ─────────────────────────
router.post("/render", async (req, res) => {
  const {
    source_type,
    source,
    output,
    data,
    options = {},
    filename,
    signed_url,
    cloud_upload,
  } = req.body;

  if (!source_type || !source) {
    return error(res, "source_type and source are required.");
  }

  try {
    const isPdf = (output || "pdf").toLowerCase() === "pdf";
    const ext = isPdf ? "pdf" : options.format || "png";
    const outFilename = filename || generateFilename("render", ext);
    const outputPath = getFilePath(outFilename);
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    // Resolve source
    const renderSource = {};
    let renderOptions = { ...options };

    if (source_type === "url") {
      renderSource.url = source;
    } else if (source_type === "html") {
      renderSource.html = source;
    } else if (source_type === "template") {
      const tmpl = getTemplate(source);
      if (!tmpl) return error(res, `Template "${source}" not found`, null, 404);
      renderSource.html = tmpl.fn(data || {});
      if (!renderOptions.pageSize) {
        renderOptions.pageSize = tmpl.defaultPageSize;
      }
    } else {
      return error(
        res,
        `Invalid source_type "${source_type}". Use: html, url, template`,
      );
    }

    // Render
    const result = isPdf
      ? await renderPdf(renderSource, outputPath, renderOptions)
      : await renderImage(renderSource, outputPath, renderOptions);

    const response = {
      message: `${isPdf ? "PDF" : "Image"} rendered successfully`,
      file_url: `${baseUrl}/output/${outFilename}`,
      filename: outFilename,
      ...result,
    };

    // Optional: Cloud Storage upload
    if (cloud_upload) {
      try {
        const { upload, isEnabled } = require("../services/cloudStorage");
        if (isEnabled()) {
          const cloud = await upload(outputPath, outFilename);
          response.cloud_url = cloud.url;
          response.cloud_key = cloud.key;
        }
      } catch (e) {
        response.cloud_error = e.message;
      }
    }

    // Optional: Signed URL
    if (signed_url) {
      const { generateSignedUrl } = require("../services/signedUrl");
      const signed = generateSignedUrl(
        baseUrl,
        outFilename,
        signed_url.expiry_minutes,
      );
      response.signed_url = signed.signed_url;
      response.signed_expires_at = signed.expires_at;
    }

    return success(res, response);
  } catch (err) {
    console.error("[Render] Error:", err.message);
    return error(res, "Rendering failed", err.message, 500);
  }
});

// ─── 2. Universal Processor (/pdf-action) ────────────────────
router.post("/pdf-action", async (req, res) => {
  const { action, filename, files, options = {} } = req.body;

  if (!action) return error(res, "action is required");
  if (action !== "merge" && !filename)
    return error(res, "filename is required");

  const inputPath = filename ? getFilePath(filename) : null;

  // Validate input file exists (except merge)
  if (inputPath && action !== "merge" && !fs.existsSync(inputPath)) {
    return error(res, `File not found: ${filename}`, null, 404);
  }

  try {
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    let result = {};
    let outFilename = filename;

    switch (action) {
      // ── Compress ────────────────────────────────────
      case "compress": {
        const { compressPdf } = require("../services/pdfUtils");
        outFilename = generateFilename("compressed", "pdf");
        result = await compressPdf(
          inputPath,
          getFilePath(outFilename),
          options,
        );
        break;
      }

      // ── Password Protect ───────────────────────────
      case "encrypt":
      case "protect": {
        const { protectPdf } = require("../services/pdfUtils");
        if (!options.password)
          return error(res, "options.password is required for encrypt/protect");
        outFilename = generateFilename("encrypted", "pdf");
        await protectPdf(inputPath, getFilePath(outFilename), options.password);
        result = { encrypted: true };
        break;
      }

      // ── Digital Signature Stamp ────────────────────
      case "sign": {
        const { embedSignature } = require("../services/signature");
        outFilename = generateFilename("signed", "pdf");
        await embedSignature(inputPath, getFilePath(outFilename), options);
        result = { signed: true, position: options.position || "bottom-right" };
        break;
      }

      // ── Merge Multiple PDFs ────────────────────────
      case "merge": {
        if (!files || !Array.isArray(files) || files.length < 2) {
          return error(
            res,
            "files array with at least 2 filenames is required",
          );
        }
        const { mergePdfs } = require("../services/pdfUtils");
        outFilename = filename || generateFilename("merged", "pdf");
        const inputPaths = files.map((f) => getFilePath(f));

        // Validate all files exist
        for (const fp of inputPaths) {
          if (!fs.existsSync(fp))
            return error(
              res,
              `File not found: ${path.basename(fp)}`,
              null,
              404,
            );
        }
        await mergePdfs(inputPaths, getFilePath(outFilename));
        result = { merged_count: files.length };
        break;
      }

      // ── Split PDF into Individual Pages ────────────
      case "split": {
        const { splitPdf } = require("../services/pdfAdvanced");
        const outputDir = path.dirname(inputPath);
        const splitFiles = await splitPdf(inputPath, outputDir);
        return success(res, {
          message: "PDF split into individual pages",
          page_count: splitFiles.length,
          files: splitFiles.map((f) => ({
            filename: f,
            url: `${baseUrl}/output/${f}`,
          })),
        });
      }

      // ── Extract Specific Pages ─────────────────────
      case "extract": {
        const { extractPages } = require("../services/pdfAdvanced");
        if (!options.pages || !Array.isArray(options.pages)) {
          return error(
            res,
            'options.pages array is required (e.g., [0, 1, "2-4"])',
          );
        }
        outFilename = generateFilename("extracted", "pdf");
        result = await extractPages(
          inputPath,
          getFilePath(outFilename),
          options.pages,
        );
        break;
      }

      // ── Read/Write Metadata ────────────────────────
      case "metadata": {
        const { getMetadata, setMetadata } = require("../services/pdfMetadata");
        if (
          options &&
          (options.title ||
            options.author ||
            options.subject ||
            options.keywords ||
            options.creator)
        ) {
          await setMetadata(inputPath, options);
          result = { updated: true, metadata: options };
        } else {
          result = { metadata: await getMetadata(inputPath) };
        }
        break;
      }

      // ── Generate Thumbnail Preview ─────────────────
      case "thumbnail": {
        const {
          generateThumbnail,
          generateThumbnailBase64,
        } = require("../services/thumbnail");
        const fmt = options.format || "png";
        outFilename = generateFilename("thumb", fmt);

        if (options.return_base64) {
          result = await generateThumbnailBase64(inputPath, options);
        } else {
          result = await generateThumbnail(
            inputPath,
            getFilePath(outFilename),
            options,
          );
        }
        break;
      }

      // ── Send via Email ─────────────────────────────
      case "email": {
        const { sendPdfEmail, isEnabled } = require("../services/email");
        if (!isEnabled()) {
          return error(
            res,
            "Email not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS env vars.",
            null,
            501,
          );
        }
        if (!options.to)
          return error(res, "options.to (email address) is required");
        result = await sendPdfEmail(inputPath, options);
        break;
      }

      default:
        return error(
          res,
          `Unknown action "${action}". Available: compress, encrypt, sign, merge, split, extract, metadata, thumbnail, email`,
        );
    }

    return success(res, {
      message: `Action "${action}" completed successfully`,
      file_url: `${baseUrl}/output/${outFilename}`,
      filename: outFilename,
      ...result,
    });
  } catch (err) {
    console.error(`[PDF-Action:${action}] Error:`, err.message);
    return error(res, `Action "${action}" failed`, err.message, 500);
  }
});

// ─── 3. Job Queue Endpoints ──────────────────────────────────
router.post("/queue", async (req, res) => {
  const { type, data, priority } = req.body;

  if (!type || !data) return error(res, "type and data are required.");

  try {
    const { enqueue } = require("../services/queue");
    data._base_url = `${req.protocol}://${req.get("host")}`;

    const handler = async (jobData) => {
      if (type === "render" || type === "pdf") {
        const outName = jobData.filename || generateFilename("queued");
        const source = {};
        if (jobData.url) source.url = jobData.url;
        else if (jobData.html_content) source.html = jobData.html_content;
        else if (jobData.template) {
          const tmpl = getTemplate(jobData.template);
          if (!tmpl)
            throw new Error(`Template "${jobData.template}" not found`);
          source.html = tmpl.fn(jobData.data || {});
        }

        await renderPdf(source, getFilePath(outName), jobData.options || {});
        return {
          file_url: `${jobData._base_url}/output/${outName}`,
          filename: outName,
        };
      }
      return { status: "processed", type };
    };

    const job = enqueue(type, data, handler, { priority: priority || 0 });
    return res.status(202).json({
      status: "success",
      message: "Job queued for processing",
      ...job,
    });
  } catch (err) {
    return error(
      res,
      "Queue failed",
      err.message,
      err.message.includes("full") ? 429 : 500,
    );
  }
});

router.get("/jobs/:id", (req, res) => {
  const { getJob } = require("../services/queue");
  const job = getJob(req.params.id);
  if (!job) return error(res, "Job not found", null, 404);
  return success(res, { job });
});

router.get("/queue/stats", (req, res) => {
  const { getQueueStats } = require("../services/queue");
  return success(res, { queue: getQueueStats() });
});

// ─── 4. Legacy Receipt Endpoint ──────────────────────────────
router.post("/cetak_struk_pdf", async (req, res) => {
  try {
    const {
      html_content,
      template,
      data,
      page_size,
      qr_code,
      barcode,
      watermark,
      filename,
    } = req.body;

    const isPdf = true;
    const outFilename = filename || generateFilename("struk", "pdf");
    const outputPath = getFilePath(outFilename);
    const baseUrl = `${req.protocol}://${req.get("host")}`;

    const renderSource = {};
    const renderOptions = {
      pageSize: page_size || "thermal_default",
      qr_code,
      barcode,
      watermark,
    };

    if (template) {
      const tmpl = getTemplate(template);
      if (!tmpl)
        return error(res, `Template "${template}" not found`, null, 404);
      renderSource.html = tmpl.fn(data || {});
      if (!page_size) renderOptions.pageSize = tmpl.defaultPageSize;
    } else if (html_content) {
      renderSource.html = html_content;
    } else {
      return error(res, "html_content or template is required");
    }

    const result = await renderPdf(renderSource, outputPath, renderOptions);

    return success(res, {
      message: "Receipt PDF generated",
      file_url: `${baseUrl}/output/${outFilename}`,
      filename: outFilename,
      ...result,
    });
  } catch (err) {
    console.error("[CetakStruk] Error:", err.message);
    return error(res, "Receipt generation failed", err.message, 500);
  }
});

module.exports = router;
