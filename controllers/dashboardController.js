const FoodLog = require('../models/FoodLog');
const { calculateDailyCalories, calculateMacros, calculateBMI } = require('../utils/dietCalculator');
const { getDerivedNutrition } = require('../utils/foodLogNutrition');

const FOOD_POPULATE = 'name calories protein carbs fat category';

const calculatePercentage = (consumed, target) =>
  target > 0 ? Math.min(Math.round((consumed / target) * 100), 100) : 0;

const toDateKey = (value = new Date()) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildDateSpine = () => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    days.push(toDateKey(date));
  }
  return days;
};

const emptyTotals = () => ({ calories: 0, protein: 0, carbs: 0, fats: 0, meals: 0 });

const addNutrition = (bucket, nutrition) => {
  bucket.calories += nutrition.calories;
  bucket.protein += nutrition.protein;
  bucket.carbs += nutrition.carbs;
  bucket.fats += nutrition.fat;
  bucket.meals += 1;
};

const getLogsInRange = async (userId, startDate, endDate) => {
  return FoodLog.find({
    userId,
    date: { $gte: startDate, $lte: endDate },
  })
    .populate('foodId', FOOD_POPULATE)
    .sort({ date: 1, time: 1, createdAt: 1 })
    .lean();
};

const sumMacros = (logs) => {
  return logs.reduce((acc, log) => {
    const nutrition = getDerivedNutrition(log);
    acc.calories += nutrition.calories;
    acc.protein += nutrition.protein;
    acc.carbs += nutrition.carbs;
    acc.fats += nutrition.fat;
    return acc;
  }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
};

const getDashboard = async (req, res) => {
  try {
    const { _id, weight, height, goal } = req.user;

    const calorieGoal = calculateDailyCalories(weight || 70, goal || 'maintain');
    const macroGoal = calculateMacros(calorieGoal, goal || 'maintain');
    const bmi = calculateBMI(weight, height);

    const dateSpine = buildDateSpine();
    const weekStart = dateSpine[0];
    const todayStr = dateSpine[dateSpine.length - 1];

    const logs = await getLogsInRange(_id, weekStart, todayStr);

    const byDate = Object.fromEntries(dateSpine.map((d) => [d, emptyTotals()]));
    logs.forEach((log) => {
      if (!byDate[log.date]) return;
      addNutrition(byDate[log.date], getDerivedNutrition(log));
    });

    const weeklyTrend = dateSpine.map((dateStr) => {
      const row = byDate[dateStr] || emptyTotals();
      const d = new Date(`${dateStr}T12:00:00Z`);
      return {
        date: dateStr,
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        calories: row.calories,
        protein: row.protein,
        carbs: row.carbs,
        fats: row.fats,
        meals: row.meals,
      };
    });

    const consumed = {
      calories: byDate[todayStr]?.calories || 0,
      protein: byDate[todayStr]?.protein || 0,
      carbs: byDate[todayStr]?.carbs || 0,
      fats: byDate[todayStr]?.fats || 0,
    };

    const todayLogs = logs.filter((log) => log.date === todayStr);

    return res.status(200).json({
      success: true,
      data: {
        date: todayStr,
        goal,
        bmi,
        summary: {
          calories: {
            consumed: consumed.calories,
            target: calorieGoal,
            remaining: Math.max(calorieGoal - consumed.calories, 0),
            percentComplete: calculatePercentage(consumed.calories, calorieGoal),
          },
          protein: {
            consumed: consumed.protein,
            target: macroGoal.protein,
            percentComplete: calculatePercentage(consumed.protein, macroGoal.protein),
          },
          carbs: {
            consumed: consumed.carbs,
            target: macroGoal.carbs,
            percentComplete: calculatePercentage(consumed.carbs, macroGoal.carbs),
          },
          fats: {
            consumed: consumed.fats,
            target: macroGoal.fat,
            percentComplete: calculatePercentage(consumed.fats, macroGoal.fat),
          },
        },
        meals: {
          count: todayLogs.length,
          entries: todayLogs.map((log) => {
            const nutrition = getDerivedNutrition(log);
            return {
              id: log._id,
              food: log.foodId?.name || 'Unknown Food',
              calories: nutrition.calories,
              protein: nutrition.protein,
              carbs: nutrition.carbs,
              fats: nutrition.fat,
              time: log.time,
            };
          }),
        },
        weekly: {
          calorieGoal,
          trend: weeklyTrend,
        },
        analytics: {
          caloriesOverTime: weeklyTrend.map((item) => ({ day: item.day, date: item.date, calories: item.calories })),
          macroDistribution: [
            { name: 'Protein', value: consumed.protein * 4, color: '#22c55e' },
            { name: 'Carbs', value: consumed.carbs * 4, color: '#3b82f6' },
            { name: 'Fats', value: consumed.fats * 9, color: '#f97316' },
          ],
          macroTotals: {
            protein: consumed.protein,
            carbs: consumed.carbs,
            fats: consumed.fats,
          },
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getTodaySummary = async (req, res) => {
  try {
    const { _id, weight, height, goal } = req.user;
    const today = toDateKey(new Date());
    const logs = await getLogsInRange(_id, today, today);
    const consumed = sumMacros(logs);
    const calorieGoal = calculateDailyCalories(weight || 70, goal || 'maintain');
    const macroGoal = calculateMacros(calorieGoal, goal || 'maintain');
    const bmi = calculateBMI(weight, height);

    return res.status(200).json({
      success: true,
      data: {
        date: today,
        goal,
        bmi,
        summary: {
          calories: { consumed: consumed.calories, target: calorieGoal, remaining: Math.max(calorieGoal - consumed.calories, 0), percentComplete: calculatePercentage(consumed.calories, calorieGoal) },
          protein: { consumed: consumed.protein, target: macroGoal.protein, percentComplete: calculatePercentage(consumed.protein, macroGoal.protein) },
          carbs: { consumed: consumed.carbs, target: macroGoal.carbs, percentComplete: calculatePercentage(consumed.carbs, macroGoal.carbs) },
          fats: { consumed: consumed.fats, target: macroGoal.fat, percentComplete: calculatePercentage(consumed.fats, macroGoal.fat) },
        },
        meals: {
          count: logs.length,
          entries: logs.map((l) => ({ id: l._id, food: l.foodId?.name || 'Unknown Food', calories: getDerivedNutrition(l).calories, time: l.time })),
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getWeeklyTrend = async (req, res) => {
  try {
    const { _id, weight, goal } = req.user;
    const calorieGoal = calculateDailyCalories(weight || 70, goal || 'maintain');
    const dateSpine = buildDateSpine();
    const logs = await getLogsInRange(_id, dateSpine[0], dateSpine[6]);

    const byDate = Object.fromEntries(dateSpine.map((d) => [d, emptyTotals()]));
    logs.forEach((log) => {
      if (!byDate[log.date]) return;
      addNutrition(byDate[log.date], getDerivedNutrition(log));
    });

    const trend = dateSpine.map((dateStr) => {
      const row = byDate[dateStr] || emptyTotals();
      const d = new Date(`${dateStr}T12:00:00Z`);
      return {
        date: dateStr,
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        calories: row.calories,
        protein: row.protein,
        carbs: row.carbs,
        fats: row.fats,
      };
    });

    return res.status(200).json({ success: true, data: { calorieGoal, trend } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getMacroBreakdown = async (req, res) => {
  try {
    const { _id, weight, goal } = req.user;
    const today = toDateKey(new Date());
    const logs = await getLogsInRange(_id, today, today);
    const totals = sumMacros(logs);
    const totalKcal = (totals.protein * 4) + (totals.carbs * 4) + (totals.fats * 9);
    const calorieGoal = calculateDailyCalories(weight || 70, goal || 'maintain');

    return res.status(200).json({
      success: true,
      data: {
        date: today,
        totalCaloriesConsumed: totals.calories,
        calorieGoal,
        breakdown: [
          { macro: 'Protein', grams: totals.protein, calories: totals.protein * 4, percentage: totalKcal > 0 ? Math.round(((totals.protein * 4) / totalKcal) * 100) : 0 },
          { macro: 'Carbs', grams: totals.carbs, calories: totals.carbs * 4, percentage: totalKcal > 0 ? Math.round(((totals.carbs * 4) / totalKcal) * 100) : 0 },
          { macro: 'Fats', grams: totals.fats, calories: totals.fats * 9, percentage: totalKcal > 0 ? Math.round(((totals.fats * 9) / totalKcal) * 100) : 0 },
        ],
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboard, getTodaySummary, getWeeklyTrend, getMacroBreakdown };
