const express = require('express');
const router = express.Router();
const {
	addFoodLog,
	getDailyLogs,
	getPaginatedFoodLogs,
	updateFoodLog,
	deleteFoodLog,
} = require('../controllers/foodLogController');
const { protect } = require('../middleware/authMiddleware');
const { validateFoodLog, validateFoodLogUpdate } = require('../middleware/validate');

router.use(protect);

// POST /api/food-logs
// GET  /api/food-logs?date=YYYY-MM-DD
router.route('/')
	.post(validateFoodLog, addFoodLog)
	.get(getDailyLogs);

// GET /api/food-logs/history?page=1&limit=10
router.get('/history', getPaginatedFoodLogs);

// PUT    /api/food-logs/:id
// DELETE /api/food-logs/:id
router.route('/:id')
	.put(validateFoodLogUpdate, updateFoodLog)
	.delete(deleteFoodLog);

module.exports = router;
