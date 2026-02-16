/**
 * Application configuration & constants
 */
require("dotenv").config();

module.exports = {
  PORT: parseInt(process.env.PORT) || 3000,
  AUTO_CLEANUP_HOURS: parseInt(process.env.AUTO_CLEANUP_HOURS) || 24,
  MAX_BODY_SIZE: process.env.MAX_BODY_SIZE || "10mb",
  OUTPUT_DIR: "output",

  // Admin credentials
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || "admin",
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "admin123",
  JWT_SECRET:
    process.env.JWT_SECRET || "html-to-pdf-secret-key-change-in-production",

  // Security
  CORS_ORIGINS: process.env.CORS_ORIGINS || "*", // comma-separated origins or *
  REQUEST_TIMEOUT_MS: parseInt(process.env.REQUEST_TIMEOUT_MS) || 120000, // 2 minutes
  SIGNED_URL_SECRET:
    process.env.SIGNED_URL_SECRET || "signed-url-secret-change-me",
  SIGNED_URL_EXPIRY_MINUTES:
    parseInt(process.env.SIGNED_URL_EXPIRY_MINUTES) || 60,

  // Puppeteer launch options
  BROWSER_OPTIONS: {
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-extensions",
      "--no-first-run",
      "--disable-background-networking",
      "--disable-default-apps",
      "--disable-sync",
      "--metrics-recording-only",
      "--mute-audio",
      "--no-default-browser-check",
      "--no-margin-updates",
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
  },

  // Browser pool
  BROWSER_POOL_SIZE: parseInt(process.env.BROWSER_POOL_SIZE) || 1,

  // Queue
  QUEUE_CONCURRENCY: parseInt(process.env.QUEUE_CONCURRENCY) || 3,

  // Page size presets
  PAGE_SIZES: {
    thermal_58mm: { width: "58mm", viewport: 220 }, // Standard 58mm (approx 48mm printable)
    thermal_80mm: { width: "80mm", viewport: 302 }, // Standard 80mm (approx 72mm printable)
    thermal_default: { width: "58mm", viewport: 220 }, // Default to 58mm for better compatibility
    a4: { width: "210mm", height: "297mm", viewport: 794 },
    a5: { width: "148mm", height: "210mm", viewport: 559 },
    letter: { width: "8.5in", height: "11in", viewport: 816 },
    legal: { width: "8.5in", height: "14in", viewport: 816 },
    label: { width: "100mm", height: "150mm", viewport: 378 },
    sertifikat: { width: "297mm", height: "210mm", viewport: 1123 },
  },

  // Supported image formats
  IMAGE_FORMATS: ["png", "jpeg", "webp"],

  // Webhook
  WEBHOOK_MAX_RETRIES: parseInt(process.env.WEBHOOK_MAX_RETRIES) || 3,
  WEBHOOK_RETRY_DELAY_MS: parseInt(process.env.WEBHOOK_RETRY_DELAY_MS) || 3000,
};
