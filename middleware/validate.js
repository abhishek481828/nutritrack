const { body, validationResult } = require('express-validator');

// ─── Run validation and return 400 on failure ───────────────────────
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,   // return the first error message
      errors:  errors.array().map((e) => ({ field: e.path, msg: e.msg })),
    });
  }
  next();
};

// ─── Register validation rules ──────────────────────────────────────
const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),

  body('age')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 10, max: 120 }).withMessage('Age must be between 10 and 120.'),

  body('weight')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 20, max: 500 }).withMessage('Weight must be between 20 and 500 kg.'),

  body('height')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 50, max: 300 }).withMessage('Height must be between 50 and 300 cm.'),

  body('goal')
    .optional()
    .isIn(['lose_weight', 'gain_muscle', 'maintain', 'eat_healthy'])
    .withMessage('Goal must be one of: lose_weight, gain_muscle, maintain, eat_healthy.'),

  validate,
];

// ─── Login validation rules ─────────────────────────────────────────
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Please provide a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.'),

  validate,
];

// ─── Profile update validation rules ───────────────────────────────
const validateProfileUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 60 }).withMessage('Name must be 2–60 characters.'),

  body('age')
    .optional({ nullable: true, checkFalsy: true })
    .isInt({ min: 10, max: 120 }).withMessage('Age must be between 10 and 120.'),

  body('weight')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 20, max: 500 }).withMessage('Weight must be between 20 and 500 kg.'),

  body('height')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 50, max: 300 }).withMessage('Height must be between 50 and 300 cm.'),

  body('goal')
    .optional()
    .isIn(['lose_weight', 'gain_muscle', 'maintain', 'eat_healthy'])
    .withMessage('Goal must be one of: lose_weight, gain_muscle, maintain, eat_healthy.'),

  validate,
];

// ─── Food log validation rules ─────────────────────────────────────
const validateFoodLog = [
  body('foodId')
    .notEmpty().withMessage('foodId is required.')
    .isMongoId().withMessage('foodId must be a valid id.'),

  body('quantity')
    .notEmpty().withMessage('quantity is required.')
    .isFloat({ min: 0.01, max: 100 }).withMessage('Quantity must be between 0.01 and 100.'),

  body('mealType')
    .optional()
    .isIn(['breakfast', 'lunch', 'dinner', 'snacks'])
    .withMessage('mealType must be one of: breakfast, lunch, dinner, snacks.'),

  body('date')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('date must be in YYYY-MM-DD format.'),

  validate,
];

// ─── Food log update validation rules (PUT /api/food-logs/:id) ─────
// All fields are optional — but at least one editable field must be sent.
const validateFoodLogUpdate = [
  body('foodId')
    .optional()
    .isMongoId().withMessage('foodId must be a valid id.'),

  body('quantity')
    .optional()
    .isFloat({ min: 0.01, max: 100 }).withMessage('Quantity must be between 0.01 and 100.'),

  body('mealType')
    .optional()
    .isIn(['breakfast', 'lunch', 'dinner', 'snacks'])
    .withMessage('mealType must be one of: breakfast, lunch, dinner, snacks.'),

  // Reject a completely empty body — nothing to update
  (req, res, next) => {
    const editable = ['foodId', 'quantity', 'mealType'];
    const hasField = editable.some((f) => req.body[f] !== undefined);
    if (!hasField) {
      return res.status(400).json({
        success: false,
        message: 'Provide at least one field to update (foodId, quantity, mealType).',
      });
    }
    next();
  },

  validate,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validateFoodLog,
  validateFoodLogUpdate,
};
