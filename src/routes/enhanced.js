/**
 * Enhanced Feature Routes (v7.1.0)
 *
 * POST /compress-pdf   - Compress a PDF file
 * GET  /pdf-metadata   - Get PDF metadata
 * POST /pdf-metadata   - Set PDF metadata
 * POST /thumbnail      - Generate PDF thumbnail
 * POST /send-email     - Send file via email
 * POST /queue          - Submit async job
 * GET  /jobs/:id       - Check job status
 * GET  /queue/stats    - Queue statistics
 */
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { getFilePath } = require("../services/fileManager");
const { generateFilename } = require("../utils/format");
const { success, error } = require("../utils/response");

// ─── PDF Compression ────────────────────────────────────────
router.post("/compress-pdf", async (req, res) => {
  const { filename, quality } = req.body;

  if (!filename) {
    return error(res, "filename is required (name of PDF in output folder)");
  }

  const inputPath = getFilePath(filename);
  if (!fs.existsSync(inputPath)) {
    return error(res, `File not found: ${filename}`, null, 404);
  }

  const outFilename = generateFilename("compressed", "pdf");
  const outputPath = getFilePath(outFilename);

  try {
    const { compressPdf } = require("../services/pdfUtils");
    const result = await compressPdf(inputPath, outputPath, { quality });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return success(res, {
      message: "PDF compressed successfully",
      source: filename,
      file_url: `${baseUrl}/output/${outFilename}`,
      filename: outFilename,
      ...result,
    });
  } catch (err) {
    console.error("[Compress] Error:", err.message);
    return error(res, "Failed to compress PDF", err.message, 500);
  }
});

// ─── PDF Metadata ───────────────────────────────────────────
router.get("/pdf-metadata", async (req, res) => {
  const { filename } = req.query;

  if (!filename) {
    return error(res, "filename query parameter is required");
  }

  const filePath = getFilePath(filename);
  if (!fs.existsSync(filePath)) {
    return error(res, `File not found: ${filename}`, null, 404);
  }

  try {
    const { getMetadata } = require("../services/pdfMetadata");
    const metadata = await getMetadata(filePath);
    return success(res, { filename, metadata });
  } catch (err) {
    return error(res, "Failed to read PDF metadata", err.message, 500);
  }
});

router.post("/pdf-metadata", async (req, res) => {
  const { filename, title, author, subject, keywords, creator } = req.body;

  if (!filename) {
    return error(res, "filename is required");
  }

  const filePath = getFilePath(filename);
  if (!fs.existsSync(filePath)) {
    return error(res, `File not found: ${filename}`, null, 404);
  }

  try {
    const { setMetadata } = require("../services/pdfMetadata");
    await setMetadata(filePath, { title, author, subject, keywords, creator });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return success(res, {
      message: "PDF metadata updated",
      filename,
      file_url: `${baseUrl}/output/${filename}`,
      metadata: { title, author, subject, keywords, creator },
    });
  } catch (err) {
    return error(res, "Failed to set PDF metadata", err.message, 500);
  }
});

// ─── Thumbnail Generation ───────────────────────────────────
router.post("/thumbnail", async (req, res) => {
  const { filename, width, height, page, format, quality, return_base64 } =
    req.body;

  if (!filename) {
    return error(res, "filename is required (name of PDF in output folder)");
  }

  const pdfPath = getFilePath(filename);
  if (!fs.existsSync(pdfPath)) {
    return error(res, `File not found: ${filename}`, null, 404);
  }

  try {
    const thumbFormat = format || "png";
    const thumbFilename = generateFilename("thumb", thumbFormat);
    const thumbPath = getFilePath(thumbFilename);

    const {
      generateThumbnail,
      generateThumbnailBase64,
    } = require("../services/thumbnail");

    if (return_base64) {
      const result = await generateThumbnailBase64(pdfPath, {
        width,
        height,
        page,
        format: thumbFormat,
        quality,
      });

      return success(res, {
        message: "Thumbnail generated",
        source: filename,
        ...result,
      });
    }

    const info = await generateThumbnail(pdfPath, thumbPath, {
      width,
      height,
      page,
      format: thumbFormat,
      quality,
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return success(res, {
      message: "Thumbnail generated",
      source: filename,
      file_url: `${baseUrl}/output/${thumbFilename}`,
      filename: thumbFilename,
      ...info,
    });
  } catch (err) {
    console.error("[Thumbnail] Error:", err.message);
    return error(res, "Failed to generate thumbnail", err.message, 500);
  }
});

// ─── Send Email ─────────────────────────────────────────────
router.post("/send-email", async (req, res) => {
  const { filename, to, cc, bcc, subject, message } = req.body;

  if (!filename) return error(res, "filename is required");
  if (!to) return error(res, "to (email address) is required");

  const filePath = getFilePath(filename);
  if (!fs.existsSync(filePath)) {
    return error(res, `File not found: ${filename}`, null, 404);
  }

  try {
    const { sendPdfEmail, isEnabled } = require("../services/email");

    if (!isEnabled()) {
      return error(
        res,
        "Email is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables.",
        null,
        501,
      );
    }

    const result = await sendPdfEmail(filePath, {
      to,
      cc,
      bcc,
      subject,
      message,
    });

    return success(res, {
      message: "Email sent successfully",
      filename,
      ...result,
    });
  } catch (err) {
    console.error("[Email] Error:", err.message);
    return error(res, "Failed to send email", err.message, 500);
  }
});

// ─── Queue Routes ───────────────────────────────────────────
router.post("/queue", async (req, res) => {
  const { type, data } = req.body;

  if (!type) return error(res, "type is required (e.g., 'pdf', 'batch')");
  if (!data) return error(res, "data is required (job input)");

  try {
    const { enqueue } = require("../services/queue");
    const { renderPdf } = require("../services/renderer");
    const { getTemplate } = require("../templates");

    // Define job handlers based on type
    const handlers = {
      pdf: async (jobData) => {
        const pdfFilename = jobData.filename || generateFilename("queued");
        const pdfPath = getFilePath(pdfFilename);
        await renderPdf({ html: jobData.html_content }, pdfPath, {
          pageSize: jobData.page_size,
        });
        const baseUrl = jobData._base_url || "";
        return {
          file_url: `${baseUrl}/output/${pdfFilename}`,
          filename: pdfFilename,
        };
      },
      template: async (jobData) => {
        const tmpl = getTemplate(jobData.template);
        if (!tmpl) throw new Error(`Template "${jobData.template}" not found`);
        const html = tmpl.fn(jobData.data || {});
        const pdfFilename =
          jobData.filename || generateFilename(jobData.template);
        const pdfPath = getFilePath(pdfFilename);
        await renderPdf({ html }, pdfPath, {
          pageSize: jobData.page_size || tmpl.defaultPageSize,
        });
        const baseUrl = jobData._base_url || "";
        return {
          file_url: `${baseUrl}/output/${pdfFilename}`,
          filename: pdfFilename,
          template: jobData.template,
        };
      },
    };

    const handler = handlers[type];
    if (!handler) {
      return error(
        res,
        `Unsupported job type "${type}". Supported: ${Object.keys(handlers).join(", ")}`,
      );
    }

    // Inject base URL into job data
    data._base_url = `${req.protocol}://${req.get("host")}`;

    const job = enqueue(type, data, handler, {
      priority: req.body.priority || 0,
    });

    return res.status(202).json({
      status: "accepted",
      message: "Job queued for processing",
      ...job,
    });
  } catch (err) {
    return error(
      res,
      err.message,
      null,
      err.message.includes("full") ? 429 : 500,
    );
  }
});

router.get("/jobs/:id", (req, res) => {
  const { getJob } = require("../services/queue");
  const job = getJob(req.params.id);

  if (!job) {
    return error(res, "Job not found", null, 404);
  }

  return success(res, { job });
});

router.get("/queue/stats", (req, res) => {
  const { getQueueStats } = require("../services/queue");
  return success(res, { queue: getQueueStats() });
});

module.exports = router;
