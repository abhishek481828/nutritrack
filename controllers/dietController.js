const {
  calculateDailyCalories,
  calculateMacros,
  generateMealPlan,
  calculateNutritionTargets,
  calculateRemainingIntake,
  normalizeGoal,
  getDietRecommendation,
} = require('../utils/dietCalculator');
const FoodLog = require('../models/FoodLog');
const Food = require('../models/Food');
const { getDerivedNutrition } = require('../utils/foodLogNutrition');

const toDateKey = (value = new Date()) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDayRange = (date = new Date()) => {
  const dayKey = toDateKey(date);
  const start = dayKey;
  const end = dayKey;

  return { start, end };
};

const toNumber = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
};


const normalizeFoodName = (name = '') => {
  const cleaned = String(name || '').trim().toLowerCase();
  const typoMap = {
    chickne: 'chicken',
    brocolli: 'broccoli',
    tomatos: 'tomatoes',
  };
  const corrected = typoMap[cleaned] || cleaned;
  return corrected.replace(/\b\w/g, (ch) => ch.toUpperCase());
};

const buildRecommendationList = async (remaining) => {
  const recommendations = [];

  if (remaining.protein >= 20) {
    const highProteinFoods = await Food.find({ protein: { $gt: 0 } })
      .sort({ protein: -1, calories: -1 })
      .limit(5)
      .select('name calories protein carbs fat servingSize')
      .lean();

    recommendations.push({
      type: 'protein',
      label: 'High protein foods',
      reason: `You still need about ${remaining.protein}g protein today.`,
      items: highProteinFoods,
    });
  }

  if (remaining.calories >= 300) {
    const highCalorieFoods = await Food.find({ calories: { $gt: 0 } })
      .sort({ calories: -1, protein: -1 })
      .limit(5)
      .select('name calories protein carbs fat servingSize')
      .lean();

    recommendations.push({
      type: 'calories',
      label: 'High calorie foods',
      reason: `You still have about ${remaining.calories} kcal left for today.`,
      items: highCalorieFoods,
    });
  }

  if (recommendations.length === 0) {
    const fallbackFoods = await Food.find()
      .sort({ protein: -1, calories: -1 })
      .limit(5)
      .select('name calories protein carbs fat servingSize')
      .lean();

    recommendations.push({
      type: 'balanced',
      label: 'Balanced food ideas',
      reason: 'Your current intake is close to the target, so here are balanced options.',
      items: fallbackFoods,
    });
  }

  return recommendations.map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      id: item._id,
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat,
      servingSize: item.servingSize,
    })),
  }));
};

const normalizeFoodType = (type) => {
  const value = String(type || '').toLowerCase();
  if (value === 'veg' || value === 'vegetarian') return 'veg';
  if (value === 'non-veg' || value === 'non_veg' || value === 'nonvegetarian' || value === 'non-vegetarian') return 'non-veg';
  return '';
};

const toFoodDTO = (item = {}) => ({
  id: item._id || item.id,
  name: normalizeFoodName(item.name),
  calories: Number(item.calories) || 0,
  protein: Number(item.protein) || 0,
  carbs: Number(item.carbs) || 0,
  fat: Number(item.fat) || 0,
  servingSize: item.servingSize,
  type: item.type,
  category: item.category,
});

const normalizeMealBucket = (value = '') => {
  const text = String(value).toLowerCase();
  if (text.includes('breakfast')) return 'breakfast';
  if (text.includes('lunch')) return 'lunch';
  if (text.includes('dinner')) return 'dinner';
  return 'other';
};

const buildRecommendedMeals = async (type) => {
  const normalizedType = normalizeFoodType(type);
  const filter = normalizedType ? { type: normalizedType } : {};

  const foods = await Food.find(filter)
    .sort({ protein: -1, calories: -1, name: 1 })
    .limit(30)
    .select('name calories protein carbs fat servingSize type category')
    .lean();

  const grouped = foods.reduce((acc, food) => {
    const bucket = normalizeMealBucket(food.category);
    if (!acc[bucket]) acc[bucket] = [];
    acc[bucket].push(food);
    return acc;
  }, {});

  const buildMealSection = (mealName, fallbackStart = 0) => {
    const bucketFoods = grouped[mealName] || [];
    const fallbackFoods = foods.slice(fallbackStart, fallbackStart + 3);
    const items = (bucketFoods.length > 0 ? bucketFoods : fallbackFoods).slice(0, 3);

    const mealCalories = items.reduce((sum, item) => sum + (Number(item.calories) || 0), 0);
    return {
      meal: `${mealName.charAt(0).toUpperCase()}${mealName.slice(1)}`,
      calories: mealCalories,
      ideas: items.map((item) => `${item.name} (${item.servingSize || '1 serving'})`),
      foods: items.map(toFoodDTO),
    };
  };

  if (foods.length === 0) {
    return [
      { meal: 'Breakfast', calories: 0, ideas: [], foods: [] },
      { meal: 'Lunch', calories: 0, ideas: [], foods: [] },
      { meal: 'Dinner', calories: 0, ideas: [], foods: [] },
    ];
  }

  return [
    buildMealSection('breakfast', 0),
    buildMealSection('lunch', 3),
    buildMealSection('dinner', 6),
  ];
};

// @desc  Generate a diet plan based on logged-in user's profile
// @route GET /api/diet/plan
// @access Private
const getDietPlan = (req, res) => {
  const { weight, goal, name } = req.user;

  // Validate required profile fields
  if (!weight || !goal) {
    return res.status(400).json({
      success: false,
      message: 'Please complete your profile (weight and goal) before generating a plan.',
    });
  }

  const dailyCalories = calculateDailyCalories(weight, goal);
  const macros        = calculateMacros(dailyCalories, goal);
  const meals         = generateMealPlan(goal);

  // Meal calorie breakdown (breakfast 30%, lunch 35%, dinner 30%, snacks 5% flex)
  const mealCalorieTargets = {
    breakfast: Math.round(dailyCalories * 0.30),
    lunch:     Math.round(dailyCalories * 0.35),
    dinner:    Math.round(dailyCalories * 0.30),
    snacks:    Math.round(dailyCalories * 0.15),
  };

  res.status(200).json({
    success: true,
    data: {
      user: name,
      goal,
      dailyCalories,
      macros: {
        protein: `${macros.protein}g`,
        carbs:   `${macros.carbs}g`,
        fat:     `${macros.fat}g`,
      },
      mealCalorieTargets,
      plan: {
        breakfast: { ...meals.breakfast, targetCalories: mealCalorieTargets.breakfast },
        lunch:     { ...meals.lunch,     targetCalories: mealCalorieTargets.lunch     },
        dinner:    { ...meals.dinner,    targetCalories: mealCalorieTargets.dinner    },
        snacks:    { ...meals.snacks,    targetCalories: mealCalorieTargets.snacks    },
      },
      tips: getTips(goal),
    },
  });
};

// @desc  Generate a diet plan for custom input (no auth needed for quick preview)
// @route POST /api/diet/preview
// @access Public
const previewDietPlan = (req, res) => {
  const { weight, goal } = req.body;

  if (!weight || !goal) {
    return res.status(400).json({
      success: false,
      message: 'Please provide weight (kg) and goal.',
    });
  }

  const validGoals = ['lose_weight', 'gain_muscle', 'maintain', 'eat_healthy'];
  if (!validGoals.includes(goal)) {
    return res.status(400).json({
      success: false,
      message: `Goal must be one of: ${validGoals.join(', ')}`,
    });
  }

  const dailyCalories = calculateDailyCalories(weight, goal);
  const macros        = calculateMacros(dailyCalories, goal);
  const meals         = generateMealPlan(goal);

  res.status(200).json({
    success: true,
    data: {
      dailyCalories,
      macros: {
        protein: `${macros.protein}g`,
        carbs:   `${macros.carbs}g`,
        fat:     `${macros.fat}g`,
      },
      plan: meals,
      tips: getTips(goal),
    },
  });
};

// @desc  Personalized nutrition calculator with today's intake and recommendations
// @route GET|POST /api/diet/calculate
// @access Private
const calculateNutrition = async (req, res) => {
  try {
    const source = req.method === 'GET' ? req.user : req.body;

    const age = toNumber(source.age);
    const weight = toNumber(source.weight);
    const height = toNumber(source.height);
    const gender = String(source.gender || req.user.gender || 'male').toLowerCase();
    const activityLevel = String(source.activityLevel || req.user.activityLevel || 'moderate').toLowerCase();
    let goal = normalizeGoal(String(source.goal || req.user.goal || 'maintain').toLowerCase());
    if (goal === 'eat_healthy') {
      goal = 'maintenance';
    }

    if (!age || !weight || !height || !gender || !activityLevel || !goal) {
      return res.status(400).json({
        success: false,
        message: 'Please provide age, weight, height, gender, activity level, and goal.',
      });
    }

    if (!['male', 'female'].includes(gender)) {
      return res.status(400).json({ success: false, message: 'Gender must be male or female.' });
    }

    if (!['sedentary', 'moderate', 'active'].includes(activityLevel)) {
      return res.status(400).json({ success: false, message: 'Activity level must be sedentary, moderate, or active.' });
    }

    if (!['muscle_gain', 'weight_loss', 'maintenance'].includes(goal)) {
      return res.status(400).json({ success: false, message: 'Goal must be muscle_gain, weight_loss, or maintenance.' });
    }

    const targets = calculateNutritionTargets({ age, weight, height, gender, activityLevel, goal });
    const { start, end } = getDayRange();

    const todayLogs = await FoodLog.find({
      userId: req.user._id,
      date: { $gte: start, $lte: end },
    })
      .populate('foodId', 'calories protein carbs fat')
      .lean();

    const consumed = todayLogs.reduce((acc, log) => {
      const nutrition = getDerivedNutrition(log);
      acc.calories += nutrition.calories;
      acc.protein += nutrition.protein;
      acc.carbs += nutrition.carbs;
      acc.fats += nutrition.fat;
      return acc;
    }, { calories: 0, protein: 0, carbs: 0, fats: 0 });
    const remaining = calculateRemainingIntake(targets, consumed);
    const targetCalories = Number(targets.calorieGoal) || 0;
    const targetProtein = Number(targets.macros?.protein) || 0;
    const targetCarbs = Number(targets.macros?.carbs) || 0;
    const targetFat = Number(targets.macros?.fat) || 0;
    const recommendations = await buildRecommendationList(remaining);

    return res.status(200).json({
      success: true,
      data: {
        inputs: { age, weight, height, gender, activityLevel, goal },
        targets,
        consumed,
        remaining,
        targetCalories,
        consumedCalories: consumed.calories,
        targetProtein,
        consumedProtein: consumed.protein,
        targetCarbs,
        consumedCarbs: consumed.carbs,
        targetFat,
        consumedFat: consumed.fats,
        recommendations,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Smart diet recommendation using BMR-derived target calories
// @route GET /api/diet/recommend
// @access Private
const recommendDiet = async (req, res) => {
  try {
    const { age, height, weight, goal } = req.user;
    const type = req.query.type;

    if (!age || !height || !weight) {
      return res.status(400).json({
        success: false,
        message: 'Please complete your profile with age, height, and weight.',
      });
    }

    const recommendation = getDietRecommendation({ age, height, weight, goal });
    const recommendedMeals = await buildRecommendedMeals(type);
    const normalizedType = normalizeFoodType(type);
    const filter = normalizedType ? { type: normalizedType } : {};

    const dedupeMap = new Map();
    recommendedMeals
      .flatMap((meal) => meal.foods || [])
      .forEach((item) => {
        if (!item?.id) return;
        dedupeMap.set(String(item.id), item);
      });

    if (dedupeMap.size < 6) {
      const extraFoods = await Food.find(filter)
        .sort({ protein: -1, calories: -1, carbs: 1 })
        .limit(12)
        .select('name calories protein carbs fat servingSize type category')
        .lean();

      extraFoods.forEach((item) => {
        const dto = toFoodDTO(item);
        if (!dto.id) return;
        if (!dedupeMap.has(String(dto.id))) {
          dedupeMap.set(String(dto.id), dto);
        }
      });
    }

    const suggestedFoods = Array.from(dedupeMap.values()).slice(0, 8);

    return res.status(200).json({
      success: true,
      data: {
        targetCalories: recommendation.targetCalories,
        macros: {
          protein: Math.round(recommendation.targetCalories * 0.3 / 4),
          carbs: Math.round(recommendation.targetCalories * 0.4 / 4),
          fat: Math.round(recommendation.targetCalories * 0.3 / 9),
        },
        recommendedMeals,
        suggestedFoods,
        dietType: normalizeFoodType(type) || 'any',
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Goal-specific tips ───────────────────────────────────────────────────────
const getTips = (goal) => {
  const allTips = {
    lose_weight: [
      'Drink at least 2.5L of water daily.',
      'Eat slowly — it takes 20 min to feel full.',
      'Avoid sugary drinks and processed snacks.',
      'Walk for at least 30 minutes a day.',
    ],
    gain_muscle: [
      'Eat within 30 minutes after your workout.',
      'Prioritize sleep — muscle grows during rest.',
      'Aim for 1.6–2.2g of protein per kg of bodyweight.',
      'Track your progressive overload in the gym.',
    ],
    maintain: [
      'Keep meal times consistent every day.',
      'Eat a variety of colorful vegetables.',
      'Limit alcohol and late-night snacking.',
      'Stay active with moderate exercise 3–4x/week.',
    ],
    eat_healthy: [
      'Choose whole foods over processed ones.',
      'Eat the rainbow — variety in produce = variety in nutrients.',
      'Limit added sugar to under 25g/day.',
      'Include healthy fats (avocado, olive oil, nuts) daily.',
    ],
  };

  return allTips[goal] || allTips.maintain;
};

module.exports = { getDietPlan, previewDietPlan, calculateNutrition, recommendDiet };
