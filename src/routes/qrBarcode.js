/**
 * QR Code & Barcode Routes
 *
 * POST /qr-code       - Generate QR Code image
 * POST /barcode        - Generate Barcode image
 * POST /qr-pdf         - Generate PDF with embedded QR Code
 */
const express = require("express");
const router = express.Router();
const fs = require("fs");
const {
  generateQR,
  generateQRDataUri,
  generateBarcode,
  BARCODE_TYPES,
} = require("../services/qrBarcode");
const { renderPdf } = require("../services/renderer");
const { getFilePath } = require("../services/fileManager");
const { generateFilename } = require("../utils/format");
const { success, error } = require("../utils/response");

// ─── QR Code → Image ────────────────────────────────────────
router.post("/qr-code", async (req, res) => {
  const { text, width, margin, color, background, format, errorLevel } =
    req.body;

  if (!text) {
    return error(res, "text is required");
  }

  try {
    const buffer = await generateQR(text, {
      width,
      margin,
      color,
      background,
      errorLevel,
    });

    if (format === "base64") {
      const dataUri = await generateQRDataUri(text, {
        width,
        margin,
        color,
        background,
        errorLevel,
      });
      return success(res, {
        message: "QR Code generated",
        base64: dataUri,
        text,
      });
    }

    const filename = generateFilename("qrcode", "png");
    const filePath = getFilePath(filename);
    fs.writeFileSync(filePath, buffer);

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return success(res, {
      message: "QR Code generated",
      file_url: `${baseUrl}/output/${filename}`,
      filename,
      text,
    });
  } catch (err) {
    console.error("[QR] Error:", err.message);
    return error(res, "Failed to generate QR Code", err.message, 500);
  }
});

// ─── Barcode → Image ────────────────────────────────────────
router.post("/barcode", async (req, res) => {
  const { text, type, scale, height, includetext, color, background, format } =
    req.body;

  if (!text) {
    return error(res, "text is required");
  }

  const barcodeType = BARCODE_TYPES.includes(type) ? type : "code128";

  try {
    const buffer = await generateBarcode(text, barcodeType, {
      scale,
      height,
      includetext,
      color,
      background,
    });

    if (format === "base64") {
      return success(res, {
        message: "Barcode generated",
        base64: `data:image/png;base64,${buffer.toString("base64")}`,
        text,
        type: barcodeType,
      });
    }

    const filename = generateFilename("barcode", "png");
    const filePath = getFilePath(filename);
    fs.writeFileSync(filePath, buffer);

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return success(res, {
      message: "Barcode generated",
      file_url: `${baseUrl}/output/${filename}`,
      filename,
      text,
      type: barcodeType,
      supported_types: BARCODE_TYPES,
    });
  } catch (err) {
    console.error("[Barcode] Error:", err.message);
    return error(res, "Failed to generate barcode", err.message, 500);
  }
});

// ─── QR Code embedded in PDF ─────────────────────────────────
router.post("/qr-pdf", async (req, res) => {
  const {
    text,
    title,
    description,
    width,
    color,
    filename,
    return_base64,
    password,
  } = req.body;

  if (!text) {
    return error(res, "text is required");
  }

  try {
    const qrDataUri = await generateQRDataUri(text, {
      width: width || 400,
      color,
    });

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  body { font-family: 'Segoe UI', Arial, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fff; }
  .card { text-align: center; padding: 40px; border: 2px solid #e5e7eb; border-radius: 16px; max-width: 500px; }
  .card h1 { font-size: 24px; color: #1f2937; margin-bottom: 8px; }
  .card p { font-size: 14px; color: #6b7280; margin-bottom: 24px; }
  .card img { display: block; margin: 0 auto 24px; }
  .card .text { font-family: monospace; font-size: 12px; color: #9ca3af; word-break: break-all; }
</style></head><body>
  <div class="card">
    ${title ? `<h1>${title}</h1>` : ""}
    ${description ? `<p>${description}</p>` : ""}
    <img src="${qrDataUri}" alt="QR Code" />
    <div class="text">${text}</div>
  </div>
</body></html>`;

    const pdfFilename = filename || generateFilename("qr-pdf");
    const pdfPath = getFilePath(pdfFilename);

    const renderResult = await renderPdf({ html }, pdfPath, {
      pageSize: "a4",
      return_base64,
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const responseData = {
      message: "QR PDF generated",
      file_url: `${baseUrl}/output/${pdfFilename}`,
      filename: pdfFilename,
      qr_text: text,
    };

    if (renderResult.base64) responseData.base64 = renderResult.base64;

    return success(res, responseData);
  } catch (err) {
    console.error("[QR-PDF] Error:", err.message);
    return error(res, "Failed to generate QR PDF", err.message, 500);
  }
});

module.exports = router;
