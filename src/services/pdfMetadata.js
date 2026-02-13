/**
 * PDF Metadata Service
 *
 * Adds metadata (title, author, subject, keywords, creator) to PDF files.
 * Uses pdf-lib for modification.
 */
const fs = require("fs");
const { PDFDocument } = require("pdf-lib");

/**
 * Set metadata on a PDF file
 *
 * @param {string} filePath - Absolute path to the PDF file
 * @param {object} metadata
 * @param {string} [metadata.title] - Document title
 * @param {string} [metadata.author] - Author name
 * @param {string} [metadata.subject] - Document subject
 * @param {string} [metadata.keywords] - Keywords (comma-separated)
 * @param {string} [metadata.creator] - Creator application name
 * @param {string} [metadata.producer] - PDF producer name
 * @param {Date}   [metadata.creation_date] - Creation date
 * @param {Date}   [metadata.modification_date] - Modification date
 */
async function setMetadata(filePath, metadata = {}) {
  if (!metadata || Object.keys(metadata).length === 0) return;

  const pdfBytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  if (metadata.title) pdfDoc.setTitle(metadata.title);
  if (metadata.author) pdfDoc.setAuthor(metadata.author);
  if (metadata.subject) pdfDoc.setSubject(metadata.subject);
  if (metadata.keywords) {
    const kw = Array.isArray(metadata.keywords)
      ? metadata.keywords
      : metadata.keywords.split(",").map((k) => k.trim());
    pdfDoc.setKeywords(kw);
  }
  if (metadata.creator) pdfDoc.setCreator(metadata.creator);
  if (metadata.producer) pdfDoc.setProducer(metadata.producer);

  if (metadata.creation_date) {
    pdfDoc.setCreationDate(new Date(metadata.creation_date));
  }
  if (metadata.modification_date) {
    pdfDoc.setModificationDate(new Date(metadata.modification_date));
  }

  // Always set modification date to now
  pdfDoc.setModificationDate(new Date());

  // Default producer
  if (!metadata.producer) {
    pdfDoc.setProducer("HTML to PDF API v7.2.1");
  }

  const modifiedBytes = await pdfDoc.save();
  fs.writeFileSync(filePath, modifiedBytes);
}

/**
 * Get metadata from a PDF file
 *
 * @param {string} filePath - Absolute path to the PDF file
 * @returns {object} Metadata object
 */
async function getMetadata(filePath) {
  const pdfBytes = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  return {
    title: pdfDoc.getTitle() || null,
    author: pdfDoc.getAuthor() || null,
    subject: pdfDoc.getSubject() || null,
    keywords: pdfDoc.getKeywords() || null,
    creator: pdfDoc.getCreator() || null,
    producer: pdfDoc.getProducer() || null,
    creation_date: pdfDoc.getCreationDate()?.toISOString() || null,
    modification_date: pdfDoc.getModificationDate()?.toISOString() || null,
    page_count: pdfDoc.getPageCount(),
  };
}

module.exports = { setMetadata, getMetadata };
