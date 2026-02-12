/**
 * Route Aggregator
 * Combines all route modules and mounts them on the Express app.
 */
const pdfRoutes = require("./pdf");
const screenshotRoutes = require("./screenshot");
const fileRoutes = require("./files");
const advancedRoutes = require("./advanced");
const { listTemplates } = require("../templates");
const { PAGE_SIZES, IMAGE_FORMATS } = require("../config");
const { isQpdfAvailable } = require("../services/pdfUtils");

function registerRoutes(app) {
  // Mount route modules
  app.use(pdfRoutes);
  app.use(screenshotRoutes);
  app.use(fileRoutes);
  app.use(advancedRoutes);

  // ─── Templates & Capabilities Info ──────────────────────────
  app.get("/templates", (req, res) => {
    res.json({
      status: "success",
      templates: listTemplates(),
      page_sizes: Object.entries(PAGE_SIZES).map(([name, config]) => ({
        name,
        ...config,
      })),
      image_formats: IMAGE_FORMATS,
      capabilities: {
        watermark: true,
        css_injection: true,
        base64_response: true,
        password_protection: isQpdfAvailable(),
        merge_pdf: true,
        batch_generation: true,
        webhook: true,
      },
    });
  });

  // ─── Health Check ───────────────────────────────────────────
  app.get("/", (req, res) => {
    res.json({
      name: "HTML to PDF API",
      version: "4.0.0",
      status: "running",
      endpoints: {
        pdf: [
          "POST /cetak_struk_pdf  → HTML to PDF",
          "POST /generate         → Template to PDF",
          "POST /url-to-pdf       → URL to PDF",
        ],
        screenshot: [
          "POST /html-to-image    → HTML to PNG/JPEG/WebP",
          "POST /url-to-image     → URL to PNG/JPEG/WebP",
        ],
        advanced: [
          "POST /merge            → Merge multiple PDFs",
          "POST /batch            → Batch generate from template",
          "POST /webhook          → Async generate + webhook callback",
        ],
        files: [
          "GET    /files            → List all files",
          "DELETE /files/:filename  → Delete a file",
          "POST   /cleanup          → Remove old files",
        ],
        info: [
          "GET /templates          → Templates, page sizes & capabilities",
        ],
      },
    });
  });
}

module.exports = registerRoutes;
