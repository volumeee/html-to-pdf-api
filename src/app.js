/**
 * Express Application Setup
 * Middleware configuration, static files, and route registration.
 */
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const { MAX_BODY_SIZE } = require("./config");
const registerRoutes = require("./routes");

const app = express();

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json({ limit: MAX_BODY_SIZE }));
app.use(bodyParser.urlencoded({ extended: true, limit: MAX_BODY_SIZE }));

// ─── Static Files (generated output) ─────────────────────────
app.use("/output", express.static(path.join(__dirname, "../output")));

// ─── Routes ──────────────────────────────────────────────────
registerRoutes(app);

module.exports = app;
