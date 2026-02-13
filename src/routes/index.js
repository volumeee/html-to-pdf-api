/**
 * Route Aggregator
 * Combines all route modules and mounts them on the Express app.
 * v7.0.0
 */
const pdfRoutes = require("./pdf");
const screenshotRoutes = require("./screenshot");
const fileRoutes = require("./files");
const advancedRoutes = require("./advanced");
const convertRoutes = require("./convert");
const adminRoutes = require("./admin");
const qrBarcodeRoutes = require("./qrBarcode");
const healthRoutes = require("./health");
const securityRoutes = require("./security");
const { listTemplates } = require("../templates");
const { PAGE_SIZES, IMAGE_FORMATS } = require("../config");
const { isQpdfAvailable } = require("../services/pdfUtils");
const { recordRequest } = require("../services/stats");
const { apiKeyAuth } = require("../middleware/apiKeyAuth");
const { BARCODE_TYPES } = require("../services/qrBarcode");

function registerRoutes(app) {
  // ─── Health Check (no auth needed) ─────────────────────────
  app.use(healthRoutes);

  // ─── API Key & Request Logging Middleware ──────────────────
  app.use(apiKeyAuth);

  app.use((req, res, next) => {
    // Skip static files and admin panel
    if (
      req.path.startsWith("/output/") ||
      req.path.startsWith("/admin-panel") ||
      req.path === "/docs" ||
      req.path === "/health"
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
  app.use(securityRoutes);
  app.use(adminRoutes);

  // ─── Templates & Capabilities Info ──────────────────────────
  app.get("/templates", (req, res) => {
    res.json({
      status: "success",
      templates: listTemplates(),
      page_sizes: Object.entries(PAGE_SIZES).map(([name, cfg]) => ({
        name,
        ...cfg,
      })),
      image_formats: IMAGE_FORMATS,
      barcode_types: BARCODE_TYPES,
      capabilities: {
        watermark: true,
        css_injection: true,
        base64_response: true,
        password_protection: isQpdfAvailable(),
        digital_signature: true,
        signed_urls: true,
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
        health_check: true,
        helmet_security: true,
      },
    });
  });

  // ─── Template Preview ──────────────────────────────────────
  app.get("/templates/:name/preview", async (req, res) => {
    const { getTemplate } = require("../templates");
    const { renderPdf } = require("../services/renderer");
    const { getFilePath } = require("../services/fileManager");
    const { generateFilename } = require("../utils/format");

    const tmpl = getTemplate(req.params.name);
    if (!tmpl) {
      return res.status(404).json({
        status: "error",
        error: `Template "${req.params.name}" not found`,
        available: listTemplates().map((t) => t.name),
      });
    }

    try {
      const sampleData = tmpl.sampleData || {};
      const html = tmpl.fn(sampleData);
      const filename = generateFilename(`preview_${req.params.name}`);
      const outputPath = getFilePath(filename);

      await renderPdf({ html }, outputPath, {
        pageSize: tmpl.defaultPageSize,
      });

      const baseUrl = `${req.protocol}://${req.get("host")}`;
      return res.json({
        status: "success",
        message: `Preview generated for template "${req.params.name}"`,
        template: req.params.name,
        file_url: `${baseUrl}/output/${filename}`,
        filename,
        note: "Uses sample data. Provide your own data via POST /generate for production use.",
      });
    } catch (err) {
      console.error("[Preview] Error:", err.message);
      return res.status(500).json({
        status: "error",
        error: "Failed to generate preview",
        details: err.message,
      });
    }
  });

  // ─── Root Info ─────────────────────────────────────────────
  app.get("/", (req, res) => {
    res.json({
      name: "HTML to PDF API",
      version: "7.0.0",
      status: "running",
      docs: "/docs",
      admin: "/admin-panel",
      health: "/health",
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
        security: [
          "POST /encrypt-pdf      → Password protect PDF",
          "POST /sign-pdf         → Digital signature stamp",
          "POST /secure/generate  → Generate signed URL",
          "GET  /secure/:filename → Access via signed URL",
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
          "GET    /templates/:name/preview → Preview template",
        ],
        admin: [
          "POST /admin/login        → Get JWT token",
          "GET  /admin/stats         → Usage statistics",
          "GET  /admin/logs          → Request logs",
          "GET  /admin/system        → System info",
          "CRUD /admin/keys          → API Key management",
          "CRUD /admin/settings      → Global settings",
          "CRUD /admin/templates     → Custom templates",
          "CRUD /admin/signatures    → Signature stamps",
        ],
        monitoring: ["GET /health → System health check"],
      },
    });
  });
}

module.exports = registerRoutes;
