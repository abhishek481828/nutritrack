const express  = require('express');
const router   = express.Router();
const { getDietPlan, previewDietPlan, calculateNutrition, recommendDiet } = require('../controllers/dietController');
const { protect } = require('../middleware/authMiddleware');

// GET  /api/diet/plan    → uses logged-in user's profile (protected)
// POST /api/diet/preview → quick plan with custom weight + goal (public)
router.get('/plan',    protect, getDietPlan);
router.get('/recommend', protect, recommendDiet);
router.post('/preview',         previewDietPlan);
router.get('/calculate', protect, calculateNutrition);
router.post('/calculate', protect, calculateNutrition);

module.exports = router;
