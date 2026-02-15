/**
 * Route Aggregator (Slim Version v7.2.2)
 *
 * CORE ROUTES ONLY. Specific feature routes are now consolidated into:
 * - /render (Unified Renderer)
 * - /pdf-action (Universal Processor)
 */
const fileRoutes = require("./files");
const adminRoutes = require("./admin");
const healthRoutes = require("./health");
const universalRoutes = require("./universal");
const { listTemplates } = require("../templates");
const { PAGE_SIZES, IMAGE_FORMATS } = require("../config");
const { isQpdfAvailable } = require("../services/pdfUtils");
const { recordRequest } = require("../services/stats");
const { apiKeyAuth } = require("../middleware/apiKeyAuth");
const { BARCODE_TYPES } = require("../services/qrBarcode");

function registerRoutes(app) {
  // 1. System Health (No Auth)
  app.use(healthRoutes);

  // 2. Auth & Logging
  app.use(apiKeyAuth);
  app.use((req, res, next) => {
    res.on("finish", () => {
      if (
        res.statusCode < 400 &&
        !req.path.startsWith("/admin") &&
        req.path !== "/health"
      ) {
        let type = "pdf";
        if (req.path.includes("image")) type = "image";
        if (req.body?.output === "image") type = "image";

        recordRequest(req, { type });
      }
    });
    next();
  });

  // 3. Unified Core Routes (The New Standard)
  app.use("/", universalRoutes);

  // 4. Essential Management Routes
  app.use(fileRoutes);
  app.use(adminRoutes);

  // 5. Discovery Endpoints
  app.get("/templates", (req, res) => {
    res.json({
      status: "success",
      templates: listTemplates(),
      page_sizes: Object.keys(PAGE_SIZES),
      image_formats: IMAGE_FORMATS,
      barcode_types: BARCODE_TYPES,
      capabilities: { unified: true, processor: true, queue: true },
    });
  });

  // 6. Simplified Info (ROOT)
  app.get("/", (req, res) => {
    res.json({
      name: "HTML to PDF API",
      version: "7.2.2",
      architecture: "Unified Gateway",
      docs: "/docs",
      health: "/health",
      admin: "/admin-panel",
      endpoints: {
        core: [
          "POST /render         → Universal Generator (HTML/URL/Template → PDF/Image)",
          "POST /pdf-action     → Universal Processor (compress/encrypt/sign/merge/split/extract/metadata/thumbnail/email)",
        ],
        queue: [
          "POST /queue          → Submit background job",
          "GET  /jobs/:id       → Check job status",
          "GET  /queue/stats    → Queue statistics",
        ],
        legacy: [
          "POST /cetak_struk_pdf → Thermal receipt PDF (backward compatible)",
        ],
        management: [
          "GET  /files          → List generated files",
          "GET  /templates      → Discover templates & capabilities",
          "GET  /health         → System health check",
          "GET  /docs           → Interactive API documentation",
          "GET  /admin-panel    → Admin dashboard",
        ],
      },
    });
  });
}

module.exports = registerRoutes;
