const round2 = (value) => Math.round((Number(value) || 0) * 100) / 100;

const getFoodFromLog = (log) => {
  if (!log || !log.foodId) return null;
  return typeof log.foodId === 'object' ? log.foodId : null;
};

const getDerivedNutrition = (log) => {
  const food = getFoodFromLog(log) || {};
  const quantity = Number(log?.quantity ?? 0) || 0;

  return {
    calories: round2((Number(food.calories) || 0) * quantity),
    protein: round2((Number(food.protein) || 0) * quantity),
    carbs: round2((Number(food.carbs) || 0) * quantity),
    fat: round2((Number(food.fat) || 0) * quantity),
  };
};

const toFoodLogEntryDTO = (log) => {
  const food = getFoodFromLog(log);
  const nutrition = getDerivedNutrition(log);

  return {
    _id: log._id,
    userId: log.userId,
    foodId: food?._id || log.foodId,
    quantity: Number(log.quantity) || 0,
    mealType: log.mealType || food?.category || 'other',
    date: log.date,
    time: log.time,
    food: food
      ? {
          _id: food._id,
          name: food.name,
          calories: Number(food.calories) || 0,
          protein: Number(food.protein) || 0,
          carbs: Number(food.carbs) || 0,
          fat: Number(food.fat) || 0,
          category: food.category,
        }
      : null,
    foodName: food?.name || 'Unknown Food',
    category: log.mealType || food?.category,
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fat: nutrition.fat,
    fats: nutrition.fat,
    createdAt: log.createdAt,
    updatedAt: log.updatedAt,
  };
};

const sumEntryTotals = (entries) => entries.reduce(
  (acc, item) => {
    acc.totalCalories += Number(item.calories) || 0;
    acc.totalProtein += Number(item.protein) || 0;
    acc.totalCarbs += Number(item.carbs) || 0;
    acc.totalFat += Number(item.fat ?? item.fats) || 0;
    return acc;
  },
  { totalCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }
);

module.exports = {
  getDerivedNutrition,
  toFoodLogEntryDTO,
  sumEntryTotals,
};