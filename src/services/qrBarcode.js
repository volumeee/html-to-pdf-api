/**
 * QR Code & Barcode Generation Service
 *
 * Supports: QR Code, Code128, EAN13, EAN8, UPC, ITF, Code39, etc.
 */
const QRCode = require("qrcode");
const bwipjs = require("bwip-js");

/**
 * Generate QR Code as Data-URI (base64 PNG)
 * @param {string} text - Content to encode
 * @param {object} options - { width, margin, color, background }
 * @returns {Promise<string>} base64 data URI
 */
async function generateQR(text, options = {}) {
  const qrOptions = {
    type: "png",
    width: options.width || 300,
    margin: options.margin !== undefined ? options.margin : 2,
    color: {
      dark: options.color || "#000000",
      light: options.background || "#ffffff",
    },
    errorCorrectionLevel: options.errorLevel || "M",
  };

  const buffer = await QRCode.toBuffer(text, qrOptions);
  return buffer;
}

/**
 * Generate QR Code as Data URI string
 */
async function generateQRDataUri(text, options = {}) {
  const qrOptions = {
    width: options.width || 300,
    margin: options.margin !== undefined ? options.margin : 2,
    color: {
      dark: options.color || "#000000",
      light: options.background || "#ffffff",
    },
    errorCorrectionLevel: options.errorLevel || "M",
  };

  return QRCode.toDataURL(text, qrOptions);
}

/**
 * Generate Barcode as PNG buffer
 * @param {string} text - Content to encode
 * @param {string} type - Barcode type (code128, ean13, qrcode, etc.)
 * @param {object} options - { scale, height, includetext }
 * @returns {Promise<Buffer>} PNG buffer
 */
async function generateBarcode(text, type = "code128", options = {}) {
  const bwipOptions = {
    bcid: type,
    text: text,
    scale: options.scale || 3,
    height: options.height || 10,
    includetext: options.includetext !== false,
    textxalign: "center",
  };

  if (options.color) bwipOptions.barcolor = options.color.replace("#", "");
  if (options.background)
    bwipOptions.backgroundcolor = options.background.replace("#", "");

  return bwipjs.toBuffer(bwipOptions);
}

/**
 * Supported barcode types
 */
const BARCODE_TYPES = [
  "code128",
  "ean13",
  "ean8",
  "upca",
  "upce",
  "itf14",
  "code39",
  "code93",
  "datamatrix",
  "pdf417",
  "qrcode",
];

module.exports = {
  generateQR,
  generateQRDataUri,
  generateBarcode,
  BARCODE_TYPES,
};
