/**
 * File Manager Service
 * Handles listing, deleting, and auto-cleaning generated files.
 */
const fs = require("fs");
const path = require("path");

const outputDir = path.join(__dirname, "../../output");

// Ensure output directory exists on import
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

/**
 * Get the absolute output directory path
 * @returns {string}
 */
function getOutputDir() {
  return outputDir;
}

/**
 * Build a full file path inside the output directory
 * @param {string} filename
 * @returns {string}
 */
function getFilePath(filename) {
  // Sanitize filename to prevent directory traversal
  const sanitized = path.basename(filename);
  return path.join(outputDir, sanitized);
}

/**
 * List all files with a given extension
 * @param {string} ext - e.g. "pdf", "png"
 * @param {string} baseUrl - e.g. "http://localhost:3000"
 * @returns {Array}
 */
function listFiles(baseUrl, ext = null) {
  const files = fs.readdirSync(outputDir).filter((f) => {
    if (ext) return f.endsWith(`.${ext}`);
    return !f.startsWith(".");
  });

  return files
    .map((f) => {
      const stats = fs.statSync(path.join(outputDir, f));
      return {
        filename: f,
        url: `${baseUrl}/output/${f}`,
        size_kb: Math.round(stats.size / 1024),
        created: stats.birthtime,
      };
    })
    .sort((a, b) => new Date(b.created) - new Date(a.created));
}

/**
 * Delete a specific file
 * @param {string} filename
 * @returns {boolean} true if deleted
 */
function deleteFile(filename) {
  const filePath = getFilePath(filename);
  if (!fs.existsSync(filePath)) return false;
  fs.unlinkSync(filePath);
  return true;
}

/**
 * Clean up files older than maxAgeHours
 * @param {number} maxAgeHours
 * @returns {{ deleted: number, remaining: number }}
 */
function cleanupOldFiles(maxAgeHours) {
  const now = Date.now();
  const files = fs.readdirSync(outputDir).filter((f) => !f.startsWith("."));
  let deleted = 0;

  files.forEach((f) => {
    const filePath = path.join(outputDir, f);
    const stats = fs.statSync(filePath);
    const ageHours = (now - stats.mtimeMs) / (1000 * 60 * 60);

    if (ageHours > maxAgeHours) {
      fs.unlinkSync(filePath);
      deleted++;
    }
  });

  return { deleted, remaining: files.length - deleted };
}

module.exports = {
  getOutputDir,
  getFilePath,
  listFiles,
  deleteFile,
  cleanupOldFiles,
};
