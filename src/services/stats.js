/**
 * Usage Statistics Service
 *
 * Tracks API usage in-memory with periodic file persistence.
 * No database needed — uses a JSON file for storage.
 */
const fs = require("fs");
const path = require("path");

const STATS_FILE = path.join(__dirname, "../../data/stats.json");
const LOGS_FILE = path.join(__dirname, "../../data/request_logs.json");
const MAX_LOGS = 500; // Keep last N request logs

// Ensure data directory exists
const dataDir = path.dirname(STATS_FILE);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// ─── In-Memory State ────────────────────────────────────────
let stats = {
  total_requests: 0,
  total_pdfs: 0,
  total_images: 0,
  endpoints: {},
  daily: {},
  top_keys: {},
  started_at: new Date().toISOString(),
};

let requestLogs = [];

// Load from file on startup
function loadStats() {
  try {
    if (fs.existsSync(STATS_FILE)) {
      stats = { ...stats, ...JSON.parse(fs.readFileSync(STATS_FILE, "utf-8")) };
    }
    if (fs.existsSync(LOGS_FILE)) {
      requestLogs = JSON.parse(fs.readFileSync(LOGS_FILE, "utf-8"));
    }
  } catch {
    console.log("[Stats] Could not load saved stats, starting fresh.");
  }
}

// Save to file
function saveStats() {
  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify(stats, null, 2));
    fs.writeFileSync(LOGS_FILE, JSON.stringify(requestLogs.slice(-MAX_LOGS)));
  } catch (err) {
    console.error("[Stats] Failed to save:", err.message);
  }
}

/**
 * Record a request
 */
function recordRequest(req, extra = {}) {
  const endpoint = `${req.method} ${req.route?.path || req.path}`;
  const today = new Date().toISOString().slice(0, 10);

  stats.total_requests++;
  stats.endpoints[endpoint] = (stats.endpoints[endpoint] || 0) + 1;
  stats.daily[today] = (stats.daily[today] || 0) + 1;

  const keyLabel = req.keyData?.name || `Guest (${req.ip})`;
  stats.top_keys[keyLabel] = (stats.top_keys[keyLabel] || 0) + 1;

  if (extra.type === "pdf") stats.total_pdfs++;
  if (extra.type === "image") stats.total_images++;

  // Log the request
  requestLogs.push({
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    endpoint,
    ip: req.ip || req.connection?.remoteAddress || "unknown",
    user_agent: (req.headers["user-agent"] || "").substring(0, 100),
    api_key: req.apiKey ? "***" + req.apiKey.slice(-4) : null,
    ...extra,
  });

  // Trim logs
  if (requestLogs.length > MAX_LOGS) {
    requestLogs = requestLogs.slice(-MAX_LOGS);
  }
}

/**
 * Get current stats summary
 */
function getStats() {
  const uptime = process.uptime();
  const mem = process.memoryUsage();

  return {
    ...stats,
    uptime_seconds: Math.floor(uptime),
    uptime_human: formatUptime(uptime),
    memory: {
      rss_mb: Math.round(mem.rss / 1024 / 1024),
      heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
    },
  };
}

/**
 * Get request logs (with optional filtering)
 */
function getLogs(limit = 50, offset = 0) {
  const sorted = [...requestLogs].reverse();
  return {
    total: sorted.length,
    logs: sorted.slice(offset, offset + limit),
  };
}

/**
 * Reset stats
 */
function resetStats() {
  stats = {
    total_requests: 0,
    total_pdfs: 0,
    total_images: 0,
    endpoints: {},
    daily: {},
    started_at: new Date().toISOString(),
  };
  requestLogs = [];
  saveStats();
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

// Auto-save every 5 minutes
setInterval(saveStats, 5 * 60 * 1000);

// Load on startup
loadStats();

module.exports = { recordRequest, getStats, getLogs, resetStats, saveStats };
