/**
 * Signed URL Service
 *
 * Generates time-limited, tamper-proof URLs for accessing generated files.
 * Uses HMAC-SHA256 for signature verification.
 */
const crypto = require("crypto");
const config = require("../config");

/**
 * Generate a signed URL for a file
 * @param {string} baseUrl - e.g., "http://localhost:3000"
 * @param {string} filename - the output filename
 * @param {number} expiryMinutes - minutes until URL expires (default from config)
 * @returns {object} { signed_url, expires_at }
 */
function generateSignedUrl(baseUrl, filename, expiryMinutes) {
  const expiry = expiryMinutes || config.SIGNED_URL_EXPIRY_MINUTES;
  const expiresAt = Date.now() + expiry * 60 * 1000;

  const payload = `${filename}:${expiresAt}`;
  const signature = crypto
    .createHmac("sha256", config.SIGNED_URL_SECRET)
    .update(payload)
    .digest("hex");

  const signedUrl = `${baseUrl}/secure/${filename}?expires=${expiresAt}&sig=${signature}`;

  return {
    signed_url: signedUrl,
    expires_at: new Date(expiresAt).toISOString(),
    expires_in_minutes: expiry,
  };
}

/**
 * Verify a signed URL
 * @param {string} filename
 * @param {string|number} expires - timestamp
 * @param {string} sig - the HMAC signature
 * @returns {{ valid: boolean, error?: string }}
 */
function verifySignedUrl(filename, expires, sig) {
  const now = Date.now();
  const expiresNum = parseInt(expires);

  // Check expiry
  if (isNaN(expiresNum) || now > expiresNum) {
    return { valid: false, error: "URL has expired" };
  }

  // Verify signature
  const payload = `${filename}:${expiresNum}`;
  const expectedSig = crypto
    .createHmac("sha256", config.SIGNED_URL_SECRET)
    .update(payload)
    .digest("hex");

  if (sig !== expectedSig) {
    return { valid: false, error: "Invalid signature" };
  }

  return { valid: true };
}

module.exports = { generateSignedUrl, verifySignedUrl };
