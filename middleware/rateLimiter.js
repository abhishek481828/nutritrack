const rateLimit = require('express-rate-limit');
const isProd = process.env.NODE_ENV === 'production';

// ─── Helper: shared rate-limit response formatter ────────────────────
const handler = (req, res) =>
  res.status(429).json({
    success: false,
    message: 'Too many requests. Please slow down and try again later.',
  });

// ─── Global limiter — all routes ────────────────────────────────────
// 150 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: isProd ? 150 : 2000,
  standardHeaders: true,       // Return RateLimit-* headers
  legacyHeaders: false,
  handler,
});

// ─── Auth limiter — login & register ────────────────────────────────
// Strict: 10 attempts per 15 minutes to prevent brute force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 10 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
  skipSuccessfulRequests: true, // Only count failed/4xx responses
});

// ─── Upload limiter — image analysis (Spoonacular costs per call) ────
// 20 uploads per hour
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,   // 1 hour
  max: isProd ? 20 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

// ─── Report limiter — PDF generation (CPU/memory intensive) ─────────
// 10 reports per hour
const reportLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProd ? 10 : 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

module.exports = { globalLimiter, authLimiter, uploadLimiter, reportLimiter };
