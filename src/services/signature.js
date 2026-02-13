/**
 * Digital Signature Service
 *
 * Handles embedding signature stamp images into PDFs.
 * Supports: image overlay (stamp), text signature, and combined.
 *
 * Uses pdf-lib for manipulation.
 */
const fs = require("fs");
const path = require("path");
const { PDFDocument } = require("pdf-lib");

const SIGNATURES_DIR = path.join(__dirname, "../../data/signatures");

// Ensure signatures directory exists
try {
  if (!fs.existsSync(SIGNATURES_DIR)) {
    fs.mkdirSync(SIGNATURES_DIR, { recursive: true });
  }
} catch (err) {
  console.warn("[Signature] Could not create signatures dir:", err.message);
}

/**
 * Save a signature stamp image (base64 encoded)
 * @param {string} name - signature name (e.g., "ceo", "finance")
 * @param {string} base64Data - base64 encoded image data (PNG or JPG)
 * @returns {object} signature metadata
 */
function saveSignature(name, base64Data) {
  const sanitized = name.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();

  // Detect image format from base64 header
  let ext = "png";
  let rawBase64 = base64Data;

  if (base64Data.startsWith("data:image/")) {
    const match = base64Data.match(/^data:image\/(png|jpe?g|webp);base64,/);
    if (match) {
      ext = match[1] === "jpeg" || match[1] === "jpg" ? "jpg" : match[1];
      rawBase64 = base64Data.split(",")[1];
    }
  }

  const filename = `${sanitized}.${ext}`;
  const filepath = path.join(SIGNATURES_DIR, filename);

  fs.writeFileSync(filepath, Buffer.from(rawBase64, "base64"));

  return {
    name: sanitized,
    filename,
    path: filepath,
    created_at: new Date().toISOString(),
  };
}

/**
 * List all saved signatures
 * @returns {Array} signature list
 */
function listSignatures() {
  if (!fs.existsSync(SIGNATURES_DIR)) return [];

  return fs
    .readdirSync(SIGNATURES_DIR)
    .filter((f) => /\.(png|jpg|jpeg|webp)$/i.test(f))
    .map((f) => {
      const stats = fs.statSync(path.join(SIGNATURES_DIR, f));
      return {
        name: path.basename(f, path.extname(f)),
        filename: f,
        size_kb: Math.round(stats.size / 1024),
        created_at: stats.birthtime,
      };
    });
}

/**
 * Delete a signature
 * @param {string} name
 * @returns {boolean}
 */
function deleteSignature(name) {
  const files = fs.readdirSync(SIGNATURES_DIR);
  const match = files.find(
    (f) =>
      path.basename(f, path.extname(f)).toLowerCase() === name.toLowerCase(),
  );

  if (match) {
    fs.unlinkSync(path.join(SIGNATURES_DIR, match));
    return true;
  }
  return false;
}

/**
 * Embed a signature stamp onto a PDF
 *
 * @param {string} inputPath - path to the source PDF
 * @param {string} outputPath - path to save the signed PDF
 * @param {object} options
 * @param {string} options.signature_name - name of saved signature to use
 * @param {string} options.signature_base64 - OR raw base64 image data
 * @param {string} options.position - "bottom-right" (default), "bottom-left", "bottom-center", "top-right", "top-left", "top-center", "center", "custom"
 * @param {number} options.page - page number to sign (0 = last page, 1-based; default = last)
 * @param {number} options.width - signature width in points (default 120)
 * @param {number} options.height - signature height in points (default 60)
 * @param {number} options.x - custom x position (only if position = "custom")
 * @param {number} options.y - custom y position (only if position = "custom")
 * @param {number} options.opacity - 0.0 to 1.0 (default 1.0)
 * @returns {Promise<void>}
 */
async function embedSignature(inputPath, outputPath, options = {}) {
  const pdfBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  // Get signature image bytes
  let imgBytes;
  let imgType = "png";

  if (options.signature_name) {
    // Load from saved signatures
    const files = fs.readdirSync(SIGNATURES_DIR);
    const match = files.find(
      (f) =>
        path.basename(f, path.extname(f)).toLowerCase() ===
        options.signature_name.toLowerCase(),
    );
    if (!match)
      throw new Error(`Signature "${options.signature_name}" not found`);

    imgBytes = fs.readFileSync(path.join(SIGNATURES_DIR, match));
    imgType = path.extname(match).slice(1).toLowerCase();
    if (imgType === "jpeg") imgType = "jpg";
  } else if (options.signature_base64) {
    let raw = options.signature_base64;
    if (raw.startsWith("data:image/")) {
      const match = raw.match(/^data:image\/(png|jpe?g);base64,/);
      if (match) {
        imgType = match[1] === "jpeg" ? "jpg" : match[1];
        raw = raw.split(",")[1];
      }
    }
    imgBytes = Buffer.from(raw, "base64");
  } else {
    throw new Error("Provide signature_name or signature_base64");
  }

  // Embed image
  let img;
  if (imgType === "jpg") {
    img = await pdfDoc.embedJpg(imgBytes);
  } else {
    img = await pdfDoc.embedPng(imgBytes);
  }

  // Determine page
  const pages = pdfDoc.getPages();
  let pageIndex;
  if (!options.page || options.page === 0) {
    pageIndex = pages.length - 1; // last page
  } else {
    pageIndex = Math.min(options.page - 1, pages.length - 1);
  }
  const page = pages[pageIndex];
  const { width: pageW, height: pageH } = page.getSize();

  // Signature dimensions
  const sigW = options.width || 120;
  const sigH = options.height || 60;
  const margin = 30;
  const opacity = options.opacity !== undefined ? options.opacity : 1.0;

  // Calculate position
  let x, y;
  const position = options.position || "bottom-right";

  switch (position) {
    case "bottom-right":
      x = pageW - sigW - margin;
      y = margin;
      break;
    case "bottom-left":
      x = margin;
      y = margin;
      break;
    case "bottom-center":
      x = (pageW - sigW) / 2;
      y = margin;
      break;
    case "top-right":
      x = pageW - sigW - margin;
      y = pageH - sigH - margin;
      break;
    case "top-left":
      x = margin;
      y = pageH - sigH - margin;
      break;
    case "top-center":
      x = (pageW - sigW) / 2;
      y = pageH - sigH - margin;
      break;
    case "center":
      x = (pageW - sigW) / 2;
      y = (pageH - sigH) / 2;
      break;
    case "custom":
      x = options.x || margin;
      y = options.y || margin;
      break;
    default:
      x = pageW - sigW - margin;
      y = margin;
  }

  // Draw signature
  page.drawImage(img, {
    x,
    y,
    width: sigW,
    height: sigH,
    opacity,
  });

  // Save
  const signedBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, signedBytes);
}

module.exports = {
  saveSignature,
  listSignatures,
  deleteSignature,
  embedSignature,
};
