const express = require('express');
const router  = express.Router();
const { chat } = require('../controllers/chatController');
const { aiChat } = require('../controllers/aiChatController');
const { protect } = require('../middleware/authMiddleware');

// POST /api/chat  — public rule-based nutrition assistant
router.post('/', protect, chat);

// POST /api/chat/ai — protected AI assistant endpoint
router.post('/ai', protect, aiChat);

module.exports = router;
