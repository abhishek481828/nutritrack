const express  = require('express');
const router   = express.Router();
const { downloadWeeklyReport } = require('../controllers/reportController');
const { protect }        = require('../middleware/authMiddleware');
const { reportLimiter }  = require('../middleware/rateLimiter');

// GET /api/report/weekly — rate-limited, streams PDF download
router.get('/weekly', protect, reportLimiter, downloadWeeklyReport);

module.exports = router;
