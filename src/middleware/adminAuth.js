/**
 * Admin Authentication Middleware
 *
 * Uses JWT tokens for admin panel authentication.
 * Credentials are set via environment variables.
 * v7.1.0: Password comparison via bcryptjs (hashed passwords supported).
 */
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET } = require("../config");

// Hash the default password on startup for faster comparison
let adminPasswordHash = null;

(async () => {
  try {
    adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  } catch {
    console.warn(
      "[Auth] Could not hash admin password, using plain comparison.",
    );
  }
})();

/**
 * Login and return JWT token
 * Supports both plain and bcrypt-hashed passwords.
 */
async function login(username, password) {
  const { getSettings } = require("../services/settings");
  const settings = getSettings();

  // Username must match
  if (username !== settings.admin_username) return null;

  // Check password: try bcrypt first, then fallback to plain comparison
  let passwordValid = false;

  // If stored password looks like a bcrypt hash ($2a$, $2b$, $2y$)
  if (settings.admin_password && settings.admin_password.startsWith("$2")) {
    passwordValid = await bcrypt.compare(password, settings.admin_password);
  } else {
    // Plain text comparison (legacy) + env var comparison
    passwordValid = password === settings.admin_password;
  }

  if (!passwordValid) return null;

  const token = jwt.sign({ role: "admin", username }, JWT_SECRET, {
    expiresIn: "24h",
  });
  return { token, expires_in: "24h" };
}

/**
 * Hash a password using bcrypt
 * @param {string} plainPassword
 * @returns {Promise<string>}
 */
async function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, 12);
}

/**
 * Verify a password against a hash
 * @param {string} plainPassword
 * @param {string} hashedPassword
 * @returns {Promise<boolean>}
 */
async function verifyPassword(plainPassword, hashedPassword) {
  if (hashedPassword.startsWith("$2")) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
  return plainPassword === hashedPassword;
}

/**
 * Middleware: verify JWT token from Authorization header
 */
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      status: "error",
      error: "Authorization required. Use: Bearer <token>",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res
      .status(401)
      .json({ status: "error", error: "Invalid or expired token" });
  }
}

module.exports = { login, requireAdmin, hashPassword, verifyPassword };
