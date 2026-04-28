/**
 * Diet Calculator Utilities
 * Simple calorie and meal plan generation based on user profile.
 */

// ─── Calorie Targets by Goal ──────────────────────────────────────────────────
const CALORIE_BASE = {
  lose_weight:  1600,
  gain_muscle:  2800,
  maintain:     2200,
  eat_healthy:  2000,
};

// Adjust base calories by weight (±10 kcal per kg above/below 70 kg reference)
const calculateDailyCalories = (weight, goal) => {
  const base      = CALORIE_BASE[goal] || CALORIE_BASE.maintain;
  const adjustment = (weight - 70) * 10;
  return Math.round(base + adjustment);
};

// ─── Macro Split by Goal ──────────────────────────────────────────────────────
// Returns grams of protein, carbs, fat for a given calorie target
const calculateMacros = (calories, goal) => {
  // Protein: 4 kcal/g | Carbs: 4 kcal/g | Fat: 9 kcal/g
  const splits = {
    lose_weight: { protein: 0.35, carbs: 0.35, fat: 0.30 },
    gain_muscle: { protein: 0.30, carbs: 0.45, fat: 0.25 },
    maintain:    { protein: 0.25, carbs: 0.50, fat: 0.25 },
    eat_healthy: { protein: 0.25, carbs: 0.45, fat: 0.30 },
  };

  const split = splits[goal] || splits.maintain;

  return {
    protein: Math.round((calories * split.protein) / 4),
    carbs:   Math.round((calories * split.carbs)   / 4),
    fat:     Math.round((calories * split.fat)      / 9),
  };
};

// ─── Meal Templates by Goal ───────────────────────────────────────────────────
const MEAL_PLANS = {
  lose_weight: {
    breakfast: {
      name: 'Light Protein Breakfast',
      items: ['2 boiled eggs', '1 slice whole grain toast', 'Black coffee or green tea'],
      calories: 300,
    },
    lunch: {
      name: 'Grilled Chicken Salad',
      items: ['150g grilled chicken breast', 'Mixed greens', 'Cucumber & tomato', 'Olive oil dressing'],
      calories: 450,
    },
    dinner: {
      name: 'Steamed Fish & Veggies',
      items: ['150g steamed fish', '1 cup steamed broccoli', '½ cup brown rice'],
      calories: 500,
    },
    snacks: {
      name: 'Light Snacks',
      items: ['1 apple', 'A handful of almonds (15g)'],
      calories: 200,
    },
  },

  gain_muscle: {
    breakfast: {
      name: 'High-Protein Breakfast',
      items: ['4 scrambled eggs', '2 slices whole grain bread', '1 banana', '1 glass whole milk'],
      calories: 700,
    },
    lunch: {
      name: 'Chicken Rice Bowl',
      items: ['200g grilled chicken', '1.5 cups white rice', 'Stir-fried vegetables', '1 tbsp olive oil'],
      calories: 850,
    },
    dinner: {
      name: 'Beef & Sweet Potato',
      items: ['200g lean beef', '1 large sweet potato', 'Steamed spinach'],
      calories: 750,
    },
    snacks: {
      name: 'Muscle Snacks',
      items: ['Protein shake (30g whey)', '1 banana', 'Peanut butter on toast'],
      calories: 450,
    },
  },

  maintain: {
    breakfast: {
      name: 'Balanced Breakfast',
      items: ['Oatmeal with berries', '2 boiled eggs', '1 glass orange juice'],
      calories: 500,
    },
    lunch: {
      name: 'Turkey Wrap',
      items: ['Whole wheat wrap', '100g turkey slices', 'Lettuce, tomato, avocado', 'Greek yogurt dip'],
      calories: 600,
    },
    dinner: {
      name: 'Pasta with Chicken',
      items: ['1.5 cups whole wheat pasta', '150g grilled chicken', 'Tomato marinara sauce', 'Side salad'],
      calories: 650,
    },
    snacks: {
      name: 'Balanced Snacks',
      items: ['Greek yogurt (150g)', '1 orange'],
      calories: 200,
    },
  },

  eat_healthy: {
    breakfast: {
      name: 'Wholesome Breakfast',
      items: ['Overnight oats with chia seeds', 'Mixed berries', '1 cup herbal tea'],
      calories: 400,
    },
    lunch: {
      name: 'Quinoa Buddha Bowl',
      items: ['¾ cup quinoa', 'Roasted chickpeas', 'Avocado', 'Spinach & kale', 'Lemon tahini dressing'],
      calories: 550,
    },
    dinner: {
      name: 'Baked Salmon & Veggies',
      items: ['150g baked salmon', 'Roasted sweet potato', 'Steamed asparagus'],
      calories: 600,
    },
    snacks: {
      name: 'Clean Snacks',
      items: ['Handful of walnuts', '1 pear', 'Hummus with carrot sticks'],
      calories: 300,
    },
  },
};

const generateMealPlan = (goal) => {
  return MEAL_PLANS[goal] || MEAL_PLANS.maintain;
};

// ─── BMI Calculator ───────────────────────────────────────────────────────────
/**
 * Calculate BMI and return category, color badge, and a health suggestion.
 * @param {number} weight - kg
 * @param {number} height - cm
 */
const calculateBMI = (weight, height) => {
  if (!weight || !height || height <= 0) return null;

  const heightM = height / 100;                          // cm → m
  const bmi     = weight / (heightM * heightM);
  const value   = Math.round(bmi * 10) / 10;            // 1 decimal place

  let category, color, suggestion;

  if (value < 18.5) {
    category   = 'Underweight';
    color      = 'blue';
    suggestion = 'Your BMI suggests you are underweight. Focus on calorie-dense, nutrient-rich foods like nuts, dairy, lean meats, and whole grains. Consider increasing your daily calorie intake by 300–500 kcal.';
  } else if (value < 25) {
    category   = 'Normal';
    color      = 'green';
    suggestion = 'Great job! Your BMI is within the healthy range. Maintain your balanced diet and regular physical activity to stay on track.';
  } else if (value < 30) {
    category   = 'Overweight';
    color      = 'yellow';
    suggestion = 'Your BMI indicates you are overweight. Consider reducing daily calorie intake by 300–500 kcal, increasing vegetable consumption, and adding 30 minutes of moderate exercise daily.';
  } else {
    category   = 'Obese';
    color      = 'red';
    suggestion = 'Your BMI indicates obesity. It is strongly recommended to consult a healthcare provider. Focus on a sustained caloric deficit, reduce processed foods, and engage in low-impact exercise like walking or swimming.';
  }

  return { value, category, color, suggestion };
};

// ─── Personalized nutrition calculator ───────────────────────────────────────
const ACTIVITY_FACTORS = {
  sedentary: 1.2,
  moderate: 1.55,
  active: 1.725,
};

const GOAL_ADJUSTMENTS = {
  muscle_gain: 300,
  weight_loss: -400,
  maintenance: 0,
};

const normalizeGoal = (goal) => {
  if (goal === 'gain_muscle') return 'muscle_gain';
  if (goal === 'lose_weight') return 'weight_loss';
  return goal || 'maintenance';
};

const calculateBMR = ({ age, weight, height, gender }) => {
  if (!age || !weight || !height) return 0;

  const base = 10 * Number(weight) + 6.25 * Number(height) - 5 * Number(age);
  return Math.round(base + (gender === 'male' ? 5 : -161));
};

const getActivityFactor = (activityLevel) => ACTIVITY_FACTORS[activityLevel] || ACTIVITY_FACTORS.sedentary;

const calculateNutritionTargets = ({ age, weight, height, gender, activityLevel, goal }) => {
  const normalizedGoal = normalizeGoal(goal);
  const bmr = calculateBMR({ age, weight, height, gender });
  const activityFactor = getActivityFactor(activityLevel);
  const caloriesBeforeGoal = Math.round(bmr * activityFactor);
  const goalAdjustment = GOAL_ADJUSTMENTS[normalizedGoal] ?? 0;
  const calorieGoal = Math.max(caloriesBeforeGoal + goalAdjustment, 0);

  const protein = Math.round(Number(weight || 0) * 2);
  const fat = Math.round(Number(weight || 0) * 0.8);
  const remainingCaloriesAfterProteinFat = Math.max(calorieGoal - (protein * 4) - (fat * 9), 0);
  const carbs = Math.round(remainingCaloriesAfterProteinFat / 4);

  return {
    bmr,
    activityFactor,
    caloriesBeforeGoal,
    goalAdjustment,
    calorieGoal,
    macros: { protein, carbs, fat },
  };
};

const calculateRemainingIntake = (targets, consumed = {}) => ({
  calories: Math.max((targets.calorieGoal || 0) - (consumed.calories || 0), 0),
  protein: Math.max((targets.macros?.protein || 0) - (consumed.protein || 0), 0),
  carbs: Math.max((targets.macros?.carbs || 0) - (consumed.carbs || 0), 0),
  fat: Math.max((targets.macros?.fat || 0) - (consumed.fat || consumed.fats || 0), 0),
});

module.exports = {
  calculateDailyCalories,
  calculateMacros,
  generateMealPlan,
  calculateBMI,
  calculateBMR,
  calculateNutritionTargets,
  calculateRemainingIntake,
  getActivityFactor,
};
