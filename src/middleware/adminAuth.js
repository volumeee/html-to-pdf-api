/**
 * Admin Authentication Middleware
 *
 * Uses JWT tokens for admin panel authentication.
 * Credentials are set via environment variables.
 */
const jwt = require("jsonwebtoken");
const { ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET } = require("../config");

/**
 * Login and return JWT token
 */
function login(username, password) {
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ role: "admin", username }, JWT_SECRET, {
      expiresIn: "24h",
    });
    return { token, expires_in: "24h" };
  }
  return null;
}

/**
 * Middleware: verify JWT token from Authorization header
 */
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({
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

module.exports = { login, requireAdmin };
