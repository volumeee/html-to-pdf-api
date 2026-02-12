/**
 * HTML to PDF API — Server Entry Point
 * v5.2.1
 */
const app = require("./src/app");
const { PORT } = require("./src/config");
const { cleanupOldFiles } = require("./src/services/fileManager");
const { listTemplates } = require("./src/templates");
const { closeBrowser } = require("./src/services/browser");
const { saveStats } = require("./src/services/stats");
const { getSettings } = require("./src/services/settings");

// ─── Auto Cleanup (dynamic based on app_settings) ───────────
setInterval(
  () => {
    const settings = getSettings();
    const result = cleanupOldFiles(settings.auto_cleanup_hours);
    if (result.deleted > 0) {
      console.log(`[Cleanup] Deleted ${result.deleted} old files.`);
    }
  },
  60 * 60 * 1000, // Check every hour
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
  const settings = getSettings();
  console.log(`
┌──────────────────────────────────────────────────┐
│        🚀 HTML to PDF API v5.2.1                │
├──────────────────────────────────────────────────┤
│  Port:        ${String(PORT).padEnd(34)}│
│  Templates:   ${templates.join(", ").padEnd(34)}│
│  Cleanup:     every ${String(settings.auto_cleanup_hours + "h").padEnd(28)}│
│  Security:    API Keys & JWT active              │
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
