/**
 * Convert Routes
 *
 * POST /pdf-to-image   - Convert a generated PDF to image(s)
 * POST /to-csv         - Convert template data to CSV
 */
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { renderImage } = require("../services/renderer");
const { getFilePath } = require("../services/fileManager");
const { generateFilename } = require("../utils/format");
const { success, error } = require("../utils/response");

// ─── PDF to Image ────────────────────────────────────────────
router.post("/pdf-to-image", async (req, res) => {
  const { filename, format, quality, page_size } = req.body;

  if (!filename) {
    return error(
      res,
      "filename is required (name of the PDF in output folder)",
    );
  }

  const pdfPath = getFilePath(filename);
  if (!fs.existsSync(pdfPath)) {
    return error(res, `File not found: ${filename}`, null, 404);
  }

  const ext = ["png", "jpeg", "webp"].includes(format) ? format : "png";
  const imgFilename = generateFilename("pdf2img", ext);
  const imgPath = getFilePath(imgFilename);

  try {
    const port = require("../config").PORT;
    const pdfUrl = `http://localhost:${port}/output/${path.basename(filename)}`;

    await renderImage({ url: pdfUrl }, imgPath, {
      pageSize: page_size || "a4",
      format: ext,
      quality,
      fullPage: true,
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return success(res, {
      message: "PDF converted to image successfully",
      source: filename,
      file_url: `${baseUrl}/output/${imgFilename}`,
      filename: imgFilename,
      format: ext,
    });
  } catch (err) {
    console.error("[Convert] PDF→Image error:", err.message);
    return error(res, "Failed to convert PDF to image", err.message, 500);
  }
});

// ─── Data to CSV ─────────────────────────────────────────────
router.post("/to-csv", (req, res) => {
  const { data, columns, filename } = req.body;

  if (!data || !Array.isArray(data) || data.length === 0) {
    return error(res, "data is required (array of objects)");
  }

  try {
    // Auto-detect columns if not provided
    const cols = columns || Object.keys(data[0]);

    // Build CSV
    const header = cols.join(",");
    const rows = data.map((row) =>
      cols
        .map((col) => {
          const val = row[col] !== undefined ? String(row[col]) : "";
          // Escape commas and quotes
          return val.includes(",") || val.includes('"') || val.includes("\n")
            ? `"${val.replace(/"/g, '""')}"`
            : val;
        })
        .join(","),
    );

    const csv = [header, ...rows].join("\n");
    const csvFilename = filename || generateFilename("export", "csv");
    const csvPath = getFilePath(csvFilename);

    fs.writeFileSync(csvPath, csv, "utf-8");

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return success(res, {
      message: "CSV generated successfully",
      file_url: `${baseUrl}/output/${csvFilename}`,
      filename: csvFilename,
      total_rows: data.length,
      columns: cols,
    });
  } catch (err) {
    console.error("[Convert] CSV error:", err.message);
    return error(res, "Failed to generate CSV", err.message, 500);
  }
});

module.exports = router;
