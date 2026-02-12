/**
 * Global Settings Service
 *
 * Handles persistent application settings that can be changed via Admin Panel.
 */
const fs = require("fs");
const path = require("path");
const config = require("../config");

const SETTINGS_FILE = path.join(__dirname, "../../data/app_settings.json");

// Default settings from config.js
let appSettings = {
  auto_cleanup_hours: config.AUTO_CLEANUP_HOURS,
  max_body_size: config.MAX_BODY_SIZE,
  default_watermark: {
    text: "",
    opacity: 0.1,
    color: "#000000",
  },
  maintenance_mode: false,
  allow_guest_access: true, // if false, all requests MUST have valid x-api-key
};

function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      appSettings = {
        ...appSettings,
        ...JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8")),
      };
    }
  } catch (err) {
    console.error("[Settings] Could not load settings:", err.message);
  }
}

function saveSettings() {
  try {
    const dataDir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(appSettings, null, 2));
  } catch (err) {
    console.error("[Settings] Failed to save:", err.message);
  }
}

function getSettings() {
  return { ...appSettings };
}

function updateSettings(updates) {
  appSettings = { ...appSettings, ...updates };
  saveSettings();
  return appSettings;
}

// Load on startup
loadSettings();

module.exports = { getSettings, updateSettings };
