/**
 * Express Application Setup
 * v7.2.0 — with Unified API & Enhanced Security
 */
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const path = require("path");
const config = require("./config");
const { apiLimiter, renderLimiter } = require("./middleware/rateLimiter");
const registerRoutes = require("./routes");
const setupSwagger = require("./swagger");
const { sanitizeMiddleware } = require("./middleware/sanitizer");

const app = express();

// ─── Security Headers (Helmet) ───────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: false, // disabled for Swagger UI & Admin Panel
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" }, // allow output files to be loaded
  }),
);

// ─── CORS Configuration ──────────────────────────────────────
const corsOptions = {
  origin:
    config.CORS_ORIGINS === "*"
      ? "*"
      : config.CORS_ORIGINS.split(",").map((o) => o.trim()),
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  maxAge: 86400,
};
app.use(cors(corsOptions));

// ─── Body Parser ─────────────────────────────────────────────
app.use(bodyParser.json({ limit: config.MAX_BODY_SIZE }));
app.use(bodyParser.urlencoded({ extended: true, limit: config.MAX_BODY_SIZE }));

// ─── HTML Sanitization (XSS Prevention) ─────────────────────
app.use(sanitizeMiddleware);

// ─── Request Timeout Middleware ──────────────────────────────
app.use((req, res, next) => {
  // Skip timeout for streaming/file endpoints
  if (req.path.startsWith("/output/") || req.path.startsWith("/admin-panel")) {
    return next();
  }

  req.setTimeout(config.REQUEST_TIMEOUT_MS);
  res.setTimeout(config.REQUEST_TIMEOUT_MS, () => {
    if (!res.headersSent) {
      res.status(408).json({
        status: "error",
        error: "Request timeout",
        message: `Request exceeded ${config.REQUEST_TIMEOUT_MS / 1000}s limit`,
      });
    }
  });
  next();
});

// ─── Rate Limiting ───────────────────────────────────────────
app.use(apiLimiter);
app.use(
  [
    "/render",
    "/pdf-action",
    "/cetak_struk_pdf",
    "/generate",
    "/url-to-pdf",
    "/html-to-image",
    "/url-to-image",
    "/batch",
  ],
  renderLimiter,
);

// ─── Static Files ────────────────────────────────────────────
app.use("/output", express.static(path.join(__dirname, "../output")));

// ─── Admin Panel (Static HTML) ───────────────────────────────
app.use("/admin-panel", express.static(path.join(__dirname, "admin")));

// ─── Swagger Docs ────────────────────────────────────────────
app.use("/docs", setupSwagger.serve, setupSwagger.setup);

// ─── API Routes ──────────────────────────────────────────────
registerRoutes(app);

// ─── 404 Handler ─────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    error: "Not Found",
    message: `Route ${req.method} ${req.path} not found`,
    docs: "/docs",
  });
});

// ─── Global Error Handler ────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error("[Error]", err.message);
  if (!res.headersSent) {
    res.status(err.status || 500).json({
      status: "error",
      error: err.message || "Internal Server Error",
    });
  }
});

module.exports = app;
