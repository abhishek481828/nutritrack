const express  = require('express');
const router   = express.Router();
const { analyzeFood }   = require('../controllers/uploadController');
const { protect }       = require('../middleware/authMiddleware');
const upload            = require('../middleware/upload');
const { uploadLimiter } = require('../middleware/rateLimiter');

// POST /api/upload/analyze
// Protected + upload rate limited + multer handles file validation
router.post('/analyze', protect, uploadLimiter, upload.single('image'), analyzeFood);

module.exports = router;
