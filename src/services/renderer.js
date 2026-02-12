/**
 * Core Renderer Service
 *
 * Single point of truth for all rendering operations.
 * Supports: HTML→PDF, URL→PDF, HTML→Image, URL→Image
 *
 * Features: Watermark, CSS Injection, Base64 output
 */
const fs = require("fs");
const { createPage } = require("./browser");
const { PAGE_SIZES, IMAGE_FORMATS } = require("../config");

// ─── Helpers ────────────────────────────────────────────────

/**
 * Resolve page size from preset name or custom object
 */
function resolvePageSize(sizeInput) {
  if (!sizeInput) return PAGE_SIZES.thermal_default;
  if (typeof sizeInput === "string")
    return PAGE_SIZES[sizeInput] || PAGE_SIZES.thermal_default;
  return { ...PAGE_SIZES.thermal_default, ...sizeInput };
}

/**
 * Load content into a Puppeteer page (HTML string or URL)
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
 * Inject custom CSS into the page (for URL→PDF/Image customization)
 */
async function injectCss(page, css) {
  if (!css) return;
  await page.addStyleTag({ content: css });
}

/**
 * Inject watermark overlay into the page
 * @param {import('puppeteer').Page} page
 * @param {object} watermark - { text, opacity?, color?, fontSize?, rotate? }
 */
async function injectWatermark(page, watermark) {
  if (!watermark || !watermark.text) return;

  const text = watermark.text;
  const opacity = watermark.opacity || 0.12;
  const color = watermark.color || "#000000";
  const fontSize = watermark.fontSize || 60;
  const rotate = watermark.rotate !== undefined ? watermark.rotate : -35;

  await page.evaluate(
    (params) => {
      const div = document.createElement("div");
      div.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        display: flex; align-items: center; justify-content: center;
        pointer-events: none; z-index: 99999;
      `;
      div.innerHTML = `<span style="
        font-size: ${params.fontSize}px;
        color: ${params.color};
        opacity: ${params.opacity};
        transform: rotate(${params.rotate}deg);
        font-weight: bold;
        font-family: Arial, sans-serif;
        letter-spacing: 8px;
        white-space: nowrap;
        user-select: none;
      ">${params.text}</span>`;
      document.body.appendChild(div);
    },
    { text, opacity, color, fontSize, rotate },
  );
}

/**
 * Read file as base64 string
 */
function readAsBase64(filePath) {
  return fs.readFileSync(filePath).toString("base64");
}

// ─── Core Render Functions ──────────────────────────────────

/**
 * Render content to PDF
 *
 * @param {object} source - { html?: string, url?: string }
 * @param {string} outputPath - absolute path to save the PDF
 * @param {object} options
 * @param {string} options.pageSize - preset name or custom { width, height }
 * @param {object} options.margin
 * @param {boolean} options.landscape
 * @param {string} options.inject_css - custom CSS to inject
 * @param {object} options.watermark - { text, opacity, color, fontSize, rotate }
 * @param {boolean} options.return_base64 - also return base64 string
 * @param {boolean} options.displayHeaderFooter
 * @param {string} options.headerTemplate
 * @param {string} options.footerTemplate
 * @returns {Promise<{ base64?: string }>}
 */
async function renderPdf(source, outputPath, options = {}) {
  const size = resolvePageSize(options.pageSize);
  const page = await createPage(size.viewport, 800);

  try {
    await loadContent(page, source, options);
    await injectCss(page, options.inject_css);
    await injectWatermark(page, options.watermark);

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

    if (size.height) {
      pdfOptions.width = size.width;
      pdfOptions.height = size.height;
    } else {
      pdfOptions.width = size.width;
    }

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

    const result = {};
    if (options.return_base64) {
      result.base64 = readAsBase64(outputPath);
    }
    return result;
  } finally {
    await page.close();
  }
}

/**
 * Render content to image (screenshot)
 *
 * @param {object} source - { html?: string, url?: string }
 * @param {string} outputPath
 * @param {object} options
 * @param {string} options.pageSize
 * @param {string} options.format - "png", "jpeg", "webp"
 * @param {number} options.quality - 0-100 (jpeg/webp only)
 * @param {boolean} options.fullPage
 * @param {string} options.inject_css
 * @param {object} options.watermark
 * @param {boolean} options.return_base64
 * @returns {Promise<{ base64?: string }>}
 */
async function renderImage(source, outputPath, options = {}) {
  const size = resolvePageSize(options.pageSize);
  const format = IMAGE_FORMATS.includes(options.format)
    ? options.format
    : "png";
  const page = await createPage(size.viewport, 800);

  try {
    await loadContent(page, source, options);
    await injectCss(page, options.inject_css);
    await injectWatermark(page, options.watermark);

    const screenshotOptions = {
      path: outputPath,
      type: format,
      fullPage: options.fullPage !== false,
    };

    if (format !== "png" && options.quality) {
      screenshotOptions.quality = Math.min(100, Math.max(0, options.quality));
    }

    await page.screenshot(screenshotOptions);

    const result = {};
    if (options.return_base64) {
      result.base64 = readAsBase64(outputPath);
    }
    return result;
  } finally {
    await page.close();
  }
}

module.exports = { renderPdf, renderImage, resolvePageSize };
