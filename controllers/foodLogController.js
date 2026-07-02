const FoodLog = require('../models/FoodLog');
const Food = require('../models/Food');
const { toFoodLogEntryDTO, sumEntryTotals } = require('../utils/foodLogNutrition');

const formatDate = (dateValue) => {
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isValidDateKey = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const candidate = new Date(year, month - 1, day);
  return formatDate(candidate) === value;
};

const formatTime = (dateValue) => {
  const date = new Date(dateValue);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const FOOD_POPULATE = 'name calories protein carbs fat category';
const MEAL_TYPES = new Set(['breakfast', 'lunch', 'dinner', 'snacks']);

const normalizeMealType = (value) => {
  const normalized = String(value || '').trim().toLowerCase();
  if (!normalized) return '';
  if (normalized === 'snacks' || normalized === 'snack') return 'snacks';
  return MEAL_TYPES.has(normalized) ? normalized : '';
};

const inferMealTypeByTime = (dateValue = new Date()) => {
  const hour = new Date(dateValue).getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 21) return 'dinner';
  return 'snacks';
};

/**
 * Add a food log entry for the current user
 * @route POST /api/food-logs
 * @access Private
 * @note Input is pre-validated by validateFoodLog middleware
 */
const addFoodLog = async (req, res) => {
  try {
    const { foodId } = req.body;
    const quantity = Number(req.body.quantity) || 1;
    const now = new Date();
    const requestedDate = req.body.date;

    const food = await Food.findById(foodId).select('_id');
    if (!food) {
      return res.status(404).json({ success: false, message: 'Food not found in library.' });
    }

    if (requestedDate && !isValidDateKey(requestedDate)) {
      return res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    const requestedMealType = normalizeMealType(req.body.mealType);
    const fallbackMealType = normalizeMealType(food.category) || inferMealTypeByTime(now);
    const entryDate = requestedDate || formatDate(now);

    const entry = await FoodLog.create({
      userId:   req.user._id,
      foodId,
      quantity,
      mealType: requestedMealType || fallbackMealType,
      date: entryDate,
      time: formatTime(now),
    });

    const populated = await FoodLog.findById(entry._id).populate('foodId', FOOD_POPULATE);

    res.status(201).json({ success: true, data: toFoodLogEntryDTO(populated) });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc  Get food logs for a specific date (defaults to today)
// @route GET /api/food-logs?date=YYYY-MM-DD
// @access Private
const getDailyLogs = async (req, res) => {
  try {
    const dateInput = req.query.date || formatDate(new Date());
    if (!isValidDateKey(dateInput)) {
      return res.status(400).json({ success: false, message: 'Invalid date format. Use YYYY-MM-DD.' });
    }

    // Filter strictly by user + selected day
    const filter = { userId: req.user._id, date: dateInput };

    const logs = await FoodLog.find(filter)
      .populate('foodId', FOOD_POPULATE)
      .sort({ time: 1, createdAt: 1 })
      .lean();

    const entries = logs.map(toFoodLogEntryDTO);
    const totals = sumEntryTotals(entries);

    const legacyTotals = {
      calories: totals.totalCalories,
      protein: totals.totalProtein,
      carbs: totals.totalCarbs,
      fats: totals.totalFat,
    };

    res.status(200).json({
      success: true,
      date: dateInput,
      count: entries.length,
      entries,
      totals,
      // Legacy response shape kept to avoid breaking existing pages.
      legacyTotals,
      data: entries,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get paginated food logs for the current user
// @route GET /api/food-logs?page=1&limit=10
// @access Private
const getPaginatedFoodLogs = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
    const skip = (page - 1) * limit;

    const [logs, totalCount] = await Promise.all([
      FoodLog.find({ userId: req.user._id })
        .populate('foodId', FOOD_POPULATE)
        .sort({ date: -1, time: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      FoodLog.countDocuments({ userId: req.user._id }),
    ]);

    const totalPages = Math.ceil(totalCount / limit) || 1;

    return res.status(200).json({
      logs: logs.map(toFoodLogEntryDTO),
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Delete a food log entry
// @route DELETE /api/food-logs/:id
// @access Private
const deleteFoodLog = async (req, res) => {
  try {
    const log = await FoodLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({ success: false, message: 'Log entry not found.' });
    }

    // Authorization: only the owner may delete their own entry
    if (log.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this entry.' });
    }

    await log.deleteOne();
    return res.status(200).json({ success: true, message: 'Log entry deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Update a food log entry
// @route PUT /api/food-logs/:id
// @access Private
// @note  Input is pre-validated by validateFoodLogUpdate middleware
const updateFoodLog = async (req, res) => {
  try {
    const log = await FoodLog.findById(req.params.id);

    if (!log) {
      return res.status(404).json({ success: false, message: 'Log entry not found.' });
    }

    // Authorization: only the owner may edit their own entry
    if (log.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this entry.' });
    }

    // Build update object — only include fields that were actually sent
    const { foodId } = req.body;
    const quantity = req.body.quantity;
    const mealType = req.body.mealType;
    const updates = {};
    if (foodId !== undefined) {
      const exists = await Food.findById(foodId).select('_id');
      if (!exists) {
        return res.status(404).json({ success: false, message: 'Food not found in library.' });
      }
      updates.foodId = foodId;
    }
    if (quantity !== undefined) updates.quantity = Number(quantity);
    if (mealType !== undefined) updates.mealType = normalizeMealType(mealType) || 'lunch';

    const updated = await FoodLog.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }  // return updated doc & run schema validators
    ).populate('foodId', FOOD_POPULATE);

    return res.status(200).json({ success: true, data: toFoodLogEntryDTO(updated) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { addFoodLog, getDailyLogs, getPaginatedFoodLogs, updateFoodLog, deleteFoodLog };
