/**
 * Application configuration & constants
 */
require("dotenv").config();

module.exports = {
  PORT: parseInt(process.env.PORT) || 3000,
  AUTO_CLEANUP_HOURS: parseInt(process.env.AUTO_CLEANUP_HOURS) || 24,
  MAX_BODY_SIZE: process.env.MAX_BODY_SIZE || "10mb",
  OUTPUT_DIR: "output",

  // Puppeteer launch options
  BROWSER_OPTIONS: {
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
  },

  // Page size presets
  PAGE_SIZES: {
    thermal_58mm: { width: "220px", viewport: 220 },
    thermal_80mm: { width: "302px", viewport: 302 },
    thermal_default: { width: "380px", viewport: 380 },
    a4: { width: "210mm", height: "297mm", viewport: 794 },
    a5: { width: "148mm", height: "210mm", viewport: 559 },
    letter: { width: "8.5in", height: "11in", viewport: 816 },
  },

  // Supported image formats
  IMAGE_FORMATS: ["png", "jpeg", "webp"],
};
