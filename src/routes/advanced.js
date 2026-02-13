/**
 * Advanced Routes
 *
 * POST /merge        - Merge multiple PDFs into one
 * POST /batch        - Generate batch PDFs from template (multi-page)
 * POST /webhook      - Generate PDF and send result to webhook (with retry)
 */
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { renderPdf } = require("../services/renderer");
const { mergePdfs } = require("../services/pdfUtils");
const { getFilePath, getOutputDir } = require("../services/fileManager");
const { getTemplate, listTemplates } = require("../templates");
const { generateFilename } = require("../utils/format");
const { success, error } = require("../utils/response");
const config = require("../config");

// ─── Merge PDFs ──────────────────────────────────────────────
router.post("/merge", async (req, res) => {
  const { files, filename } = req.body;

  if (!files || !Array.isArray(files) || files.length < 2) {
    return error(res, "files is required (array of filenames, minimum 2)");
  }

  const mergedFilename = filename || generateFilename("merged");
  const outputPath = getFilePath(mergedFilename);

  try {
    const inputPaths = files.map((f) => getFilePath(f));

    // Validate all files exist
    for (const p of inputPaths) {
      if (!fs.existsSync(p)) {
        return error(res, `File not found: ${path.basename(p)}`, null, 404);
      }
    }

    await mergePdfs(inputPaths, outputPath);

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return success(res, {
      message: `${files.length} PDFs merged successfully`,
      file_url: `${baseUrl}/output/${mergedFilename}`,
      filename: mergedFilename,
      source_files: files,
    });
  } catch (err) {
    console.error("[Merge] Error:", err.message);
    return error(res, "Failed to merge PDFs", err.message, 500);
  }
});

// ─── Batch Generate (Template × Data Array → Multi-page PDF) ─
router.post("/batch", async (req, res) => {
  const { template, batch, filename, page_size, watermark } = req.body;

  const tmpl = getTemplate(template);
  if (!tmpl) {
    return error(
      res,
      `Invalid template. Available: ${listTemplates()
        .map((t) => t.name)
        .join(", ")}`,
    );
  }
  if (!batch || !Array.isArray(batch) || batch.length === 0) {
    return error(res, "batch is required (array of data objects)");
  }

  const tempFiles = [];

  try {
    // Step 1: Generate individual PDFs
    for (let i = 0; i < batch.length; i++) {
      const html = tmpl.fn(batch[i]);
      const tempFilename = `_batch_temp_${Date.now()}_${i}.pdf`;
      const tempPath = getFilePath(tempFilename);

      await renderPdf({ html }, tempPath, {
        pageSize: page_size || tmpl.defaultPageSize,
        watermark,
      });

      tempFiles.push(tempPath);
    }

    // Step 2: Merge all into one PDF
    const mergedFilename = filename || generateFilename(`batch_${template}`);
    const mergedPath = getFilePath(mergedFilename);

    await mergePdfs(tempFiles, mergedPath);

    // Step 3: Cleanup temp files
    for (const tmp of tempFiles) {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return success(res, {
      message: `${batch.length} pages generated and merged`,
      template,
      total_pages: batch.length,
      file_url: `${baseUrl}/output/${mergedFilename}`,
      filename: mergedFilename,
    });
  } catch (err) {
    // Cleanup on error
    for (const tmp of tempFiles) {
      if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
    }
    console.error("[Batch] Error:", err.message);
    return error(res, "Failed to generate batch PDF", err.message, 500);
  }
});

// ─── Webhook Helper: Retry with exponential backoff ──────────
async function sendWebhookWithRetry(url, payload, maxRetries, delayMs) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await axios.post(url, payload, { timeout: 30000 });
      return { success: true, attempt, status: response.status };
    } catch (err) {
      lastError = err;
      console.warn(
        `[Webhook] Attempt ${attempt}/${maxRetries} failed: ${err.message}`,
      );
      if (attempt < maxRetries) {
        const backoff = delayMs * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, backoff));
      }
    }
  }
  throw lastError;
}

// ─── Webhook (Async Generate + Callback with Retry) ──────────
router.post("/webhook", async (req, res) => {
  const { source, template, data, webhook_url, options } = req.body;

  if (!webhook_url) {
    return error(res, "webhook_url is required");
  }

  // Validate source
  const hasHtml = source?.html || (template && data);
  const hasUrl = source?.url;
  if (!hasHtml && !hasUrl) {
    return error(res, "Provide source.html, source.url, or template+data");
  }

  // Respond immediately
  const jobId = `job_${Date.now()}`;
  const maxRetries = options?.max_retries || config.WEBHOOK_MAX_RETRIES;
  const retryDelay = options?.retry_delay_ms || config.WEBHOOK_RETRY_DELAY_MS;

  success(res, {
    message: "Job accepted, result will be sent to webhook",
    job_id: jobId,
    webhook_url,
    max_retries: maxRetries,
  });

  // Process in background
  setImmediate(async () => {
    try {
      let htmlContent;
      let pageSize = options?.page_size || "a4";

      if (template && data) {
        const tmpl = getTemplate(template);
        if (!tmpl) throw new Error(`Invalid template: ${template}`);
        htmlContent = tmpl.fn(data);
        pageSize = options?.page_size || tmpl.defaultPageSize;
      } else if (source?.html) {
        htmlContent = source.html;
      }

      const pdfFilename = options?.filename || generateFilename("webhook");
      const pdfPath = getFilePath(pdfFilename);

      const renderSource = source?.url
        ? { url: source.url }
        : { html: htmlContent };

      const renderResult = await renderPdf(renderSource, pdfPath, {
        pageSize,
        watermark: options?.watermark,
        inject_css: options?.inject_css,
        qr_code: options?.qr_code,
        barcode: options?.barcode,
        return_base64: true,
      });

      // Send result to webhook with retry
      const deliveryResult = await sendWebhookWithRetry(
        webhook_url,
        {
          status: "success",
          job_id: jobId,
          filename: pdfFilename,
          base64: renderResult.base64,
        },
        maxRetries,
        retryDelay,
      );

      console.log(
        `[Webhook] Job ${jobId} delivered → ${webhook_url} (attempt ${deliveryResult.attempt})`,
      );
    } catch (err) {
      console.error(`[Webhook] Job ${jobId} failed:`, err.message);

      // Notify webhook of failure (also with retry)
      try {
        await sendWebhookWithRetry(
          webhook_url,
          {
            status: "error",
            job_id: jobId,
            error: err.message,
          },
          2,
          1000,
        );
      } catch {
        console.error(
          `[Webhook] Failed to notify webhook of error after retries`,
        );
      }
    }
  });
});

module.exports = router;
