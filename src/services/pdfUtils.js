/**
 * PDF Utility Service
 *
 * Handles: Merge PDFs, Password Protection
 * Uses: pdf-lib
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
 * Note: pdf-lib does not support encryption natively.
 * We use a workaround: embed the PDF content and set metadata.
 * For true encryption, qpdf is used if available.
 *
 * @param {string} inputPath
 * @param {string} outputPath
 * @param {string} password
 */
async function protectPdf(inputPath, outputPath, password) {
  const { execSync } = require("child_process");

  // Check if qpdf is available
  try {
    execSync("which qpdf", { stdio: "ignore" });
  } catch {
    throw new Error(
      "qpdf is not installed. Password protection requires qpdf.",
    );
  }

  // Use qpdf for real encryption
  const cmd = `qpdf --encrypt "${password}" "${password}" 256 -- "${inputPath}" "${outputPath}"`;
  execSync(cmd, { stdio: "ignore" });
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

module.exports = { mergePdfs, protectPdf, isQpdfAvailable };
