const express = require('express');
const router  = express.Router();
const { getDashboard, getTodaySummary, getWeeklyTrend, getMacroBreakdown } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

// All dashboard routes are protected
router.use(protect);

// ── Optimised: single endpoint, 2 DB queries ───────────────────────
router.get('/summary', getDashboard);     // GET /api/dashboard/summary

// ── Legacy endpoints (kept for backward compatibility) ─────────────
router.get('/today',  getTodaySummary);   // Today's calories + macros vs goal
router.get('/weekly', getWeeklyTrend);    // Last 7 days trend (chart data)
router.get('/macros', getMacroBreakdown); // Today's macro breakdown (pie chart)

module.exports = router;

