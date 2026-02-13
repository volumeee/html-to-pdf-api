/**
 * Health Check Route
 *
 * GET /health - System health status
 */
const express = require("express");
const router = express.Router();
const os = require("os");
const fs = require("fs");
const path = require("path");
const { getHealth } = require("../services/browser");

const outputDir = path.join(__dirname, "../../output");
const startedAt = new Date().toISOString();

router.get("/health", async (req, res) => {
  const browserHealth = await getHealth();
  const mem = process.memoryUsage();
  const uptime = process.uptime();

  // Disk usage for output dir
  let diskUsage = { files: 0, size_mb: 0 };
  try {
    const files = fs.readdirSync(outputDir).filter((f) => !f.startsWith("."));
    const totalSize = files.reduce((sum, f) => {
      try {
        return sum + fs.statSync(path.join(outputDir, f)).size;
      } catch {
        return sum;
      }
    }, 0);
    diskUsage = {
      files: files.length,
      size_mb: Math.round((totalSize / 1024 / 1024) * 100) / 100,
    };
  } catch {}

  const status = browserHealth.connected ? "healthy" : "degraded";

  res.status(status === "healthy" ? 200 : 503).json({
    status,
    version: "7.0.0",
    started_at: startedAt,
    uptime_seconds: Math.floor(uptime),
    system: {
      platform: process.platform,
      arch: process.arch,
      node_version: process.version,
      cpus: os.cpus().length,
      load_avg: os.loadavg().map((l) => Math.round(l * 100) / 100),
      total_memory_mb: Math.round(os.totalmem() / 1024 / 1024),
      free_memory_mb: Math.round(os.freemem() / 1024 / 1024),
    },
    process: {
      pid: process.pid,
      rss_mb: Math.round(mem.rss / 1024 / 1024),
      heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
    },
    browser: browserHealth,
    storage: diskUsage,
  });
});

module.exports = router;
