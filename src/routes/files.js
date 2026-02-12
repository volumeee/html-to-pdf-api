/**
 * File Management Routes
 *
 * GET    /files            - List all generated files
 * DELETE /files/:filename  - Delete a specific file
 * POST   /cleanup          - Remove old files
 */
const express = require("express");
const router = express.Router();
const {
  listFiles,
  deleteFile,
  cleanupOldFiles,
} = require("../services/fileManager");
const { success, error } = require("../utils/response");
const { AUTO_CLEANUP_HOURS } = require("../config");

// ─── List Files ──────────────────────────────────────────────
router.get("/files", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const ext = req.query.type || null; // ?type=pdf or ?type=png
  const files = listFiles(baseUrl, ext);

  return success(res, { total: files.length, files });
});

// ─── Delete File ─────────────────────────────────────────────
router.delete("/files/:filename", (req, res) => {
  const deleted = deleteFile(req.params.filename);

  if (!deleted) {
    return error(res, "File not found", null, 404);
  }

  return success(res, {
    message: "File deleted",
    filename: req.params.filename,
  });
});

// ─── Cleanup Old Files ──────────────────────────────────────
router.post("/cleanup", (req, res) => {
  const maxAgeHours = req.body.max_age_hours || AUTO_CLEANUP_HOURS;
  const result = cleanupOldFiles(maxAgeHours);

  return success(res, {
    message: "Cleanup completed",
    ...result,
  });
});

module.exports = router;
