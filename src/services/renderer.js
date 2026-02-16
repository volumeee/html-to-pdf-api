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
 * Supports two modes:
 *   - Single (default): one large centered text
 *   - Repeat/Tiling:    small text repeated diagonally across entire page
 *
 * @param {import('puppeteer').Page} page
 * @param {object} watermark - { text, opacity?, color?, fontSize?, rotate?, repeat? }
 *   repeat: boolean - if true, tile the text across the entire page
 */
async function injectWatermark(page, watermark) {
  if (!watermark || !watermark.text) return;

  const text = watermark.text;
  const opacity = watermark.opacity || 0.7;
  const color = watermark.color || "#000000";
  const rotate = watermark.rotate !== undefined ? watermark.rotate : -35;
  const repeat = watermark.repeat || false;

  // Default font size: 24px for repeat mode, 80px for single
  const fontSize = watermark.fontSize || (repeat ? 24 : 80);

  if (repeat) {
    // REPEAT/TILING MODE: wrap body content and overlay watermark
    await page.evaluate(
      (params) => {
        // Wrap all body children in a container so we can overlay watermark
        const wrapper = document.createElement("div");
        wrapper.style.cssText = "position:relative; overflow:hidden;";

        // Move all body children into wrapper
        while (document.body.firstChild) {
          wrapper.appendChild(document.body.firstChild);
        }
        document.body.appendChild(wrapper);

        // Measure the actual content height
        const pageH = wrapper.scrollHeight;
        const pageW = wrapper.scrollWidth || wrapper.offsetWidth;

        // Container covers 3x the page diagonal to fill after rotation
        const diagonal = Math.sqrt(pageW * pageW + pageH * pageH);
        const size = diagonal * 2;

        const container = document.createElement("div");
        container.style.cssText = `
          position: absolute;
          top: 50%;
          left: 50%;
          width: ${size}px;
          height: ${size}px;
          margin-top: ${-size / 2}px;
          margin-left: ${-size / 2}px;
          pointer-events: none;
          z-index: 99999;
          display: flex;
          flex-wrap: wrap;
          align-content: flex-start;
          align-items: flex-start;
          transform: rotate(${params.rotate}deg);
          overflow: hidden;
        `;

        // Build spans
        const spanStyle = `
          display:inline-block;
          font-size:${params.fontSize}px;
          color:${params.color};
          opacity:${params.opacity};
          font-weight:600;
          font-family:Arial,Helvetica,sans-serif;
          white-space:nowrap;
          user-select:none;
          padding:4px 16px;
          line-height:2.2;
        `;

        // Calculate items needed to fill the rotated area
        const charWidth = params.fontSize * 0.6;
        const spanWidth = params.text.length * charWidth + 32;
        const rowHeight = params.fontSize * 2.2;
        const cols = Math.ceil(size / spanWidth) + 2;
        const rows = Math.ceil(size / rowHeight) + 2;
        const total = cols * rows;

        const spans = [];
        for (let i = 0; i < total; i++) {
          spans.push(`<span style="${spanStyle}">${params.text}</span>`);
        }

        container.innerHTML = spans.join("");
        wrapper.appendChild(container);
      },
      { text, opacity, color, fontSize, rotate },
    );
  } else {
    // SINGLE MODE: one large centered text
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
}

/**
 * Inject Logo into the rendered page
 * Supports: URL, Base64, local data URI
 * Universal: works for any HTML/URL source
 */
async function injectLogo(page, logoConfig) {
  if (!logoConfig || !logoConfig.src) return;

  const config = {
    src: logoConfig.src,
    width: logoConfig.width || "100px",
    height: logoConfig.height || "auto",
    position: logoConfig.position || "top-center",
    opacity: logoConfig.opacity !== undefined ? logoConfig.opacity : 1,
    grayscale: logoConfig.grayscale || false,
    margin: logoConfig.margin || "0 0 15px 0",
  };

  await page.evaluate(async (params) => {
    const container = document.createElement("div");
    const pos = params.position;

    // Build Style
    let containerStyle = `
      pointer-events: none;
      opacity: ${params.opacity};
      clear: both;
      display: block;
      width: 100%;
      box-sizing: border-box;
    `;

    let imgStyle = `
      width: ${params.width};
      height: ${params.height};
      filter: ${params.grayscale ? "grayscale(1)" : "none"};
      display: inline-block;
      vertical-align: middle;
    `;

    // Position Logic
    if (pos === "center") {
      containerStyle += `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1000000;
        text-align: center;
      `;
    } else if (pos.includes("top")) {
      containerStyle += `
        text-align: ${pos === "top-center" ? "center" : pos === "top-right" ? "right" : "left"};
        padding: ${params.margin};
        position: relative;
        z-index: 1000000;
      `;
    } else if (pos.includes("bottom")) {
      containerStyle += `
        text-align: ${pos === "bottom-center" ? "center" : pos === "bottom-right" ? "right" : "left"};
        padding: ${params.margin};
        position: relative;
        z-index: 1000000;
      `;
    }

    container.style.cssText = containerStyle;
    container.innerHTML = `<img id="injected-logo" src="${params.src}" style="${imgStyle}" />`;

    console.log(`[BROWSER] Injecting logo to body (${pos})...`);

    // FORCE BODY TO SHOW OVERFLOW
    document.body.style.overflow = "visible";
    document.body.style.position = "relative";

    if (pos === "center" || pos.includes("bottom")) {
      document.body.appendChild(container);
    } else {
      // Use insertAdjacentElement 'afterbegin' to ensure it's at the very top
      document.body.insertAdjacentElement("afterbegin", container);
    }

    // WAIT FOR IMAGE TO LOAD (BETTER)
    const img = container.querySelector("img");
    if (img) {
      if (img.complete && img.naturalWidth > 0) {
        console.log(
          `[BROWSER] Logo already loaded (${img.naturalWidth}x${img.naturalHeight})`,
        );
        return "already_loaded";
      }

      console.log("[BROWSER] Waiting for logo to load...");
      return new Promise((resolve) => {
        img.onload = () => {
          console.log(
            `[BROWSER] Logo loaded successfully (${img.naturalWidth}x${img.naturalHeight})`,
          );
          resolve("loaded");
        };
        img.onerror = () => {
          console.error("[BROWSER] Logo failed to load!");
          resolve("error");
        };
        setTimeout(() => {
          console.warn("[BROWSER] Logo load timeout (5s)");
          resolve("timeout");
        }, 5000);
      });
    }
    return "no_img";
  }, config);
}

/**
 * Inject QR Code into the rendered page
 * Uses display:block + margin:0 auto for centering (simplest & most reliable method)
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

  // First, ensure body doesn't allow overflow (prevents wide elements from expanding page width)
  await page.evaluate(() => {
    document.body.style.overflowX = "hidden";
  });

  await page.evaluate(
    (params) => {
      const container = document.createElement("div");
      const pos = params.position;

      // Determine alignment
      let imgStyle, labelStyle;
      if (pos.includes("right")) {
        imgStyle = "display:block; margin-left:auto; margin-right:0;";
        labelStyle = "text-align:right;";
      } else if (pos.includes("left")) {
        imgStyle = "display:block; margin-left:0; margin-right:auto;";
        labelStyle = "text-align:left;";
      } else {
        // CENTER - using display:block + margin:auto (the most reliable centering)
        imgStyle = "display:block; margin-left:auto; margin-right:auto;";
        labelStyle = "text-align:center;";
      }

      const imgHtml = `<img src="${params.dataUri}" width="${params.width}" height="${params.width}" style="${imgStyle}" />`;
      const labelHtml = params.label
        ? `<div style="font-size:8px; color:#555; font-family:Arial,sans-serif; margin-top:4px; ${labelStyle} word-break:break-word;">${params.label}</div>`
        : "";

      if (pos === "center") {
        // Center overlay (absolutely positioned)
        container.style.cssText =
          "position:fixed; top:50%; left:50%; transform:translate(-50%,-50%); z-index:99998; text-align:center; padding:8px; background:#fff; border-radius:6px; box-shadow:0 2px 8px rgba(0,0,0,0.2); border:1px solid #ddd;";
        container.innerHTML = imgHtml + labelHtml;
        document.body.appendChild(container);
      } else if (pos.includes("top")) {
        container.style.cssText =
          "clear:both; margin-bottom:12px; padding:8px 0;";
        container.innerHTML = imgHtml + labelHtml;
        document.body.insertBefore(container, document.body.firstChild);
      } else {
        // Bottom positions or default
        container.style.cssText = "clear:both; margin-top:16px; padding:8px 0;";
        container.innerHTML = imgHtml + labelHtml;
        document.body.appendChild(container);
      }
    },
    { dataUri, width, label, position },
  );
}

/**
 * Inject Barcode into the rendered page
 * Uses display:block + margin:0 auto for centering
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

  // Ensure body doesn't allow overflow
  await page.evaluate(() => {
    document.body.style.overflowX = "hidden";
  });

  await page.evaluate(
    (params) => {
      const container = document.createElement("div");
      const imgHtml = `<img src="${params.dataUri}" style="display:block; margin-left:auto; margin-right:auto; max-width:100%;" />`;
      const labelHtml = params.label
        ? `<div style="font-size:9px; color:#555; font-family:Arial,sans-serif; margin-top:4px; text-align:center;">${params.label}</div>`
        : "";

      if (params.position === "top-center") {
        container.style.cssText =
          "clear:both; margin-bottom:12px; padding:8px 0;";
        container.innerHTML = imgHtml + labelHtml;
        document.body.insertBefore(container, document.body.firstChild);
      } else {
        container.style.cssText = "clear:both; margin-top:16px; padding:8px 0;";
        container.innerHTML = imgHtml + labelHtml;
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
    // Watermark injected AFTER height measurement for thermal (see below)
    await injectLogo(page, options.logo);
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
      // Fixed-height pages (A4, letter, label, etc.)
      pdfOptions.width = size.width;
      pdfOptions.height = size.height;
    } else {
      // Thermal/receipt: measure actual content height BEFORE watermark injection
      pdfOptions.width = size.width;
      const contentHeight = await page.evaluate(() => {
        return Math.max(
          document.body.scrollHeight,
          document.body.offsetHeight,
          document.documentElement.scrollHeight,
          document.documentElement.offsetHeight,
        );
      });
      // Set height to actual content + small padding to prevent clipping
      pdfOptions.height = `${contentHeight + 20}px`;
    }

    // Inject watermark AFTER height measurement so it doesn't inflate page size
    await injectWatermark(page, options.watermark);

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
    await injectLogo(page, options.logo);
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
