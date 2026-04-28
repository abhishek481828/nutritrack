const express  = require('express');
const router   = express.Router();
const { register, login, getMe, getProfile, updateProfile, getBMI } = require('../controllers/authController');
const { protect }                = require('../middleware/authMiddleware');
const { authLimiter }            = require('../middleware/rateLimiter');
const { validateRegister, validateLogin, validateProfileUpdate } = require('../middleware/validate');

// Public — apply strict auth rate limiter + input validation
router.post('/register', authLimiter, validateRegister,  register);
router.post('/login',    authLimiter, validateLogin,     login);

// Protected
router.get('/profile', protect, getProfile);
router.get('/me',      protect, getMe);
router.put('/profile', protect, validateProfileUpdate, updateProfile);
router.get('/bmi',     protect, getBMI);

module.exports = router;
