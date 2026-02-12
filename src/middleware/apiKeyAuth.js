/**
 * API Key Middleware
 *
 * Validates 'x-api-key' header and enforces quotas/limits.
 */
const { validateKey, useKey } = require("../services/apiKey");

/**
 * Middleware to handle API Key authentication and tracking
 */
function apiKeyAuth(req, res, next) {
  // Skip API Key check for admin routes (already protected by JWT)
  if (
    req.path.startsWith("/admin/") ||
    req.path === "/admin-panel" ||
    req.path === "/docs"
  ) {
    return next();
  }

  const { getSettings } = require("../services/settings");
  const settings = getSettings();

  // 1. Maintenance Mode
  if (settings.maintenance_mode) {
    return res
      .status(503)
      .json({ status: "error", error: "API is under maintenance" });
  }

  const key = req.headers["x-api-key"];

  // 2. Guest Logic
  if (!key) {
    if (!settings.allow_guest_access) {
      return res.status(403).json({
        status: "error",
        error: "Private API: Valid x-api-key is required",
      });
    }
    req.userType = "guest";
    return next();
  }

  // If key is provided, it MUST be valid
  const { valid, error, data } = validateKey(key);

  if (!valid) {
    return res.status(401).json({
      status: "error",
      error: error || "Invalid API Key",
    });
  }

  // Attach key info to request
  req.apiKey = key;
  req.keyData = data;
  req.userType = "authenticated";

  // Track usage
  useKey(key);

  next();
}

module.exports = { apiKeyAuth };
