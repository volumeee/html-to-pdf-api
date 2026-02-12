/**
 * Rate Limiter Middleware
 */
const rateLimit = require("express-rate-limit");

// General API rate limiter
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    error: "Too many requests, please try again later.",
    retry_after_seconds: 60,
  },
});

// Stricter limiter for heavy endpoints (PDF/Image generation)
const renderLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30, // 30 renders per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    error: "Too many render requests. Max 30/minute.",
    retry_after_seconds: 60,
  },
});

module.exports = { apiLimiter, renderLimiter };
