/**
 * HTML to PDF API — Server Entry Point
 * v5.0.0
 */
const app = require("./src/app");
const { PORT, AUTO_CLEANUP_HOURS } = require("./src/config");
const { cleanupOldFiles } = require("./src/services/fileManager");
const { listTemplates } = require("./src/templates");
const { closeBrowser } = require("./src/services/browser");
const { saveStats } = require("./src/services/stats");

// ─── Auto Cleanup (every 6 hours) ──────────────────────────
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
  saveStats();
  await closeBrowser();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// ─── Start Server ───────────────────────────────────────────
app.listen(PORT, () => {
  const templates = listTemplates().map((t) => t.name);
  console.log(`
┌──────────────────────────────────────────────────┐
│        🚀 HTML to PDF API v5.0.0                │
├──────────────────────────────────────────────────┤
│  Port:        ${String(PORT).padEnd(34)}│
│  Templates:   ${templates.join(", ").padEnd(34)}│
│  Cleanup:     every ${String(AUTO_CLEANUP_HOURS + "h").padEnd(28)}│
│                                                  │
│  📄 PDF:       /cetak_struk_pdf, /generate,      │
│                /url-to-pdf                        │
│  📸 Screenshot: /html-to-image, /url-to-image    │
│  🔄 Convert:   /pdf-to-image, /to-csv            │
│  ⚡ Advanced:  /merge, /batch, /webhook           │
│  📂 Files:     /files, /cleanup, /templates       │
│                                                  │
│  📖 API Docs:  http://localhost:${PORT}/docs${" ".repeat(Math.max(0, 11 - String(PORT).length))}│
│  🔐 Admin:     http://localhost:${PORT}/admin-panel${" ".repeat(Math.max(0, 4 - String(PORT).length))}│
└──────────────────────────────────────────────────┘
`);
});
