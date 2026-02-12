/**
 * PDF Routes
 *
 * POST /cetak_struk_pdf   - HTML → PDF (raw)
 * POST /generate          - Template → PDF
 * POST /url-to-pdf        - URL → PDF
 */
const express = require("express");
const router = express.Router();
const { renderPdf } = require("../services/renderer");
const { getFilePath } = require("../services/fileManager");
const { getTemplate, listTemplates } = require("../templates");
const { generateFilename } = require("../utils/format");
const { success, error } = require("../utils/response");

// ─── HTML → PDF ──────────────────────────────────────────────
router.post("/cetak_struk_pdf", async (req, res) => {
  const { html_content, filename, page_size, options } = req.body;

  if (!html_content) {
    return error(res, "html_content is required");
  }

  const pdfFilename = filename || generateFilename("struk");
  const pdfPath = getFilePath(pdfFilename);

  try {
    await renderPdf({ html: html_content }, pdfPath, {
      pageSize: page_size,
      ...options,
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return success(res, {
      message: "PDF created successfully",
      file_url: `${baseUrl}/output/${pdfFilename}`,
      filename: pdfFilename,
      page_size: page_size || "thermal_default",
    });
  } catch (err) {
    console.error("[PDF] HTML→PDF error:", err.message);
    return error(res, "Failed to generate PDF", err.message, 500);
  }
});

// ─── Template → PDF ──────────────────────────────────────────
router.post("/generate", async (req, res) => {
  const { template, data, filename, page_size } = req.body;

  const tmpl = getTemplate(template);
  if (!tmpl) {
    return error(
      res,
      `Invalid template. Available: ${listTemplates()
        .map((t) => t.name)
        .join(", ")}`,
    );
  }
  if (!data) {
    return error(res, "data is required");
  }

  const html_content = tmpl.fn(data);
  const pdfFilename = filename || generateFilename(template);
  const pdfPath = getFilePath(pdfFilename);

  try {
    await renderPdf({ html: html_content }, pdfPath, {
      pageSize: page_size || tmpl.defaultPageSize,
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return success(res, {
      template,
      file_url: `${baseUrl}/output/${pdfFilename}`,
      filename: pdfFilename,
    });
  } catch (err) {
    console.error("[PDF] Template error:", err.message);
    return error(res, "Failed to generate PDF from template", err.message, 500);
  }
});

// ─── URL → PDF ───────────────────────────────────────────────
router.post("/url-to-pdf", async (req, res) => {
  const { url, filename, page_size, options } = req.body;

  if (!url) {
    return error(res, "url is required");
  }

  const pdfFilename = filename || generateFilename("webpage");
  const pdfPath = getFilePath(pdfFilename);

  try {
    await renderPdf({ url }, pdfPath, {
      pageSize: page_size || "a4",
      ...options,
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return success(res, {
      message: "URL converted to PDF successfully",
      source_url: url,
      file_url: `${baseUrl}/output/${pdfFilename}`,
      filename: pdfFilename,
      page_size: page_size || "a4",
    });
  } catch (err) {
    console.error("[PDF] URL→PDF error:", err.message);
    return error(res, "Failed to convert URL to PDF", err.message, 500);
  }
});

module.exports = router;
