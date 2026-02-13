/**
 * PDF Routes
 *
 * POST /cetak_struk_pdf   - HTML → PDF
 * POST /generate          - Template → PDF
 * POST /url-to-pdf        - URL → PDF
 *
 * All endpoints support: watermark, base64, password, CSS injection, QR code, barcode
 */
const express = require("express");
const router = express.Router();
const fs = require("fs");
const { renderPdf } = require("../services/renderer");
const { protectPdf, isQpdfAvailable } = require("../services/pdfUtils");
const { getFilePath } = require("../services/fileManager");
const { getTemplate, listTemplates } = require("../templates");
const { generateFilename } = require("../utils/format");
const { success, error } = require("../utils/response");

/**
 * Shared logic: apply password protection, metadata, and build response
 */
async function finalizePdf(req, res, pdfFilename, renderResult, options = {}) {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  let finalFilename = pdfFilename;

  // Apply PDF metadata if provided
  if (options.metadata) {
    try {
      const { setMetadata } = require("../services/pdfMetadata");
      await setMetadata(getFilePath(finalFilename), options.metadata);
    } catch (err) {
      console.warn("[PDF] Metadata error:", err.message);
    }
  }

  // Apply password protection if requested
  if (options.password) {
    if (!isQpdfAvailable()) {
      return error(
        res,
        "Password protection is not available (qpdf not installed)",
        null,
        501,
      );
    }

    const inputPath = getFilePath(pdfFilename);
    const protectedFilename = pdfFilename.replace(".pdf", "_protected.pdf");
    const outputPath = getFilePath(protectedFilename);

    await protectPdf(inputPath, outputPath, options.password);

    // Remove unprotected version
    fs.unlinkSync(inputPath);
    finalFilename = protectedFilename;
  }

  const responseData = {
    file_url: `${baseUrl}/output/${finalFilename}`,
    filename: finalFilename,
    ...options.extraData,
  };

  // Include base64 if requested
  if (renderResult.base64) {
    responseData.base64 = renderResult.base64;
  } else if (options.return_base64) {
    responseData.base64 = fs
      .readFileSync(getFilePath(finalFilename))
      .toString("base64");
  }

  return success(res, responseData);
}

// ─── HTML → PDF ──────────────────────────────────────────────
router.post("/cetak_struk_pdf", async (req, res) => {
  const {
    html_content,
    filename,
    page_size,
    options,
    watermark,
    qr_code,
    barcode,
    return_base64,
    password,
    metadata,
  } = req.body;

  if (!html_content) {
    return error(res, "html_content is required");
  }

  const pdfFilename = filename || generateFilename("struk");
  const pdfPath = getFilePath(pdfFilename);

  try {
    const renderResult = await renderPdf({ html: html_content }, pdfPath, {
      pageSize: page_size,
      watermark,
      qr_code,
      barcode,
      return_base64,
      ...options,
    });

    return finalizePdf(req, res, pdfFilename, renderResult, {
      password,
      return_base64,
      metadata,
      extraData: {
        message: "PDF created successfully",
        page_size: page_size || "thermal_default",
      },
    });
  } catch (err) {
    console.error("[PDF] HTML→PDF error:", err.message);
    return error(res, "Failed to generate PDF", err.message, 500);
  }
});

// ─── Template → PDF ──────────────────────────────────────────
router.post("/generate", async (req, res) => {
  const {
    template,
    data,
    filename,
    page_size,
    options,
    watermark,
    qr_code,
    barcode,
    return_base64,
    password,
  } = req.body;

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
    const renderResult = await renderPdf({ html: html_content }, pdfPath, {
      pageSize: page_size || tmpl.defaultPageSize,
      watermark,
      qr_code,
      barcode,
      return_base64,
      ...options,
    });

    return finalizePdf(req, res, pdfFilename, renderResult, {
      password,
      return_base64,
      extraData: { template },
    });
  } catch (err) {
    console.error("[PDF] Template error:", err.message);
    return error(res, "Failed to generate PDF from template", err.message, 500);
  }
});

// ─── URL → PDF ───────────────────────────────────────────────
router.post("/url-to-pdf", async (req, res) => {
  const {
    url,
    filename,
    page_size,
    options,
    watermark,
    qr_code,
    barcode,
    inject_css,
    return_base64,
    password,
  } = req.body;

  if (!url) {
    return error(res, "url is required");
  }

  const pdfFilename = filename || generateFilename("webpage");
  const pdfPath = getFilePath(pdfFilename);

  try {
    const renderResult = await renderPdf({ url }, pdfPath, {
      pageSize: page_size || "a4",
      watermark,
      qr_code,
      barcode,
      inject_css,
      return_base64,
      ...options,
    });

    return finalizePdf(req, res, pdfFilename, renderResult, {
      password,
      return_base64,
      extraData: {
        message: "URL converted to PDF",
        source_url: url,
        page_size: page_size || "a4",
      },
    });
  } catch (err) {
    console.error("[PDF] URL→PDF error:", err.message);
    return error(res, "Failed to convert URL to PDF", err.message, 500);
  }
});

module.exports = router;
