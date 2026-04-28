const FoodLog = require('../models/FoodLog');
const { getAIResponse } = require('../services/aiService');
const { toFoodLogEntryDTO } = require('../utils/foodLogNutrition');

// @desc  AI nutrition chat response using user profile + recent food logs
// @route POST /api/chat/ai
// @access Private
const aiChat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Please enter a message.' });
    }

    if (message.trim().length > 1000) {
      return res.status(400).json({ success: false, message: 'Message too long (max 1000 chars).' });
    }

    const logs = await FoodLog.find({ userId: req.user._id })
      .populate('foodId', 'name calories protein carbs fat')
      .sort({ date: -1, time: -1 })
      .limit(5)
      .lean();

    const recentLogs = logs.map(toFoodLogEntryDTO).map((entry) => ({
      foodName: entry.foodName,
      calories: entry.calories,
      protein: entry.protein,
      carbs: entry.carbs,
      fats: entry.fat,
      date: entry.date,
    }));

    const reply = await getAIResponse(req.user, recentLogs, message);

    return res.status(200).json({ success: true, reply });
  } catch (error) {
    const statusCode = error.statusCode || error.status || 500;
    const message = statusCode >= 500 ? 'Failed to generate AI response.' : error.message;

    return res.status(statusCode).json({ success: false, message });
  }
};

module.exports = { aiChat };
