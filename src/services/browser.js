/**
 * Puppeteer Browser Pool
 *
 * Manages a pool of browser instances for parallel request handling.
 * Falls back to single instance when BROWSER_POOL_SIZE=1.
 *
 * v7.1.0: Full pool support with round-robin allocation and health monitoring.
 */
const puppeteer = require("puppeteer");
const { BROWSER_OPTIONS, BROWSER_POOL_SIZE } = require("../config");

const pool = [];
let totalLaunchCount = 0;
let lastHealthCheck = null;
let nextIndex = 0;

/**
 * Initialize or get a browser instance at the given pool index
 */
async function getOrCreateBrowser(index) {
  if (!pool[index] || !pool[index].isConnected()) {
    pool[index] = await puppeteer.launch(BROWSER_OPTIONS);
    totalLaunchCount++;

    const idx = index;
    pool[idx].on("disconnected", () => {
      pool[idx] = null;
      console.log(
        `[Browser Pool] Instance #${idx} disconnected, will relaunch on next request.`,
      );
    });

    console.log(
      `[Browser Pool] Launched instance #${idx} (total launches: ${totalLaunchCount})`,
    );
  }
  return pool[index];
}

/**
 * Get a browser from the pool (round-robin)
 * @returns {Promise<import('puppeteer').Browser>}
 */
async function getBrowser() {
  const poolSize = Math.max(1, BROWSER_POOL_SIZE);

  if (poolSize === 1) {
    return getOrCreateBrowser(0);
  }

  // Round-robin allocation
  const index = nextIndex % poolSize;
  nextIndex = (nextIndex + 1) % poolSize;

  return getOrCreateBrowser(index);
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
 * Get browser pool health status
 * @returns {Promise<object>}
 */
async function getHealth() {
  const poolSize = Math.max(1, BROWSER_POOL_SIZE);
  const instances = [];
  let totalPages = 0;
  let connectedCount = 0;

  for (let i = 0; i < poolSize; i++) {
    const instance = {
      index: i,
      connected: false,
      pages: 0,
      version: null,
    };

    try {
      if (pool[i] && pool[i].isConnected()) {
        instance.connected = true;
        connectedCount++;
        const pages = await pool[i].pages();
        instance.pages = pages.length;
        totalPages += pages.length;
        instance.version = await pool[i].version();
      }
    } catch (err) {
      instance.error = err.message;
    }

    instances.push(instance);
  }

  const status = {
    connected: connectedCount > 0,
    pool_size: poolSize,
    active_instances: connectedCount,
    pages: totalPages,
    launch_count: totalLaunchCount,
    last_check: new Date().toISOString(),
    version: instances.find((i) => i.version)?.version || null,
  };

  // Only include per-instance details if pool > 1
  if (poolSize > 1) {
    status.instances = instances;
  }

  lastHealthCheck = status;
  return status;
}

/**
 * Gracefully close all browser instances
 */
async function closeBrowser() {
  const closePromises = pool.map(async (browser, i) => {
    if (browser) {
      try {
        await browser.close();
      } catch {
        // Ignore close errors
      }
      pool[i] = null;
    }
  });
  await Promise.all(closePromises);
  console.log("[Browser Pool] All instances closed.");
}

module.exports = { getBrowser, createPage, closeBrowser, getHealth };
