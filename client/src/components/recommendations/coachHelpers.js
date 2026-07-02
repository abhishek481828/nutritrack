export const toNumber = (value) => Number(value) || 0;

export const initialProgress = {
  calories: { consumed: 0, target: 0, remaining: 0 },
  protein: { consumed: 0, target: 0, remaining: 0 },
  carbs: { consumed: 0, target: 0, remaining: 0 },
  fat: { consumed: 0, target: 0, remaining: 0 },
};

export const initialMealPlan = [
  { meal: 'Breakfast', calories: 0, ideas: [] },
  { meal: 'Lunch', calories: 0, ideas: [] },
  { meal: 'Dinner', calories: 0, ideas: [] },
];

export const completionRatio = (consumed, target) => {
  const safeConsumed = toNumber(consumed);
  const safeTarget = toNumber(target);
  if (safeTarget <= 0) return 0;
  return Math.min(safeConsumed / safeTarget, 1);
};

export const balanceRatio = (consumed, target) => {
  const safeConsumed = toNumber(consumed);
  const safeTarget = toNumber(target);
  if (safeTarget <= 0) return 0;
  const ratio = safeConsumed / safeTarget;
  return Math.max(0, 1 - Math.abs(1 - ratio));
};

export const normalizeFoodName = (value = '') => {
  const normalized = String(value || '').trim().toLowerCase();
  const typoMap = {
    chickne: 'chicken',
    brocolli: 'broccoli',
    tomatos: 'tomatoes',
  };
  const corrected = typoMap[normalized] || normalized;
  return corrected.replace(/\b\w/g, (char) => char.toUpperCase());
};

export const foodKey = (item = {}) => String(item.id || item._id || item.name || '').toLowerCase();

export const toFood = (item = {}) => ({
  id: item.id || item._id || item.name,
  name: normalizeFoodName(item.name),
  calories: toNumber(item.calories),
  protein: toNumber(item.protein),
  carbs: toNumber(item.carbs),
  fat: toNumber(item.fat ?? item.fats),
  servingSize: item.servingSize || '1 serving',
});

export const dedupeFoods = (foods = []) => {
  const map = new Map();
  foods.forEach((item) => {
    const food = toFood(item);
    const key = foodKey(food);
    if (!key) return;
    if (!map.has(key)) {
      map.set(key, food);
    }
  });
  return Array.from(map.values());
};

export const rotateArray = (items = [], offset = 0) => {
  if (!Array.isArray(items) || items.length === 0) return [];
  const length = items.length;
  const safeOffset = ((offset % length) + length) % length;
  return [...items.slice(safeOffset), ...items.slice(0, safeOffset)];
};

export const cloneMealFood = (food, suffix) => ({
  ...food,
  id: `${food.id || food.name || 'food'}-${suffix}`,
});

export const topUpMealCalories = (items = [], targetCalories = 0, preferredFoods = [], seed = 0) => {
  const mealItems = Array.isArray(items) ? [...items] : [];
  const target = toNumber(targetCalories);
  const choices = Array.isArray(preferredFoods) ? preferredFoods.filter((food) => toNumber(food.calories) > 0) : [];

  if (target <= 0 || choices.length === 0) {
    return mealItems;
  }

  let totalCalories = mealItems.reduce((sum, item) => sum + toNumber(item.calories), 0);
  let index = Math.max(0, seed);
  let guard = 0;

  // Top up until we reach at least 92% of meal target calories.
  while (totalCalories < target * 0.92 && guard < 12) {
    const next = choices[index % choices.length];
    index += 1;
    guard += 1;
    if (!next) continue;

    const extraServing = cloneMealFood(next, `topup-${seed}-${guard}`);
    mealItems.push(extraServing);
    totalCalories += toNumber(next.calories);
  }

  return mealItems;
};

export const normalizeMeals = (meals = []) => {
  const map = new Map();
  meals.forEach((meal) => {
    const key = String(meal.meal || meal.name || '').toLowerCase();
    if (key.includes('breakfast')) map.set('breakfast', meal);
    if (key.includes('lunch')) map.set('lunch', meal);
    if (key.includes('dinner')) map.set('dinner', meal);
  });

  return ['breakfast', 'lunch', 'dinner'].map((name) => {
    const meal = map.get(name);
    return {
      meal: name.charAt(0).toUpperCase() + name.slice(1),
      calories: toNumber(meal?.calories),
      ideas: Array.isArray(meal?.ideas) ? meal.ideas : [],
      foods: dedupeFoods(Array.isArray(meal?.foods) ? meal.foods : []),
    };
  });
};

export const calculateScore = (progress) => {
  const calorieComponent = completionRatio(progress.calories.consumed, progress.calories.target) * 40;
  const proteinComponent = completionRatio(progress.protein.consumed, progress.protein.target) * 30;
  const carbsComponent = balanceRatio(progress.carbs.consumed, progress.carbs.target) * 15;
  const fatComponent = balanceRatio(progress.fat.consumed, progress.fat.target) * 15;

  return Math.round(calorieComponent + proteinComponent + carbsComponent + fatComponent);
};

export const buildInsightMessage = (progress) => {
  if (progress.calories.target <= 0) {
    return {
      message: 'Complete your profile to unlock coaching insights',
      subMessage: 'Add age, height, weight and goal to get personalized targets.',
    };
  }

  const notes = [];
  if (progress.protein.remaining > 20) notes.push('Protein intake is low');
  if (progress.carbs.consumed > progress.carbs.target * 1.1) notes.push('Carb intake is high');
  if (progress.fat.remaining > 10) notes.push('Healthy fat target is not met');

  const calorieMessage = progress.calories.remaining > 0
    ? `You are ${Math.round(progress.calories.remaining)} calories short today`
    : 'You have achieved your calorie target today';

  return {
    message: calorieMessage,
    subMessage: notes.length > 0 ? notes.join(' • ') : 'Macro balance looks stable. Keep it up.',
  };
};

export const buildSuggestionCards = (recommendations = [], progress = initialProgress) => {
  const recommendationFoods = dedupeFoods(recommendations.flatMap((item) => item.items || []));
  const highProteinFoods = recommendationFoods.slice().sort((a, b) => b.protein - a.protein || a.carbs - b.carbs);
  const highCalorieFoods = recommendationFoods.slice().sort((a, b) => b.calories - a.calories || b.protein - a.protein);
  const lowerCarbFoods = recommendationFoods.slice().sort((a, b) => a.carbs - b.carbs || b.protein - a.protein);

  const cards = [];

  if (progress.protein.consumed < progress.protein.target) {
    cards.push({
      key: 'protein',
      title: 'Increase Protein',
      subtitle: `${Math.round(progress.protein.remaining)}g protein remaining`,
      items: highProteinFoods.slice(0, 4),
    });
  }

  if (progress.calories.remaining > 300) {
    cards.push({
      key: 'calories',
      title: 'Add More Calories',
      subtitle: `${Math.round(progress.calories.remaining)} kcal remaining`,
      items: highCalorieFoods.slice(0, 4),
    });
  }

  if (progress.carbs.target > 0 && progress.carbs.consumed > progress.carbs.target * 1.05) {
    cards.push({
      key: 'carbs',
      title: 'Reduce Carbs',
      subtitle: 'Pick lower-carb options for your next meal',
      items: lowerCarbFoods.slice(0, 4),
    });
  }

  if (cards.length === 0) {
    cards.push({
      key: 'balanced',
      title: 'Balanced Meal',
      subtitle: 'You are on track. Here are balanced choices.',
      items: recommendationFoods.slice(0, 4),
    });
  }

  return cards;
};

export const buildMealPlan = (recommendationPayload = {}, progress = initialProgress, options = {}) => {
  const { variant = 0 } = options;
  const normalizedMeals = normalizeMeals(recommendationPayload.recommendedMeals || []);
  const suggestedFoods = dedupeFoods(recommendationPayload.suggestedFoods || []);

  const preferredOrder = progress.protein.remaining > progress.calories.remaining
    ? suggestedFoods.slice().sort((a, b) => b.protein - a.protein)
    : suggestedFoods.slice().sort((a, b) => b.calories - a.calories);

  const rotatedPreferredOrder = rotateArray(preferredOrder, Number(variant) || 0);

  const used = new Set();
  const totalCaloriesToPlan = toNumber(progress.calories.remaining) > 0
    ? toNumber(progress.calories.remaining)
    : toNumber(progress.calories.target);

  const breakfastTarget = Math.round(totalCaloriesToPlan * 0.3);
  const lunchTarget = Math.round(totalCaloriesToPlan * 0.35);
  const dinnerTarget = Math.max(totalCaloriesToPlan - breakfastTarget - lunchTarget, 0);

  const mealTargets = {
    Breakfast: breakfastTarget,
    Lunch: lunchTarget,
    Dinner: dinnerTarget,
  };

  return normalizedMeals.map((meal, mealIndex) => {
    let items = dedupeFoods(meal.foods || []).filter((food) => {
      const key = foodKey(food);
      if (!key || used.has(key)) return false;
      used.add(key);
      return true;
    });

    items = rotateArray(items, (Number(variant) || 0) + mealIndex);

    if (items.length < 2) {
      for (const food of rotatedPreferredOrder) {
        const key = foodKey(food);
        if (!key || used.has(key)) continue;
        used.add(key);
        items.push(food);
        if (items.length >= 3) break;
      }
    }

    const targetCalories = mealTargets[meal.meal] || 0;
    items = topUpMealCalories(items, targetCalories, rotatedPreferredOrder, mealIndex + Number(variant || 0));

    const calories = items.reduce((sum, item) => sum + toNumber(item.calories), 0);
    const ideas = items.map((item) => `${item.name} (${item.servingSize})`);

    return {
      meal: meal.meal,
      calories: calories || targetCalories,
      ideas,
      foods: items,
    };
  });
};

export const profileIsComplete = (profile) => (
  toNumber(profile?.age) > 0 &&
  toNumber(profile?.height) > 0 &&
  toNumber(profile?.weight) > 0 &&
  Boolean(profile?.goal)
);

export const formatGoal = (goal) => String(goal || 'maintain').replace(/_/g, ' ');

export const scoreLabel = (score) => {
  if (score >= 85) return 'Dialed in';
  if (score >= 70) return 'Strong match';
  if (score >= 50) return 'Needs balance';
  return 'Needs attention';
};

export const trendLabel = (progress) => {
  if (progress.calories.target <= 0) return 'Profile incomplete';
  if (progress.calories.remaining === 0 && progress.protein.remaining === 0) return 'Goals met';
  if (progress.calories.remaining < 250) return 'Near target';
  return 'Room to grow';
};
