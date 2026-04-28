const GOAL_ADJUSTMENT = {
  lose_weight: 0.8,
  weight_loss: 0.8,
  gain_muscle: 1.12,
  muscle_gain: 1.12,
  maintain: 1,
  maintenance: 1,
  eat_healthy: 0.95,
};

const MEAL_SPLITS = [
  { name: 'Breakfast', ratio: 0.25, ideas: ['Oats with banana and milk', 'Egg omelette with toast'] },
  { name: 'Lunch', ratio: 0.35, ideas: ['Grilled chicken with rice and salad', 'Dal, roti and mixed vegetables'] },
  { name: 'Dinner', ratio: 0.3, ideas: ['Fish with vegetables', 'Paneer stir-fry with quinoa'] },
  { name: 'Snacks', ratio: 0.1, ideas: ['Greek yogurt with nuts', 'Fruit and peanut butter'] },
];

const roundToNearestTen = (value) => Math.round(value / 10) * 10;

const normalizeGoal = (goal = 'maintain') => {
  const value = String(goal).toLowerCase();
  if (value === 'loss') return 'lose_weight';
  if (value === 'gain') return 'gain_muscle';
  return value;
};

const calculateBMR = ({ age, height, weight }) => {
  const a = Number(age);
  const h = Number(height);
  const w = Number(weight);

  if (!Number.isFinite(a) || !Number.isFinite(h) || !Number.isFinite(w) || a <= 0 || h <= 0 || w <= 0) {
    throw new Error('Valid age, height, and weight are required.');
  }

  // Simplified Mifflin-St Jeor style estimate without gender input.
  return (10 * w) + (6.25 * h) - (5 * a);
};

const calculateTargetCalories = ({ age, height, weight, goal }) => {
  const bmr = calculateBMR({ age, height, weight });

  // Assume lightly active baseline for a practical default.
  const maintenanceCalories = bmr * 1.35;

  const normalizedGoal = normalizeGoal(goal);
  const multiplier = GOAL_ADJUSTMENT[normalizedGoal] || GOAL_ADJUSTMENT.maintain;
  const targetCalories = roundToNearestTen(maintenanceCalories * multiplier);

  return {
    bmr: Math.round(bmr),
    maintenanceCalories: Math.round(maintenanceCalories),
    targetCalories,
  };
};

const buildSuggestedMeals = (targetCalories) => {
  return MEAL_SPLITS.map((meal) => ({
    meal: meal.name,
    calories: Math.round(targetCalories * meal.ratio),
    ideas: meal.ideas,
  }));
};

const getDietRecommendation = ({ age, height, weight, goal }) => {
  const { targetCalories } = calculateTargetCalories({ age, height, weight, goal });

  return {
    targetCalories,
    suggestedMeals: buildSuggestedMeals(targetCalories),
  };
};

module.exports = {
  calculateBMR,
  calculateTargetCalories,
  buildSuggestedMeals,
  getDietRecommendation,
};
