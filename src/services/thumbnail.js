/**
 * PDF Thumbnail Service
 *
 * Generates thumbnail preview images from PDF files.
 * Uses the existing Puppeteer browser instance.
 */
const fs = require("fs");
const path = require("path");
const { createPage } = require("./browser");

const THUMB_WIDTH = 200;
const THUMB_HEIGHT = 283; // A4 aspect ratio

/**
 * Generate a thumbnail (PNG) from the first page of a PDF.
 *
 * @param {string} pdfPath - Absolute path to the PDF file
 * @param {string} thumbPath - Output path for the thumbnail image
 * @param {object} [options]
 * @param {number} [options.width=200] - Thumbnail width in pixels
 * @param {number} [options.height=283] - Thumbnail height (auto if not provided)
 * @param {number} [options.page=1] - Which page to thumbnail (1-based)
 * @param {string} [options.format="png"] - Output format (png, jpeg, webp)
 * @param {number} [options.quality=80] - Quality for jpeg/webp (0-100)
 * @returns {Promise<{ width: number, height: number, format: string, size: number }>}
 */
async function generateThumbnail(pdfPath, thumbPath, options = {}) {
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`PDF file not found: ${pdfPath}`);
  }

  const width = options.width || THUMB_WIDTH;
  const height = options.height || Math.round(width * 1.414); // A4 ratio
  const pageNum = options.page || 1;
  const format = options.format || "png";
  const quality = options.quality || 80;

  // Read PDF as base64 for data URI
  const pdfBase64 = fs.readFileSync(pdfPath).toString("base64");

  // Create a page that renders the PDF using embedded viewer
  const page = await createPage(width, height);

  try {
    // Use HTML5 canvas to render the PDF page via pdf.js CDN
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <style>
          * { margin: 0; padding: 0; }
          body { width: ${width}px; height: ${height}px; overflow: hidden; background: white; }
          canvas { display: block; }
        </style>
      </head>
      <body>
        <canvas id="pdf-canvas"></canvas>
        <script>
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          
          const pdfData = atob('${pdfBase64}');
          const uint8Array = new Uint8Array(pdfData.length);
          for (let i = 0; i < pdfData.length; i++) {
            uint8Array[i] = pdfData.charCodeAt(i);
          }
          
          pdfjsLib.getDocument({ data: uint8Array }).promise.then(function(pdf) {
            return pdf.getPage(${pageNum});
          }).then(function(pdfPage) {
            const viewport = pdfPage.getViewport({ scale: 1 });
            const scale = ${width} / viewport.width;
            const scaledViewport = pdfPage.getViewport({ scale });
            
            const canvas = document.getElementById('pdf-canvas');
            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;
            document.body.style.height = scaledViewport.height + 'px';
            
            const ctx = canvas.getContext('2d');
            pdfPage.render({ canvasContext: ctx, viewport: scaledViewport }).promise.then(function() {
              window.__THUMBNAIL_READY__ = true;
            });
          }).catch(function(err) {
            window.__THUMBNAIL_ERROR__ = err.message;
            window.__THUMBNAIL_READY__ = true;
          });
        </script>
      </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: "networkidle0", timeout: 15000 });

    // Wait for rendering to complete
    await page.waitForFunction("window.__THUMBNAIL_READY__ === true", {
      timeout: 10000,
    });

    // Check for errors
    const error = await page.evaluate(() => window.__THUMBNAIL_ERROR__);
    if (error) {
      throw new Error(`PDF rendering failed: ${error}`);
    }

    // Take screenshot
    const screenshotOptions = {
      path: thumbPath,
      type: format === "jpg" ? "jpeg" : format,
      omitBackground: false,
    };

    if (format !== "png" && quality) {
      screenshotOptions.quality = quality;
    }

    await page.screenshot(screenshotOptions);

    const stats = fs.statSync(thumbPath);
    return {
      width,
      height: stats.size > 0 ? height : 0,
      format,
      size: stats.size,
    };
  } finally {
    await page.close();
  }
}

/**
 * Generate thumbnail and return as base64
 */
async function generateThumbnailBase64(pdfPath, options = {}) {
  const tmpPath = pdfPath.replace(
    /\.pdf$/i,
    `_thumb.${options.format || "png"}`,
  );

  try {
    const info = await generateThumbnail(pdfPath, tmpPath, options);
    const base64 = fs.readFileSync(tmpPath).toString("base64");
    return { ...info, base64 };
  } finally {
    // Cleanup temp file
    if (fs.existsSync(tmpPath)) {
      fs.unlinkSync(tmpPath);
    }
  }
}

module.exports = { generateThumbnail, generateThumbnailBase64 };
