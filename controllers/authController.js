const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { calculateBMI } = require('../utils/dietCalculator');

/**
 * Generate JWT token for authenticated user
 * @param {string} id - User ID to encode in token
 * @returns {string} Signed JWT token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

/**
 * Register new user
 * @route POST /api/auth/register
 * @access Public
 */
const register = async (req, res) => {
  try {
    const { name, email, password, age, weight, height, goal } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password, age, weight, height, goal });

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      data: {
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          goal: user.goal,
        },
      },
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// @desc  Login user
// @route POST /api/auth/login
// @access Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    // Fetch user with password field explicitly
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        token: generateToken(user._id),
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          goal: user.goal,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get logged-in user profile
 * @route GET /api/auth/me
 * @access Private
 */
const getMe = async (req, res) => {
  const { _id, name, email, age, weight, height, goal, createdAt } = req.user;
  return res.status(200).json({
    success: true,
    data: {
      user: { id: _id, name, email, age, weight, height, goal, memberSince: createdAt },
    },
  });
};

const getProfile = getMe;

// @desc  Update logged-in user profile
// @route PUT /api/auth/profile   (protected)
const updateProfile = async (req, res) => {
  try {
    const allowedFields = ['name', 'age', 'weight', 'height', 'goal'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    const { _id, name, email, age, weight, height, goal, createdAt } = user;
    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      data: {
        user: { id: _id, name, email, age, weight, height, goal, memberSince: createdAt },
      },
    });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// @desc  Get BMI for logged-in user
// @route GET /api/auth/bmi  (protected)
const getBMI = (req, res) => {
  const { weight, height } = req.user;

  if (!weight || !height) {
    return res.status(400).json({
      success: false,
      message: 'Please update your profile with weight and height to calculate BMI.',
    });
  }

  const bmi = calculateBMI(weight, height);
  return res.status(200).json({ success: true, data: { bmi } });
};

module.exports = { register, login, getMe, getProfile, updateProfile, getBMI };
