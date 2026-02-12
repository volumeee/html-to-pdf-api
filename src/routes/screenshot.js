/**
 * Screenshot Routes
 *
 * POST /html-to-image   - HTML → Screenshot (PNG/JPEG/WebP)
 * POST /url-to-image    - URL  → Screenshot (PNG/JPEG/WebP)
 */
const express = require("express");
const router = express.Router();
const { renderImage } = require("../services/renderer");
const { getFilePath } = require("../services/fileManager");
const { generateFilename } = require("../utils/format");
const { success, error } = require("../utils/response");
const { IMAGE_FORMATS } = require("../config");

// ─── HTML → Image ────────────────────────────────────────────
router.post("/html-to-image", async (req, res) => {
  const { html_content, filename, page_size, format, quality, full_page } =
    req.body;

  if (!html_content) {
    return error(res, "html_content is required");
  }

  const ext = IMAGE_FORMATS.includes(format) ? format : "png";
  const imgFilename = filename || generateFilename("screenshot", ext);
  const imgPath = getFilePath(imgFilename);

  try {
    await renderImage({ html: html_content }, imgPath, {
      pageSize: page_size,
      format: ext,
      quality,
      fullPage: full_page,
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return success(res, {
      message: "Screenshot created successfully",
      file_url: `${baseUrl}/output/${imgFilename}`,
      filename: imgFilename,
      format: ext,
    });
  } catch (err) {
    console.error("[Screenshot] HTML→Image error:", err.message);
    return error(res, "Failed to generate screenshot", err.message, 500);
  }
});

// ─── URL → Image ─────────────────────────────────────────────
router.post("/url-to-image", async (req, res) => {
  const { url, filename, page_size, format, quality, full_page } = req.body;

  if (!url) {
    return error(res, "url is required");
  }

  const ext = IMAGE_FORMATS.includes(format) ? format : "png";
  const imgFilename = filename || generateFilename("webshot", ext);
  const imgPath = getFilePath(imgFilename);

  try {
    await renderImage({ url }, imgPath, {
      pageSize: page_size || "a4",
      format: ext,
      quality,
      fullPage: full_page,
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return success(res, {
      message: "URL screenshot captured successfully",
      source_url: url,
      file_url: `${baseUrl}/output/${imgFilename}`,
      filename: imgFilename,
      format: ext,
    });
  } catch (err) {
    console.error("[Screenshot] URL→Image error:", err.message);
    return error(res, "Failed to capture URL screenshot", err.message, 500);
  }
});

module.exports = router;
