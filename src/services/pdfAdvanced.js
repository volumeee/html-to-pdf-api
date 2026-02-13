/**
 * PDF Advanced Operations (Split, Extract, Form Fill)
 */
const { PDFDocument } = require("pdf-lib");
const fs = require("fs");
const path = require("path");

/**
 * Extract specific pages from a PDF
 *
 * @param {string} inputPath - Path to source PDF
 * @param {string} outputPath - Path to save the extracted PDF
 * @param {Array<number>} pages - Array of page indices (0-based) or ranges (e.g., "1-3")
 */
async function extractPages(inputPath, outputPath, pagesRequested) {
  const existingPdfBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const newPdfDoc = await PDFDocument.create();

  const totalPages = pdfDoc.getPageCount();
  const pagesToExtract = [];

  // Parse pages requested (support individual numbers and ranges like "1-3")
  pagesRequested.forEach((p) => {
    if (typeof p === "number") {
      if (p >= 0 && p < totalPages) pagesToExtract.push(p);
    } else if (typeof p === "string" && p.includes("-")) {
      const [start, end] = p.split("-").map(Number);
      for (let i = start; i <= end; i++) {
        if (i >= 0 && i < totalPages) pagesToExtract.push(i);
      }
    }
  });

  // Copy pages
  const copiedPages = await newPdfDoc.copyPages(pdfDoc, pagesToExtract);
  copiedPages.forEach((page) => newPdfDoc.addPage(page));

  const pdfBytes = await newPdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);

  return {
    page_count: pagesToExtract.length,
    original_pages: pagesToExtract,
  };
}

/**
 * Split a PDF into individual pages
 */
async function splitPdf(inputPath, outputDir, prefix = "page") {
  const existingPdfBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);
  const totalPages = pdfDoc.getPageCount();
  const results = [];

  for (let i = 0; i < totalPages; i++) {
    const newPdfDoc = await PDFDocument.create();
    const [page] = await newPdfDoc.copyPages(pdfDoc, [i]);
    newPdfDoc.addPage(page);

    const filename = `${prefix}_${i + 1}.pdf`;
    const outputPath = path.join(outputDir, filename);
    const pdfBytes = await newPdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);

    results.push(filename);
  }

  return results;
}

module.exports = { extractPages, splitPdf };
