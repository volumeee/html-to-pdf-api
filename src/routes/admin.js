/**
 * Admin Routes
 *
 * POST   /admin/login     - Get JWT token
 * GET    /admin/stats      - Usage statistics
 * GET    /admin/logs       - Request logs
 * POST   /admin/reset      - Reset statistics
 * GET    /admin/system     - System information
 * GET    /admin/files      - Detailed file management
 * DELETE /admin/files/:fn  - Delete file (with logging)
 */
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { login, requireAdmin } = require("../middleware/adminAuth");
const { getStats, getLogs, resetStats } = require("../services/stats");
const {
  listFiles,
  deleteFile,
  getOutputDir,
} = require("../services/fileManager");
const { listTemplates } = require("../templates");
const { isQpdfAvailable } = require("../services/pdfUtils");
const { success, error } = require("../utils/response");
const config = require("../config");

// ─── Login ───────────────────────────────────────────────────
router.post("/admin/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return error(res, "username and password are required");
  }

  const result = await login(username, password);
  if (!result) {
    return error(res, "Invalid credentials", null, 401);
  }

  return success(res, { message: "Login successful", ...result });
});

// ─── Stats ───────────────────────────────────────────────────
router.get("/admin/stats", requireAdmin, (req, res) => {
  return success(res, { stats: getStats() });
});

// ─── Request Logs ────────────────────────────────────────────
router.get("/admin/logs", requireAdmin, (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const offset = parseInt(req.query.offset) || 0;

  return success(res, getLogs(limit, offset));
});

// ─── Reset Stats ─────────────────────────────────────────────
router.post("/admin/reset", requireAdmin, (req, res) => {
  resetStats();
  return success(res, { message: "Statistics reset successfully" });
});

// ─── System Info ─────────────────────────────────────────────
router.get("/admin/system", requireAdmin, (req, res) => {
  const outputDir = getOutputDir();
  const files = fs.readdirSync(outputDir);
  const totalSize = files.reduce((sum, f) => {
    try {
      return sum + fs.statSync(path.join(outputDir, f)).size;
    } catch {
      return sum;
    }
  }, 0);

  return success(res, {
    system: {
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      uptime: Math.floor(process.uptime()),
      memory: process.memoryUsage(),
      cwd: process.cwd(),
    },
    config: {
      port: config.PORT,
      auto_cleanup_hours: config.AUTO_CLEANUP_HOURS,
      max_body_size: config.MAX_BODY_SIZE,
    },
    storage: {
      total_files: files.length,
      total_size_mb: Math.round((totalSize / 1024 / 1024) * 100) / 100,
      output_dir: outputDir,
    },
    capabilities: {
      templates: listTemplates(),
      page_sizes: Object.keys(config.PAGE_SIZES),
      image_formats: config.IMAGE_FORMATS,
      password_protection: isQpdfAvailable(),
      pdf_compression: true,
      pdf_metadata: true,
      thumbnails: true,
      job_queue: true,
      chart_generation: true,
      table_generation: true,
      pdf_split_extract: true,
      browser_pool_size: config.BROWSER_POOL_SIZE,
    },
    email: require("../services/email").getEmailInfo(),
    cloud_storage: require("../services/cloudStorage").getStorageInfo(),
    queue: require("../services/queue").getQueueStats(),
  });
});

// ─── Detailed File List ──────────────────────────────────────
router.get("/admin/files", requireAdmin, (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const type = req.query.type || null;
  const files = listFiles(baseUrl, type);

  const totalSize = files.reduce((sum, f) => sum + f.size_kb, 0);

  return success(res, {
    total: files.length,
    total_size_kb: totalSize,
    files,
  });
});

// ─── Delete File (Admin) ────────────────────────────────────
router.delete("/admin/files/:filename", requireAdmin, (req, res) => {
  const deleted = deleteFile(req.params.filename);

  if (!deleted) {
    return error(res, "File not found", null, 404);
  }

  return success(res, {
    message: "File deleted by admin",
    filename: req.params.filename,
  });
});

// ─── API Key Management ─────────────────────────────────────
const apiKeyService = require("../services/apiKey");
const settingsService = require("../services/settings");

router.get("/admin/settings", requireAdmin, (req, res) => {
  return success(res, { settings: settingsService.getSettings() });
});

router.patch("/admin/settings", requireAdmin, (req, res) => {
  const updated = settingsService.updateSettings(req.body);
  return success(res, { message: "Settings updated", settings: updated });
});

router.get("/admin/keys", requireAdmin, (req, res) => {
  return success(res, { keys: apiKeyService.getAllKeys() });
});

router.post("/admin/keys", requireAdmin, (req, res) => {
  const { name, quota_limit, rate_limit, state, settings } = req.body;
  const newKey = apiKeyService.createKey(name, {
    quota_limit: parseInt(quota_limit),
    rate_limit: parseInt(rate_limit),
    state: state || "active",
    settings,
  });
  return success(res, { message: "API Key created", ...newKey });
});

router.patch("/admin/keys/:id", requireAdmin, (req, res) => {
  const keyId = req.params.id;
  const updated = apiKeyService.updateKey(keyId, req.body);
  if (!updated) return error(res, "Key not found", null, 404);
  return success(res, { message: "API Key updated" });
});

router.delete("/admin/keys/:id", requireAdmin, (req, res) => {
  const keyId = req.params.id;
  const deleted = apiKeyService.deleteKey(keyId);
  if (!deleted) return error(res, "Key not found", null, 404);
  return success(res, { message: "API Key deleted" });
});

// ─── Custom Template Management ─────────────────────────────
const customTemplateService = require("../services/customTemplate");

router.get("/admin/templates/custom", requireAdmin, (req, res) => {
  return success(res, {
    templates: customTemplateService.listCustomTemplates(),
  });
});

router.get("/admin/templates/custom/:name", requireAdmin, (req, res) => {
  const tmpl = customTemplateService.getTemplateSource(req.params.name);
  if (!tmpl) return error(res, "Template not found", null, 404);
  return success(res, { template: tmpl });
});

router.post("/admin/templates/custom", requireAdmin, (req, res) => {
  const { name, html, description, page_size, category, variables } = req.body;
  if (!name || !html) return error(res, "name and html are required");

  const saved = customTemplateService.saveCustomTemplate(name, {
    html,
    description,
    page_size,
    category,
    variables,
  });
  return success(res, { message: "Template saved", template: saved });
});

router.delete("/admin/templates/custom/:name", requireAdmin, (req, res) => {
  const deleted = customTemplateService.deleteCustomTemplate(req.params.name);
  if (!deleted) return error(res, "Template not found", null, 404);
  return success(res, { message: "Template deleted" });
});

module.exports = router;
