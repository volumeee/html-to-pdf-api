/**
 * API Key Management Service
 *
 * Handles: CRUD for API Keys, Quota tracking, and Persistence.
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const KEYS_FILE = path.join(__dirname, "../../data/keys.json");

// Ensure data directory exists
const dataDir = path.dirname(KEYS_FILE);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// ─── In-Memory State ────────────────────────────────────────
let apiKeys = {};

/**
 * Load keys from file on startup
 */
function loadKeys() {
  try {
    if (fs.existsSync(KEYS_FILE)) {
      apiKeys = JSON.parse(fs.readFileSync(KEYS_FILE, "utf-8"));
    }
  } catch (err) {
    console.error("[ApiKey] Could not load keys:", err.message);
  }
}

/**
 * Save keys to file
 */
function saveKeys() {
  try {
    fs.writeFileSync(KEYS_FILE, JSON.stringify(apiKeys, null, 2));
  } catch (err) {
    console.error("[ApiKey] Failed to save:", err.message);
  }
}

/**
 * Generate a unique API Key
 */
function createKey(name, options = {}) {
  const key = "hp_" + crypto.randomBytes(24).toString("hex");
  apiKeys[key] = {
    name: name || "Untitled Key",
    created_at: new Date().toISOString(),
    quota_limit: options.quota_limit || -1, // -1 = unlimited
    quota_used: 0,
    rate_limit: options.rate_limit || 60, // req per minute
    status: "active",
    last_used: null,
    settings: options.settings || {},
  };
  saveKeys();
  return { key, ...apiKeys[key] };
}

/**
 * Get all keys (for admin)
 */
function getAllKeys() {
  return Object.entries(apiKeys).map(([key, data]) => ({
    key_masked: key.substring(0, 6) + "..." + key.substring(key.length - 4),
    key_id: key, // Full key for admin management
    ...data,
  }));
}

/**
 * Validate a key and check quota
 */
function validateKey(key) {
  const keyData = apiKeys[key];
  if (!keyData) return { valid: false, error: "Invalid API Key" };
  if (keyData.status !== "active")
    return { valid: false, error: "API Key is inactive" };

  // Quota check
  if (keyData.quota_limit !== -1 && keyData.quota_used >= keyData.quota_limit) {
    return { valid: false, error: "Quota exceeded" };
  }

  return { valid: true, data: keyData };
}

/**
 * Update quota use
 */
function useKey(key) {
  if (apiKeys[key]) {
    apiKeys[key].quota_used++;
    apiKeys[key].last_used = new Date().toISOString();
    // Don't save on every single request for performance,
    // maybe every few min or via debounced save.
    // For now, let's keep it in memory and rely on periodic saveStats or explicit save.
  }
}

/**
 * Update Key details
 */
function updateKey(key, updates) {
  if (apiKeys[key]) {
    apiKeys[key] = { ...apiKeys[key], ...updates };
    saveKeys();
    return true;
  }
  return false;
}

/**
 * Delete a key
 */
function deleteKey(key) {
  if (apiKeys[key]) {
    delete apiKeys[key];
    saveKeys();
    return true;
  }
  return false;
}

// Load on startup
loadKeys();

module.exports = {
  createKey,
  getAllKeys,
  validateKey,
  useKey,
  updateKey,
  deleteKey,
  saveKeys,
};
