/**
 * Security Routes
 *
 * POST /encrypt-pdf     - Add password protection to a PDF
 * POST /sign-pdf        - Embed digital signature stamp on a PDF
 * GET  /secure/:filename - Serve file via signed URL
 *
 * Admin-only:
 * POST   /admin/signatures       - Upload signature stamp
 * GET    /admin/signatures       - List all signatures
 * DELETE /admin/signatures/:name - Delete signature
 */
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const { protectPdf, isQpdfAvailable } = require("../services/pdfUtils");
const {
  embedSignature,
  saveSignature,
  listSignatures,
  deleteSignature,
} = require("../services/signature");
const { generateSignedUrl, verifySignedUrl } = require("../services/signedUrl");
const { getFilePath } = require("../services/fileManager");
const { generateFilename } = require("../utils/format");
const { success, error } = require("../utils/response");
const { requireAdmin } = require("../middleware/adminAuth");

// ─── Encrypt PDF ─────────────────────────────────────────────
router.post("/encrypt-pdf", async (req, res) => {
  const { filename, password, user_password, owner_password } = req.body;

  if (!filename) {
    return error(res, "filename is required (name of PDF in output folder)");
  }
  if (!password && !user_password) {
    return error(res, "password is required");
  }

  if (!isQpdfAvailable()) {
    return error(
      res,
      "PDF encryption requires qpdf. It is not installed on this server.",
      null,
      501,
    );
  }

  const inputPath = getFilePath(filename);
  if (!fs.existsSync(inputPath)) {
    return error(res, `File not found: ${filename}`, null, 404);
  }

  const outFilename = generateFilename("encrypted", "pdf");
  const outputPath = getFilePath(outFilename);

  try {
    await protectPdf(inputPath, outputPath, password || user_password);

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return success(res, {
      message: "PDF encrypted with password protection",
      source: filename,
      file_url: `${baseUrl}/output/${outFilename}`,
      filename: outFilename,
      encryption: "AES-256",
    });
  } catch (err) {
    console.error("[Security] Encrypt error:", err.message);
    return error(res, "Failed to encrypt PDF", err.message, 500);
  }
});

// ─── Sign PDF (Digital Signature Stamp) ──────────────────────
router.post("/sign-pdf", async (req, res) => {
  const {
    filename,
    signature_name,
    signature_base64,
    position,
    page,
    width,
    height,
    x,
    y,
    opacity,
  } = req.body;

  if (!filename) {
    return error(res, "filename is required (name of PDF in output folder)");
  }
  if (!signature_name && !signature_base64) {
    return error(
      res,
      "Provide signature_name (saved stamp) or signature_base64 (inline image)",
    );
  }

  const inputPath = getFilePath(filename);
  if (!fs.existsSync(inputPath)) {
    return error(res, `File not found: ${filename}`, null, 404);
  }

  const outFilename = generateFilename("signed", "pdf");
  const outputPath = getFilePath(outFilename);

  try {
    await embedSignature(inputPath, outputPath, {
      signature_name,
      signature_base64,
      position: position || "bottom-right",
      page: page || 0,
      width: width || 120,
      height: height || 60,
      x,
      y,
      opacity,
    });

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    return success(res, {
      message: "PDF signed with digital stamp",
      source: filename,
      file_url: `${baseUrl}/output/${outFilename}`,
      filename: outFilename,
      signature: signature_name || "inline",
      position: position || "bottom-right",
      page: page || "last",
    });
  } catch (err) {
    console.error("[Security] Sign error:", err.message);
    return error(res, "Failed to sign PDF", err.message, 500);
  }
});

// ─── Signed URL File Access ──────────────────────────────────
router.get("/secure/:filename", (req, res) => {
  const { filename } = req.params;
  const { expires, sig } = req.query;

  if (!expires || !sig) {
    return error(
      res,
      "Missing signed URL parameters (expires, sig)",
      null,
      403,
    );
  }

  const result = verifySignedUrl(filename, expires, sig);
  if (!result.valid) {
    return error(res, result.error, null, 403);
  }

  const filePath = getFilePath(filename);
  if (!fs.existsSync(filePath)) {
    return error(res, "File not found", null, 404);
  }

  // Serve the file
  const ext = path.extname(filename).toLowerCase();
  const contentTypes = {
    ".pdf": "application/pdf",
    ".png": "image/png",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".webp": "image/webp",
    ".csv": "text/csv",
  };

  res.setHeader(
    "Content-Type",
    contentTypes[ext] || "application/octet-stream",
  );
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  res.setHeader("Cache-Control", "no-store");
  res.sendFile(filePath);
});

// ─── Generate Signed URL ────────────────────────────────────
router.post("/secure/generate", (req, res) => {
  const { filename, expiry_minutes } = req.body;

  if (!filename) {
    return error(res, "filename is required");
  }

  const filePath = getFilePath(filename);
  if (!fs.existsSync(filePath)) {
    return error(res, `File not found: ${filename}`, null, 404);
  }

  const baseUrl = `${req.protocol}://${req.get("host")}`;
  const signed = generateSignedUrl(baseUrl, filename, expiry_minutes);

  return success(res, {
    message: "Signed URL generated",
    filename,
    ...signed,
  });
});

// ─── Admin: Signature Management ─────────────────────────────
router.get("/admin/signatures", requireAdmin, (req, res) => {
  return success(res, { signatures: listSignatures() });
});

router.post("/admin/signatures", requireAdmin, (req, res) => {
  const { name, image } = req.body;

  if (!name || !image) {
    return error(res, "name and image (base64) are required");
  }

  try {
    const result = saveSignature(name, image);
    return success(res, { message: "Signature saved", signature: result });
  } catch (err) {
    return error(res, "Failed to save signature", err.message, 500);
  }
});

router.delete("/admin/signatures/:name", requireAdmin, (req, res) => {
  const deleted = deleteSignature(req.params.name);
  if (!deleted) return error(res, "Signature not found", null, 404);
  return success(res, { message: "Signature deleted" });
});

module.exports = router;
