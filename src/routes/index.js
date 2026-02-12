/**
 * Route Aggregator
 * Combines all route modules and mounts them on the Express app.
 */
const pdfRoutes = require("./pdf");
const screenshotRoutes = require("./screenshot");
const fileRoutes = require("./files");
const { listTemplates } = require("../templates");
const { PAGE_SIZES, IMAGE_FORMATS } = require("../config");

function registerRoutes(app) {
  // Mount route modules
  app.use(pdfRoutes);
  app.use(screenshotRoutes);
  app.use(fileRoutes);

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
    });
  });

  // ─── Health Check ───────────────────────────────────────────
  app.get("/", (req, res) => {
    res.json({
      name: "HTML to PDF API",
      version: "3.0.0",
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
        files: [
          "GET    /files            → List all files",
          "DELETE /files/:filename  → Delete a file",
          "POST   /cleanup          → Remove old files",
        ],
        info: ["GET /templates          → Available templates & page sizes"],
      },
    });
  });
}

module.exports = registerRoutes;
