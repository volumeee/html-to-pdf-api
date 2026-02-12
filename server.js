const express = require("express");
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use("/output", express.static(path.join(__dirname, "output")));

// Ensure output directory exists
const outputDir = path.join(__dirname, "output");
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

/**
 * Endpoint to generate PDF from HTML
 * Method: POST
 * Body: { html_content, filename }
 */
app.post("/cetak_struk_pdf", async (req, res) => {
  const { html_content, filename } = req.body;

  if (!html_content) {
    return res.status(400).json({ error: "html_content is required" });
  }

  const pdfFilename = filename || `struk_${Date.now()}.pdf`;
  const pdfPath = path.join(outputDir, pdfFilename);

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null,
    });
    const page = await browser.newPage();

    // Set viewport to the receipt width
    await page.setViewport({ width: 380, height: 600 });

    await page.setContent(html_content, { waitUntil: "networkidle0" });

    // Generate PDF
    await page.pdf({
      path: pdfPath,
      width: "380px",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });

    await browser.close();

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const fileUrl = `${baseUrl}/output/${pdfFilename}`;

    res.json({
      status: "success",
      message: "PDF created successfully",
      base_url: baseUrl,
      file_url: fileUrl,
      filename: pdfFilename,
    });
  } catch (error) {
    console.error("Error generating PDF:", error);
    res
      .status(500)
      .json({ error: "Failed to generate PDF", detail: error.message });
  }
});

/**
 * Health check endpoint
 */
app.get("/", (req, res) => {
  res.send(
    "HTML to PDF API is running. Use POST /cetak_struk_pdf to generate PDFs.",
  );
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
