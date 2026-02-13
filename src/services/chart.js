/**
 * Chart Generation Service
 *
 * Generates beautiful charts from JSON data using Chart.js inside Puppeteer.
 */
const { createPage } = require("./browser");

/**
 * Render a chart to a base64 image or file
 *
 * @param {object} chartData - Chart.js configuration object
 * @param {object} options - Customization (width, height, background)
 * @returns {Promise<string>} Base64 data URI of the chart
 */
async function generateChartImage(chartData, options = {}) {
  const width = options.width || 800;
  const height = options.height || 400;
  const background = options.background || "white";

  const page = await createPage(width, height);

  try {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
          body { background: ${background}; margin: 0; padding: 0; display: flex; justify-content: center; align-items: center; }
          canvas { width: ${width}px !important; height: ${height}px !important; }
        </style>
      </head>
      <body>
        <div style="width: ${width}px; height: ${height}px;">
          <canvas id="myChart"></canvas>
        </div>
        <script>
          const ctx = document.getElementById('myChart').getContext('2d');
          new Chart(ctx, ${JSON.stringify(chartData)});
          window.__CHART_READY__ = true;
        </script>
      </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: "networkidle0" });
    await page.waitForFunction(() => window.__CHART_READY__ === true);

    const base64 = await page.screenshot({
      type: "png",
      encoding: "base64",
      omitBackground: background === "transparent",
    });

    return `data:image/png;base64,${base64}`;
  } finally {
    await page.close();
  }
}

module.exports = { generateChartImage };
