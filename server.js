/**
 * HTML to PDF API — Server Entry Point
 * v4.0.0
 */
const app = require("./src/app");
const { PORT, AUTO_CLEANUP_HOURS } = require("./src/config");
const { cleanupOldFiles } = require("./src/services/fileManager");
const { listTemplates } = require("./src/templates");
const { closeBrowser } = require("./src/services/browser");

// ─── Auto Cleanup (runs every 6 hours) ──────────────────────
setInterval(
  () => {
    const result = cleanupOldFiles(AUTO_CLEANUP_HOURS);
    if (result.deleted > 0) {
      console.log(`[Cleanup] Deleted ${result.deleted} old files.`);
    }
  },
  6 * 60 * 60 * 1000,
);

// ─── Graceful Shutdown ──────────────────────────────────────
async function shutdown() {
  console.log("\n[Server] Shutting down...");
  await closeBrowser();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// ─── Start Server ───────────────────────────────────────────
app.listen(PORT, () => {
  const templates = listTemplates().map((t) => t.name);
  console.log(`
┌─────────────────────────────────────────────┐
│     🚀 HTML to PDF API v4.0.0              │
├─────────────────────────────────────────────┤
│  Port:       ${String(PORT).padEnd(30)}│
│  Templates:  ${templates.join(", ").padEnd(30)}│
│  Cleanup:    every ${String(AUTO_CLEANUP_HOURS + "h").padEnd(24)}│
│                                             │
│  PDF Endpoints:                             │
│   POST /cetak_struk_pdf  (HTML → PDF)       │
│   POST /generate         (Tmpl → PDF)       │
│   POST /url-to-pdf       (URL  → PDF)       │
│                                             │
│  Screenshot Endpoints:                      │
│   POST /html-to-image    (HTML → IMG)       │
│   POST /url-to-image     (URL  → IMG)       │
│                                             │
│  Advanced:                                  │
│   POST /merge            (Merge PDFs)       │
│   POST /batch            (Batch generate)   │
│   POST /webhook          (Async + callback) │
│                                             │
│  Features: Watermark, Base64, CSS Inject,   │
│            Password, Merge, Batch, Webhook  │
└─────────────────────────────────────────────┘
`);
});
