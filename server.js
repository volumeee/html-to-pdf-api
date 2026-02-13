/**
 * HTML to PDF API — Server Entry Point
 * v7.0.0
 */
const app = require("./src/app");
const config = require("./src/config");
const { cleanupOldFiles } = require("./src/services/fileManager");
const { listTemplates } = require("./src/templates");
const { closeBrowser } = require("./src/services/browser");
const { saveStats } = require("./src/services/stats");
const { getSettings } = require("./src/services/settings");
const { saveKeys } = require("./src/services/apiKey");

// ─── Environment Validation ────────────────────────────────
function validateEnv() {
  const warnings = [];

  if (config.JWT_SECRET === "html-to-pdf-secret-key-change-in-production") {
    warnings.push("JWT_SECRET is using default value — change in production!");
  }
  if (config.ADMIN_PASSWORD === "admin123") {
    warnings.push(
      "ADMIN_PASSWORD is using default value — change in production!",
    );
  }
  if (config.SIGNED_URL_SECRET === "signed-url-secret-change-me") {
    warnings.push(
      "SIGNED_URL_SECRET is using default value — change in production!",
    );
  }

  if (warnings.length > 0) {
    console.log("\n⚠️  Security Warnings:");
    warnings.forEach((w) => console.log(`   • ${w}`));
    console.log();
  }
}

// ─── Auto Cleanup (dynamic based on app_settings) ───────────
setInterval(
  () => {
    const settings = getSettings();
    const result = cleanupOldFiles(settings.auto_cleanup_hours);
    if (result.deleted > 0) {
      console.log(`[Cleanup] Deleted ${result.deleted} old files.`);
    }
  },
  60 * 60 * 1000,
);

// ─── Graceful Shutdown ──────────────────────────────────────
let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n[Server] Received ${signal}, shutting down gracefully...`);

  // Stop accepting new connections
  if (server) {
    server.close(() => {
      console.log("[Server] Closed all connections.");
    });
  }

  try {
    // Save all persistent data
    saveStats();
    saveKeys();
    console.log("[Server] Saved stats and API keys.");

    // Close browser
    await closeBrowser();
    console.log("[Server] Browser closed.");
  } catch (err) {
    console.error("[Server] Error during shutdown:", err.message);
  }

  // Force exit after 10 seconds
  setTimeout(() => {
    console.error("[Server] Forced shutdown after timeout.");
    process.exit(1);
  }, 10000).unref();

  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("uncaughtException", (err) => {
  console.error("[FATAL] Uncaught Exception:", err);
  shutdown("uncaughtException");
});
process.on("unhandledRejection", (reason) => {
  console.error("[FATAL] Unhandled Rejection:", reason);
});

// ─── Start Server ───────────────────────────────────────────
validateEnv();

const server = app.listen(config.PORT, () => {
  const templates = listTemplates().map((t) => t.name);
  const settings = getSettings();
  console.log(`
┌──────────────────────────────────────────────────┐
│        🚀 HTML to PDF API v7.0.0                │
├──────────────────────────────────────────────────┤
│  Port:        ${String(config.PORT).padEnd(34)}│
│  Templates:   ${String(templates.length + " registered").padEnd(34)}│
│  Cleanup:     every ${String(settings.auto_cleanup_hours + "h").padEnd(28)}│
│  Security:    Helmet, CORS, API Keys, JWT        │
│  Timeout:     ${String(config.REQUEST_TIMEOUT_MS / 1000 + "s per request").padEnd(34)}│
│                                                  │
│  📄 PDF:       /cetak_struk_pdf, /generate,      │
│                /url-to-pdf                        │
│  📸 Screenshot: /html-to-image, /url-to-image    │
│  📱 QR/Barcode: /qr-code, /barcode, /qr-pdf     │
│  🔄 Convert:   /pdf-to-image, /to-csv            │
│  ⚡ Advanced:  /merge, /batch, /webhook           │
│  🔐 Security:  /encrypt-pdf, /sign-pdf           │
│  ❤️  Health:    /health                            │
│  📂 Files:     /files, /cleanup, /templates       │
│  🎨 Templates: Custom upload via Admin Panel     │
│                                                  │
│  📖 API Docs:  http://localhost:${config.PORT}/docs${" ".repeat(Math.max(0, 11 - String(config.PORT).length))}│
│  🔐 Admin:     http://localhost:${config.PORT}/admin-panel${" ".repeat(Math.max(0, 4 - String(config.PORT).length))}│
└──────────────────────────────────────────────────┘
`);
});

// Set server timeout
server.timeout = config.REQUEST_TIMEOUT_MS;
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;
