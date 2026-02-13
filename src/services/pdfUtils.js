/**
 * PDF Utility Service
 *
 * Handles: Merge PDFs, Password Protection, Compression
 * Uses: pdf-lib, qpdf (system), ghostscript (system)
 */
const fs = require("fs");
const { PDFDocument } = require("pdf-lib");

/**
 * Merge multiple PDF files into one
 * @param {string[]} inputPaths - array of absolute paths to PDF files
 * @param {string} outputPath - absolute path for the merged PDF
 */
async function mergePdfs(inputPaths, outputPath) {
  const mergedPdf = await PDFDocument.create();

  for (const filePath of inputPaths) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const pdfBytes = fs.readFileSync(filePath);
    const pdf = await PDFDocument.load(pdfBytes);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

    for (const page of pages) {
      mergedPdf.addPage(page);
    }
  }

  const mergedBytes = await mergedPdf.save();
  fs.writeFileSync(outputPath, mergedBytes);
}

/**
 * Add password protection to a PDF (user password)
 *
 * @param {string} inputPath
 * @param {string} outputPath
 * @param {string} password
 */
async function protectPdf(inputPath, outputPath, password) {
  const { execSync } = require("child_process");

  if (!isQpdfAvailable()) {
    throw new Error(
      "qpdf is not installed. Password protection requires qpdf.",
    );
  }

  const cmd = `qpdf --encrypt "${password}" "${password}" 256 -- "${inputPath}" "${outputPath}"`;
  execSync(cmd, { stdio: "ignore" });
}

/**
 * Compress a PDF file to reduce size
 *
 * Strategy:
 *   1. Try qpdf linearize + object streams (lossless, fast)
 *   2. If ghostscript available, use for deeper compression
 *   3. Fallback to pdf-lib re-save (basic optimization)
 *
 * @param {string} inputPath
 * @param {string} outputPath
 * @param {object} [options]
 * @param {string} [options.quality] - "screen" (72dpi), "ebook" (150dpi), "printer" (300dpi), "default"
 * @returns {Promise<{ original_size: number, compressed_size: number, reduction_percent: number, method: string }>}
 */
async function compressPdf(inputPath, outputPath, options = {}) {
  const originalSize = fs.statSync(inputPath).size;
  const quality = options.quality || "ebook";
  let method = "none";

  // Strategy 1: Try Ghostscript for deep compression
  if (isGhostscriptAvailable()) {
    try {
      const { execSync } = require("child_process");
      const gsQuality = {
        screen: "/screen", // 72 dpi — smallest
        ebook: "/ebook", // 150 dpi — good balance
        printer: "/printer", // 300 dpi — high quality
        default: "/default", // minimal compression
      };
      const setting = gsQuality[quality] || gsQuality.ebook;

      const cmd = `gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${setting} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`;
      execSync(cmd, { stdio: "ignore", timeout: 60000 });
      method = `ghostscript (${quality})`;
    } catch (err) {
      // Ghostscript failed, try next method
      console.warn("[PDF] Ghostscript compression failed:", err.message);
    }
  }

  // Strategy 2: Try qpdf linearize (lossless)
  if (method === "none" && isQpdfAvailable()) {
    try {
      const { execSync } = require("child_process");
      const cmd = `qpdf --linearize --object-streams=generate "${inputPath}" "${outputPath}"`;
      execSync(cmd, { stdio: "ignore", timeout: 30000 });
      method = "qpdf (linearize)";
    } catch (err) {
      console.warn("[PDF] qpdf compression failed:", err.message);
    }
  }

  // Strategy 3: Fallback — pdf-lib re-save
  if (method === "none") {
    try {
      const pdfBytes = fs.readFileSync(inputPath);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const optimizedBytes = await pdfDoc.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });
      fs.writeFileSync(outputPath, optimizedBytes);
      method = "pdf-lib (re-save)";
    } catch (err) {
      // If all methods fail, just copy the file
      fs.copyFileSync(inputPath, outputPath);
      method = "copy (no compression available)";
    }
  }

  const compressedSize = fs.statSync(outputPath).size;
  const reductionPercent =
    originalSize > 0
      ? Math.round(((originalSize - compressedSize) / originalSize) * 100)
      : 0;

  return {
    original_size: originalSize,
    compressed_size: compressedSize,
    reduction_percent: Math.max(0, reductionPercent),
    method,
  };
}

/**
 * Check if qpdf is available on the system
 * @returns {boolean}
 */
function isQpdfAvailable() {
  try {
    const { execSync } = require("child_process");
    execSync("which qpdf", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if ghostscript is available on the system
 * @returns {boolean}
 */
function isGhostscriptAvailable() {
  try {
    const { execSync } = require("child_process");
    execSync("which gs", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  mergePdfs,
  protectPdf,
  compressPdf,
  isQpdfAvailable,
  isGhostscriptAvailable,
};
