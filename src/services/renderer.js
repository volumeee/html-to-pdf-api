/**
 * Core Renderer Service
 *
 * Single point of truth for all rendering operations.
 * Supports: HTML→PDF, URL→PDF, HTML→Image, URL→Image
 */
const path = require("path");
const { createPage } = require("./browser");
const { PAGE_SIZES, IMAGE_FORMATS } = require("../config");

/**
 * Resolve page size from preset name or custom object
 * @param {string|object} sizeInput
 * @returns {object} { width, height?, viewport }
 */
function resolvePageSize(sizeInput) {
  if (!sizeInput) return PAGE_SIZES.thermal_default;
  if (typeof sizeInput === "string")
    return PAGE_SIZES[sizeInput] || PAGE_SIZES.thermal_default;
  return { ...PAGE_SIZES.thermal_default, ...sizeInput };
}

/**
 * Load content into a Puppeteer page (HTML string or URL)
 * @param {import('puppeteer').Page} page
 * @param {object} source - { html?: string, url?: string }
 * @param {object} options - { waitUntil?: string }
 */
async function loadContent(page, source, options = {}) {
  const waitUntil = options.waitUntil || "networkidle0";

  if (source.url) {
    await page.goto(source.url, { waitUntil, timeout: 30000 });
  } else if (source.html) {
    await page.setContent(source.html, { waitUntil });
  } else {
    throw new Error("Either 'html' or 'url' must be provided.");
  }
}

/**
 * Render content to PDF
 *
 * @param {object} source - { html?: string, url?: string }
 * @param {string} outputPath - absolute path to save the PDF
 * @param {object} options
 * @param {string} options.pageSize - preset name or custom { width, height }
 * @param {object} options.margin - { top, bottom, left, right }
 * @param {boolean} options.landscape
 * @param {string} options.headerTemplate
 * @param {string} options.footerTemplate
 * @param {boolean} options.displayHeaderFooter
 */
async function renderPdf(source, outputPath, options = {}) {
  const size = resolvePageSize(options.pageSize);
  const page = await createPage(size.viewport, 800);

  try {
    await loadContent(page, source, options);

    const pdfOptions = {
      path: outputPath,
      printBackground: true,
      margin: options.margin || {
        top: "0",
        bottom: "0",
        left: "0",
        right: "0",
      },
    };

    // Set dimensions
    if (size.height) {
      pdfOptions.width = size.width;
      pdfOptions.height = size.height;
    } else {
      pdfOptions.width = size.width;
    }

    // Optional features
    if (options.landscape) pdfOptions.landscape = true;
    if (options.format) pdfOptions.format = options.format;

    if (options.displayHeaderFooter) {
      pdfOptions.displayHeaderFooter = true;
      pdfOptions.headerTemplate = options.headerTemplate || "";
      pdfOptions.footerTemplate = options.footerTemplate || "";
      pdfOptions.margin = options.margin || {
        top: "40px",
        bottom: "40px",
        left: "20px",
        right: "20px",
      };
    }

    await page.pdf(pdfOptions);
  } finally {
    await page.close();
  }
}

/**
 * Render content to image (screenshot)
 *
 * @param {object} source - { html?: string, url?: string }
 * @param {string} outputPath - absolute path to save the image
 * @param {object} options
 * @param {string} options.pageSize - preset name
 * @param {string} options.format - "png", "jpeg", "webp"
 * @param {number} options.quality - 0-100 (jpeg/webp only)
 * @param {boolean} options.fullPage - capture full scrollable page
 */
async function renderImage(source, outputPath, options = {}) {
  const size = resolvePageSize(options.pageSize);
  const format = IMAGE_FORMATS.includes(options.format)
    ? options.format
    : "png";
  const page = await createPage(size.viewport, 800);

  try {
    await loadContent(page, source, options);

    const screenshotOptions = {
      path: outputPath,
      type: format,
      fullPage: options.fullPage !== false,
    };

    if (format !== "png" && options.quality) {
      screenshotOptions.quality = Math.min(100, Math.max(0, options.quality));
    }

    await page.screenshot(screenshotOptions);
  } finally {
    await page.close();
  }
}

module.exports = { renderPdf, renderImage, resolvePageSize };
