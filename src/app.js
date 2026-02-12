/**
 * Express Application Setup
 */
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const { MAX_BODY_SIZE } = require("./config");
const { apiLimiter, renderLimiter } = require("./middleware/rateLimiter");
const registerRoutes = require("./routes");
const setupSwagger = require("./swagger");

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json({ limit: MAX_BODY_SIZE }));
app.use(bodyParser.urlencoded({ extended: true, limit: MAX_BODY_SIZE }));

// ─── Rate Limiting ───────────────────────────────────────────
app.use(apiLimiter);
app.use(
  [
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
setupSwagger(app);

// ─── API Routes ──────────────────────────────────────────────
registerRoutes(app);

module.exports = app;
