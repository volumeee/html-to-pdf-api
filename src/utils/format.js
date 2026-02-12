/**
 * Formatting utility functions
 */

/**
 * Format number to Indonesian Rupiah string
 * @param {number} num
 * @returns {string} e.g. "Rp 50.000"
 */
function formatRp(num) {
  return "Rp " + (num || 0).toLocaleString("id-ID");
}

/**
 * Generate a unique filename with timestamp
 * @param {string} prefix
 * @param {string} ext - file extension without dot
 * @returns {string}
 */
function generateFilename(prefix, ext = "pdf") {
  return `${prefix}_${Date.now()}.${ext}`;
}

module.exports = { formatRp, generateFilename };
