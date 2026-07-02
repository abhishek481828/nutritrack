import api from './api';
import { createFood, getFoods } from './foodService';

const normalizeEntry = (entry = {}) => {
  const food = entry.food || {};
  const fat = Number(entry.fat ?? entry.fats ?? 0) || 0;
  const normalizedMealType = entry.mealType || entry.category || food.category || 'other';
  return {
    ...entry,
    food,
    foodId: entry.foodId || food._id,
    foodName: entry.foodName || food.name || 'Unknown Food',
    quantity: Number(entry.quantity ?? 0) || 0,
    fat,
    fats: fat,
    category: normalizedMealType,
    mealType: normalizedMealType,
  };
};

const normalizeDailyPayload = (payload = {}) => {
  const entries = Array.isArray(payload.entries)
    ? payload.entries
    : Array.isArray(payload.data)
      ? payload.data
      : [];

  const normalizedEntries = entries.map(normalizeEntry);

  const incomingTotals = payload.totals || {};
  const fallbackTotals = payload.legacyTotals || {};

  const totalCalories = Number(incomingTotals.totalCalories ?? fallbackTotals.calories ?? incomingTotals.calories ?? 0) || 0;
  const totalProtein = Number(incomingTotals.totalProtein ?? fallbackTotals.protein ?? incomingTotals.protein ?? 0) || 0;
  const totalCarbs = Number(incomingTotals.totalCarbs ?? fallbackTotals.carbs ?? incomingTotals.carbs ?? 0) || 0;
  const totalFat = Number(incomingTotals.totalFat ?? fallbackTotals.fats ?? incomingTotals.fats ?? 0) || 0;

  return {
    ...payload,
    entries: normalizedEntries,
    data: normalizedEntries,
    totals: {
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      calories: totalCalories,
      protein: totalProtein,
      carbs: totalCarbs,
      fats: totalFat,
      fat: totalFat,
    },
  };
};

const normalizeWritePayload = (data = {}) => {
  return {
    foodId: data.foodId,
    quantity: Number(data.quantity ?? 1) || 1,
    ...(data.mealType ? { mealType: data.mealType } : {}),
    ...(data.date ? { date: data.date } : {}),
  };
};

const getFoodIdFromAnyPayload = async (data = {}) => {
  if (data.foodId) return data.foodId;

  const fallbackName = data.foodName || data.name;
  if (!fallbackName) return null;

  const normalizedName = String(fallbackName).trim().toLowerCase();

  try {
    const foodsRes = await getFoods();
    const existing = (foodsRes.data?.data?.foods || foodsRes.data?.data || []).find(
      (food) => String(food?.name || '').trim().toLowerCase() === normalizedName
    );

    if (existing?._id) {
      return existing._id;
    }
  } catch {
    // Fall through to create a new reusable food record if the list cannot be loaded.
  }

  const created = await createFood({
    name: fallbackName,
    calories: Number(data.calories ?? 0) || 0,
    protein: Number(data.protein ?? 0) || 0,
    carbs: Number(data.carbs ?? 0) || 0,
    fat: Number(data.fat ?? data.fats ?? 0) || 0,
    servingSize: data.servingSize || '1 serving',
  });

  return created.data?.data?._id || null;
};

export const getDailyLogs = (date) =>
  api.get('/food-logs', { params: date ? { date } : {} })
    .then((res) => ({ ...res, data: normalizeDailyPayload(res.data) }));

export const addFoodLog = async (data) => {
  const foodId = await getFoodIdFromAnyPayload(data);
  return api.post('/food-logs', normalizeWritePayload({ ...data, foodId }));
};

export const updateFoodLog = async (id, data) => {
  const foodId = await getFoodIdFromAnyPayload(data);
  const payload = {
    ...(foodId ? { foodId } : {}),
    ...(data.quantity !== undefined ? { quantity: Number(data.quantity) || 1 } : {}),
    ...(data.mealType ? { mealType: data.mealType } : {}),
  };
  return api.put(`/food-logs/${id}`, payload);
};

export const deleteFoodLog = (id) =>
  api.delete(`/food-logs/${id}`);
