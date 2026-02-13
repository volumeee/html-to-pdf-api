/**
 * Puppeteer Browser Singleton
 *
 * Reuses a single browser instance across all requests
 * instead of launching a new one each time (major performance gain).
 *
 * v7.0.0: Added health check and proactive monitoring.
 */
const puppeteer = require("puppeteer");
const { BROWSER_OPTIONS } = require("../config");

let browserInstance = null;
let launchCount = 0;
let lastHealthCheck = null;

/**
 * Get or create the shared browser instance
 * @returns {Promise<import('puppeteer').Browser>}
 */
async function getBrowser() {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await puppeteer.launch(BROWSER_OPTIONS);
    launchCount++;

    browserInstance.on("disconnected", () => {
      browserInstance = null;
      console.log("[Browser] Disconnected, will relaunch on next request.");
    });

    console.log("[Browser] Launched new instance.");
  }
  return browserInstance;
}

/**
 * Create a new page with common defaults
 * @param {number} viewportWidth
 * @param {number} viewportHeight
 * @returns {Promise<import('puppeteer').Page>}
 */
async function createPage(viewportWidth = 380, viewportHeight = 800) {
  const browser = await getBrowser();
  const page = await browser.newPage();
  await page.setViewport({ width: viewportWidth, height: viewportHeight });
  return page;
}

/**
 * Get browser health status
 * @returns {Promise<object>}
 */
async function getHealth() {
  const status = {
    connected: false,
    pages: 0,
    launch_count: launchCount,
    last_check: new Date().toISOString(),
    version: null,
  };

  try {
    if (browserInstance && browserInstance.isConnected()) {
      status.connected = true;
      const pages = await browserInstance.pages();
      status.pages = pages.length;
      status.version = await browserInstance.version();
    }
  } catch (err) {
    status.error = err.message;
  }

  lastHealthCheck = status;
  return status;
}

/**
 * Gracefully close the browser
 */
async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

module.exports = { getBrowser, createPage, closeBrowser, getHealth };
