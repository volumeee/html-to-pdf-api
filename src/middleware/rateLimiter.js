/**
 * Rate Limiter Middleware
 */
const rateLimit = require("express-rate-limit");

/**
 * Key Generator: Use API Key if present, otherwise fallback to IP
 */
const keyGenerator = (req) => {
  return req.headers["x-api-key"] || req.ip;
};

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: (req) => {
    // If API Key has custom rate limit, use it, otherwise use 60
    return req.keyData?.rate_limit || 60;
  },
  keyGenerator,
  validate: { keyGenerator: false }, // Disable IPv6 keygen validation as we use custom key/IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    error: "Too many requests, please try again later.",
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).send(options.message);
  },
});

// Stricter limiter for heavy endpoints
const renderLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: (req) => {
    // Render limit is usually half of general limit, or custom
    return Math.max(5, Math.floor((req.keyData?.rate_limit || 30) / 2));
  },
  keyGenerator,
  validate: { keyGenerator: false },
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    error: "Too many render requests. Please check your plan limits.",
  },
});

module.exports = { apiLimiter, renderLimiter };
