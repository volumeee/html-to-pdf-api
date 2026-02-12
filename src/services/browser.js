/**
 * Puppeteer Browser Singleton
 *
 * Reuses a single browser instance across all requests
 * instead of launching a new one each time (major performance gain).
 */
const puppeteer = require("puppeteer");
const { BROWSER_OPTIONS } = require("../config");

let browserInstance = null;

/**
 * Get or create the shared browser instance
 * @returns {Promise<import('puppeteer').Browser>}
 */
async function getBrowser() {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await puppeteer.launch(BROWSER_OPTIONS);

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
 * Gracefully close the browser
 */
async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

module.exports = { getBrowser, createPage, closeBrowser };
