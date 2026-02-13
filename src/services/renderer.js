/**
 * Core Renderer Service
 *
 * Single point of truth for all rendering operations.
 * Supports: HTML→PDF, URL→PDF, HTML→Image, URL→Image
 *
 * Features: Watermark, CSS Injection, QR/Barcode Injection, Chart/Table Injection, Base64 output
 */
const fs = require("fs");
const { createPage } = require("./browser");
const { PAGE_SIZES, IMAGE_FORMATS } = require("../config");
const { generateQRDataUri, generateBarcode } = require("./qrBarcode");

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
 * Inject QR Code into the rendered page
 */
async function injectQrCode(page, qrConfig) {
  if (!qrConfig || !qrConfig.text) return;

  const dataUri = await generateQRDataUri(qrConfig.text, {
    width: qrConfig.width || 120,
    margin: qrConfig.margin !== undefined ? qrConfig.margin : 1,
    color: qrConfig.color || "#000000",
    background: qrConfig.background || "#ffffff",
  });

  const position = qrConfig.position || "bottom-right";
  const width = qrConfig.width || 120;
  const label = qrConfig.label || "";

  await page.evaluate(
    (params) => {
      const container = document.createElement("div");
      // Use absolute bulletproof centering: Table with 100% width and center align
      const imgHtml = `<img src="${params.dataUri}" width="${params.width}" height="${params.width}" style="display:inline-block; vertical-align:top;" />`;
      const labelHtml = params.label
        ? `<div style="font-size:8px; color:#555; font-family:Arial,sans-serif; margin-top:4px; text-align:center;">${params.label}</div>`
        : "";

      const pos = params.position;
      const align = pos.includes("right")
        ? "right"
        : pos.includes("left")
          ? "left"
          : "center";

      const content = `<div style="display:inline-block; text-align:center;">${imgHtml}${labelHtml}</div>`;
      const tableWrapper = `
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:16px 0; clear:both; border-collapse:collapse;">
          <tr>
            <td align="${align}" style="padding:0;">${content}</td>
          </tr>
        </table>
      `;

      if (pos.includes("top")) {
        container.innerHTML = tableWrapper;
        document.body.insertBefore(container, document.body.firstChild);
      } else if (pos === "center") {
        container.style.cssText =
          "position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:99998; text-align:center; padding:8px; background:#fff; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,0.2); border:1px solid #ddd;";
        container.innerHTML = content;
        document.body.appendChild(container);
      } else {
        // Bottom positions or default
        container.innerHTML = tableWrapper;
        document.body.appendChild(container);
      }
    },
    { dataUri, width, label, position },
  );
}

/**
 * Inject Barcode into the rendered page
 */
async function injectBarcode(page, barcodeConfig) {
  if (!barcodeConfig || !barcodeConfig.text) return;

  const buffer = await generateBarcode(
    barcodeConfig.text,
    barcodeConfig.type || "code128",
    {
      scale: barcodeConfig.scale || 2,
      height: barcodeConfig.height || 8,
      includetext: barcodeConfig.includetext !== false,
    },
  );
  const dataUri = `data:image/png;base64,${buffer.toString("base64")}`;
  const position = barcodeConfig.position || "inline";
  const label = barcodeConfig.label || "";

  await page.evaluate(
    (params) => {
      const container = document.createElement("div");
      const imgHtml = `<img src="${params.dataUri}" style="display:inline-block; vertical-align:top; max-width:100%;" />`;
      const labelHtml = params.label
        ? `<div style="font-size:9px; color:#555; font-family:Arial,sans-serif; margin-top:4px; text-align:center;">${params.label}</div>`
        : "";

      const align = params.position.includes("right")
        ? "right"
        : params.position.includes("left")
          ? "left"
          : "center";
      const tableWrapper = `
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin:16px 0; clear:both; border-collapse:collapse;">
          <tr>
            <td align="${align}" style="padding:0;">
              <div style="display:inline-block; text-align:center;">${imgHtml}${labelHtml}</div>
            </td>
          </tr>
        </table>
      `;

      if (params.position === "top-center") {
        container.innerHTML = tableWrapper;
        document.body.insertBefore(container, document.body.firstChild);
      } else {
        container.innerHTML = tableWrapper;
        document.body.appendChild(container);
      }
    },
    { dataUri, label, position },
  );
}

/**
 * Inject Chart into the rendered page
 */
async function injectChart(page, chartConfig) {
  if (!chartConfig || !chartConfig.data) return;

  const { generateChartImage } = require("./chart");
  const dataUri = await generateChartImage(chartConfig.data, {
    width: chartConfig.width,
    height: chartConfig.height,
    background: chartConfig.background,
  });

  const position = chartConfig.position || "inline";

  await page.evaluate(
    (params) => {
      const container = document.createElement("div");
      container.innerHTML = `<img src="${params.dataUri}" style="display:block; max-width:100%; height:auto; margin:0 auto;" />`;

      if (params.position === "top-center") {
        container.style.cssText = "text-align:center; margin-bottom:20px;";
        document.body.insertBefore(container, document.body.firstChild);
      } else {
        container.style.cssText =
          "text-align:center; margin-top:20px; page-break-inside:avoid;";
        document.body.appendChild(container);
      }
    },
    { dataUri, position },
  );
}

/**
 * Inject Table into the rendered page
 */
async function injectTable(page, tableConfig) {
  if (!tableConfig || !tableConfig.data || !Array.isArray(tableConfig.data))
    return;

  const { generateTableHtml } = require("./table");
  const tableHtml = generateTableHtml(tableConfig.data, tableConfig.options);
  const position = tableConfig.position || "inline";

  await page.evaluate(
    (params) => {
      const container = document.createElement("div");
      container.innerHTML = params.tableHtml;

      if (params.position === "top-center") {
        container.style.cssText = "margin-bottom:20px;";
        document.body.insertBefore(container, document.body.firstChild);
      } else {
        container.style.cssText = "margin-top:20px;";
        document.body.appendChild(container);
      }
    },
    { tableHtml, position },
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
 */
async function renderPdf(source, outputPath, options = {}) {
  const size = resolvePageSize(options.pageSize);
  const page = await createPage(size.viewport, 800);

  try {
    await loadContent(page, source, options);
    await injectCss(page, options.inject_css);
    await injectWatermark(page, options.watermark);
    await injectChart(page, options.chart);
    await injectTable(page, options.table);
    await injectQrCode(page, options.qr_code);
    await injectBarcode(page, options.barcode);

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
    await injectChart(page, options.chart);
    await injectTable(page, options.table);
    await injectQrCode(page, options.qr_code);
    await injectBarcode(page, options.barcode);

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
