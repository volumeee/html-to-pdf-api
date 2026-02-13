/**
 * Route Aggregator
 * Combines all route modules and mounts them on the Express app.
 */
const pdfRoutes = require("./pdf");
const screenshotRoutes = require("./screenshot");
const fileRoutes = require("./files");
const advancedRoutes = require("./advanced");
const convertRoutes = require("./convert");
const adminRoutes = require("./admin");
const qrBarcodeRoutes = require("./qrBarcode");
const { listTemplates } = require("../templates");
const { PAGE_SIZES, IMAGE_FORMATS } = require("../config");
const { isQpdfAvailable } = require("../services/pdfUtils");
const { recordRequest } = require("../services/stats");
const { apiKeyAuth } = require("../middleware/apiKeyAuth");
const { BARCODE_TYPES } = require("../services/qrBarcode");

function registerRoutes(app) {
  // ─── API Key & Request Logging Middleware ──────────────────
  app.use(apiKeyAuth);

  app.use((req, res, next) => {
    // Skip static files and admin panel
    if (
      req.path.startsWith("/output/") ||
      req.path.startsWith("/admin-panel") ||
      req.path === "/docs"
    ) {
      return next();
    }

    // Record after response finishes
    res.on("finish", () => {
      const extra = {};
      if (
        req.path.includes("pdf") ||
        req.path === "/generate" ||
        req.path === "/batch" ||
        req.path === "/merge"
      ) {
        extra.type = "pdf";
      } else if (
        req.path.includes("image") ||
        req.path.includes("screenshot")
      ) {
        extra.type = "image";
      }
      if (res.statusCode < 400) {
        recordRequest(req, extra);
      }
    });
    next();
  });

  // ─── Mount Route Modules ───────────────────────────────────
  app.use(pdfRoutes);
  app.use(screenshotRoutes);
  app.use(fileRoutes);
  app.use(advancedRoutes);
  app.use(convertRoutes);
  app.use(qrBarcodeRoutes);
  app.use(adminRoutes);

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
      barcode_types: BARCODE_TYPES,
      capabilities: {
        watermark: true,
        css_injection: true,
        base64_response: true,
        password_protection: isQpdfAvailable(),
        merge_pdf: true,
        batch_generation: true,
        webhook: true,
        pdf_to_image: true,
        csv_export: true,
        qr_code: true,
        barcode: true,
        custom_templates: true,
        header_footer: true,
        admin_panel: true,
        swagger_docs: true,
      },
    });
  });

  // ─── Health Check ───────────────────────────────────────────
  app.get("/", (req, res) => {
    res.json({
      name: "HTML to PDF API",
      version: "6.0.0",
      status: "running",
      docs: "/docs",
      admin: "/admin-panel",
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
        convert: [
          "POST /pdf-to-image     → PDF to PNG/JPEG/WebP",
          "POST /to-csv           → Data to CSV",
        ],
        qr_barcode: [
          "POST /qr-code          → Generate QR Code",
          "POST /barcode           → Generate Barcode",
          "POST /qr-pdf            → QR Code embedded in PDF",
        ],
        advanced: [
          "POST /merge            → Merge multiple PDFs",
          "POST /batch            → Batch generate from template",
          "POST /webhook          → Async generate + webhook",
        ],
        files: [
          "GET    /files            → List all files",
          "DELETE /files/:filename  → Delete a file",
          "POST   /cleanup          → Remove old files",
          "GET    /templates        → Templates & capabilities",
        ],
        admin: [
          "POST /admin/login      → Get JWT token",
          "GET  /admin/stats       → Usage statistics",
          "GET  /admin/logs        → Request logs",
          "GET  /admin/system      → System info",
          "CRUD /admin/keys        → API Key management",
          "CRUD /admin/settings    → Global settings",
          "CRUD /admin/templates   → Custom templates",
        ],
      },
    });
  });
}

module.exports = registerRoutes;
