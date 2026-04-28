import { useEffect, useMemo, useState } from 'react';
import { getMe } from '../services/authService';
import { getDailyLogs } from '../services/foodLogService';
import { calculateNutrition, getDietRecommendation } from '../services/nutritionService';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

const formatNumber = (value) => Math.round(Number(value) || 0);
const foodKey = (food) => String(food?.id || food?._id || food?.name || '');

const toFood = (food = {}) => ({
  id: food.id || food._id || food.name,
  name: food.name || 'Unknown food',
  calories: Number(food.calories) || 0,
  protein: Number(food.protein) || 0,
  carbs: Number(food.carbs) || 0,
  fat: Number(food.fat ?? food.fats ?? 0) || 0,
  servingSize: food.servingSize || '1 serving',
  category: food.category,
});

const normalizeMealName = (value = '') => {
  const text = String(value).toLowerCase();
  if (text.includes('breakfast')) return 'breakfast';
  if (text.includes('lunch')) return 'lunch';
  if (text.includes('dinner')) return 'dinner';
  return '';
};

const pickFoods = (foods, start, count = 3) => foods.slice(start, start + count);

const buildMealPlan = (meals = [], foods = []) => {
  const byMeal = meals.reduce((acc, meal) => {
    const key = normalizeMealName(meal?.meal || meal?.name);
    if (!key) return acc;
    acc[key] = {
      meal: key.charAt(0).toUpperCase() + key.slice(1),
      calories: Number(meal.calories) || 0,
      ideas: Array.isArray(meal.ideas) ? meal.ideas : [],
      foods: Array.isArray(meal.foods) ? meal.foods.map(toFood) : [],
    };
    return acc;
  }, {});

  return ['breakfast', 'lunch', 'dinner'].map((mealName, index) => {
    if (byMeal[mealName]) return byMeal[mealName];
    const fallbackFoods = pickFoods(foods, index * 2, 3);
    return {
      meal: mealName.charAt(0).toUpperCase() + mealName.slice(1),
      calories: fallbackFoods.reduce((sum, item) => sum + Number(item.calories || 0), 0),
      ideas: fallbackFoods.map((item) => `${item.name} (${item.servingSize || '1 serving'})`),
      foods: fallbackFoods,
    };
  });
};

const buildFoodGroups = (foods = []) => {
  const uniqueFoods = Array.from(new Map(foods.map((food) => [foodKey(food), toFood(food)])).values());

  const used = new Set();
  const take = (list, amount) => {
    const picked = [];
    for (const item of list) {
      const key = foodKey(item);
      if (!key || used.has(key)) continue;
      used.add(key);
      picked.push(item);
      if (picked.length === amount) break;
    }
    return picked;
  };

  const highProtein = take([...uniqueFoods].sort((a, b) => b.protein - a.protein || a.carbs - b.carbs), 2);
  const lowCarb = take([...uniqueFoods].sort((a, b) => a.carbs - b.carbs || b.protein - a.protein), 2);
  const balanced = take(
    [...uniqueFoods].sort((a, b) => {
      const scoreA = Math.abs(a.calories - (a.protein * 4 + a.carbs * 4 + a.fat * 9));
      const scoreB = Math.abs(b.calories - (b.protein * 4 + b.carbs * 4 + b.fat * 9));
      return scoreA - scoreB;
    }),
    2
  );

  return {
    highProtein,
    lowCarb,
    balanced,
    all: [...highProtein, ...lowCarb, ...balanced],
  };
};

const buildInsights = (progress, nutritionData) => {
  const insights = [];

  if (progress.protein.target > 0 && progress.protein.consumed < progress.protein.target * 0.65) {
    insights.push('Low protein intake today. Add a high-protein meal.');
  }

  if (progress.carbs.target > 0 && progress.carbs.consumed > progress.carbs.target * 1.1) {
    insights.push('High carb consumption. Consider lower-carb options for the next meal.');
  }

  if (progress.calories.target > 0 && progress.calories.remaining > 450) {
    insights.push(`You still need around ${formatNumber(progress.calories.remaining)} kcal to meet your target.`);
  }

  const recommendationBlocks = nutritionData?.recommendations || [];
  recommendationBlocks.slice(0, 2).forEach((block) => {
    if (block?.reason) insights.push(block.reason);
  });

  if (insights.length === 0) {
    insights.push('Great balance today. Keep your hydration and meal timing consistent.');
  }

  return insights;
};

const initialProgress = {
  calories: { consumed: 0, target: 0, remaining: 0 },
  protein: { consumed: 0, target: 0, remaining: 0 },
  carbs: { consumed: 0, target: 0, remaining: 0 },
  fats: { consumed: 0, target: 0, remaining: 0 },
};

const NutritionAssistant = () => {
  const { user } = useAuth();
  const [dietType, setDietType] = useState('veg');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recommendation, setRecommendation] = useState(null);
  const [insights, setInsights] = useState([]);
  const [todayProgress, setTodayProgress] = useState(initialProgress);
  const [profile, setProfile] = useState(user);
  const [selectedFoodId, setSelectedFoodId] = useState('');

  useEffect(() => {
    setProfile(user);
  }, [user]);

  useEffect(() => {
    let active = true;

    const loadAssistant = async () => {
      setLoading(true);
      setError('');

      try {
        let currentUser = user;
        if (!currentUser) {
          const profileRes = await getMe();
          currentUser = profileRes.data?.data?.user || null;
          if (active) setProfile(currentUser);
        }

        const hasProfileForCalculation =
          Number(currentUser?.age) > 0 &&
          Number(currentUser?.height) > 0 &&
          Number(currentUser?.weight) > 0 &&
          Boolean(currentUser?.goal);

        const nutritionPromise = hasProfileForCalculation
          ? calculateNutrition({
              age: Number(currentUser.age),
              height: Number(currentUser.height),
              weight: Number(currentUser.weight),
              goal: currentUser.goal,
              gender: String(currentUser.gender || 'male').toLowerCase(),
              activityLevel: String(currentUser.activityLevel || 'moderate').toLowerCase(),
            }).catch(() => null)
          : Promise.resolve(null);

        const [recommendationRes, logsRes, nutritionRes] = await Promise.all([
          getDietRecommendation(dietType),
          getDailyLogs(),
          nutritionPromise,
        ]);

        const recData = recommendationRes.data?.data || {};
        const nutritionData = nutritionRes?.data?.data || null;
        const todayData = logsRes.data || {};
        const totals = todayData.totals || {};

        const targetCalories = Number(recData.targetCalories) || 0;
        const macros = recData.macros || { protein: 0, carbs: 0, fat: 0 };
        const consumedCalories = Number(totals.totalCalories ?? totals.calories ?? 0) || 0;
        const consumedProtein = Number(totals.totalProtein ?? totals.protein ?? 0) || 0;
        const consumedCarbs = Number(totals.totalCarbs ?? totals.carbs ?? 0) || 0;
        const consumedFat = Number(totals.totalFat ?? totals.fats ?? 0) || 0;

        const nextProgress = {
          calories: {
            consumed: consumedCalories,
            target: targetCalories,
            remaining: Math.max(targetCalories - consumedCalories, 0),
          },
          protein: {
            consumed: consumedProtein,
            target: Number(macros.protein) || 0,
            remaining: Math.max((Number(macros.protein) || 0) - consumedProtein, 0),
          },
          carbs: {
            consumed: consumedCarbs,
            target: Number(macros.carbs) || 0,
            remaining: Math.max((Number(macros.carbs) || 0) - consumedCarbs, 0),
          },
          fats: {
            consumed: consumedFat,
            target: Number(macros.fat) || 0,
            remaining: Math.max((Number(macros.fat) || 0) - consumedFat, 0),
          },
        };

        const apiFoods = Array.isArray(recData.suggestedFoods) ? recData.suggestedFoods : [];
        const mealFoods = Array.isArray(recData.recommendedMeals)
          ? recData.recommendedMeals.flatMap((meal) => meal?.foods || [])
          : [];
        const calculatedFoods = Array.isArray(nutritionData?.recommendations)
          ? nutritionData.recommendations.flatMap((section) => section?.items || [])
          : [];

        const mergedFoods = Array.from(
          new Map([...apiFoods, ...mealFoods, ...calculatedFoods].map((food) => [foodKey(food), toFood(food)])).values()
        );

        const groups = buildFoodGroups(mergedFoods);
        const fullMealPlan = buildMealPlan(recData.recommendedMeals || [], mergedFoods);
        const nextInsights = buildInsights(nextProgress, nutritionData);

        if (!active) return;
        setRecommendation({
          ...recData,
          suggestedFoods: groups.all,
          recommendedMeals: fullMealPlan,
        });
        setTodayProgress(nextProgress);
        setInsights(nextInsights);
        const firstFood = groups.all[0] || null;
        setSelectedFoodId(firstFood ? (firstFood.id || firstFood._id || firstFood.name) : '');
      } catch (err) {
        if (!active) return;
        const message = err.response?.data?.message || err.message || 'Failed to load recommendations.';
        setError(message);
        setRecommendation(null);
        setInsights([]);
        setTodayProgress(initialProgress);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadAssistant();
    return () => {
      active = false;
    };
  }, [dietType, user]);

  const selectedFood = useMemo(() => {
    const foods = recommendation?.suggestedFoods || [];
    if (selectedFoodId) {
      return foods.find((food) => (food.id || food._id || food.name) === selectedFoodId) || foods[0] || null;
    }
    return foods[0] || null;
  }, [recommendation, selectedFoodId]);

  const foods = useMemo(() => recommendation?.suggestedFoods || [], [recommendation]);
  const foodGroups = useMemo(() => buildFoodGroups(foods), [foods]);

  const statusMessage = useMemo(() => {
    if (todayProgress.calories.target <= 0) {
      return 'Complete your profile to get personalized daily targets.';
    }

    if (todayProgress.calories.remaining > 0) {
      return `You need ${formatNumber(todayProgress.calories.remaining)} more calories today.`;
    }

    return 'Great work. You have met your calorie target for today.';
  }, [todayProgress]);

  const dietTypeLabel = dietType === 'veg' ? 'Vegetarian' : 'Non-Vegetarian';

  return (
    <div className="card nutrition-assistant-card">
      <div className="nutrition-assistant-header">
        <div>
          <h2>Smart Nutrition Assistant</h2>
          <p className="nutrition-assistant-subtitle">
            Live recommendations from your profile, today's logs, and the food library.
          </p>
        </div>
        <span className="nutrition-assistant-note">{dietTypeLabel}</span>
      </div>

      <div className="nutrition-assistant-toggle" role="tablist" aria-label="Diet type">
        <button
          type="button"
          className={dietType === 'veg' ? 'diet-toggle-btn diet-toggle-btn--active' : 'diet-toggle-btn'}
          onClick={() => setDietType('veg')}
        >
          Veg
        </button>
        <button
          type="button"
          className={dietType === 'non-veg' ? 'diet-toggle-btn diet-toggle-btn--active' : 'diet-toggle-btn'}
          onClick={() => setDietType('non-veg')}
        >
          Non-Veg
        </button>
      </div>

      {loading ? (
        <div className="page-loading-row">
          <Spinner size="md" />
        </div>
      ) : error ? (
        <div className="empty-state">
          <p>{error}</p>
        </div>
      ) : (
        <>
          <div className="nutrition-assistant-layout">
            <section className="nutrition-assistant-panel">
              <h3>Today&apos;s Status</h3>
              <div className="selected-food-card">
                <div className="selected-food-head">
                  <strong>{profile?.name || 'Your profile'}</strong>
                  <span>{dietTypeLabel} recommendations</span>
                </div>
                <div className="selected-food-metrics">
                  <div><span>Remaining Calories</span><strong className="nutrition-kpi-number">{todayProgress.calories.remaining} kcal</strong></div>
                  <div><span>Protein</span><strong className="nutrition-kpi-number">{todayProgress.protein.remaining}g left</strong></div>
                  <div><span>Carbs</span><strong className="nutrition-kpi-number">{todayProgress.carbs.remaining}g left</strong></div>
                  <div><span>Fat</span><strong className="nutrition-kpi-number">{todayProgress.fats.remaining}g left</strong></div>
                </div>
              </div>
              <p className="nutrition-assistant-note" style={{ marginTop: '0.75rem' }}>
                {statusMessage}
              </p>
            </section>

            <section className="nutrition-assistant-panel nutrition-selected-panel">
              <h3>Food Spotlight</h3>
              {selectedFood ? (
                <div className="selected-food-card">
                  <div className="selected-food-head">
                    <strong>{selectedFood.name}</strong>
                    <span>{selectedFood.servingSize || '1 serving'}</span>
                  </div>
                  <div className="selected-food-metrics">
                    <div><span>Calories</span><strong>{formatNumber(selectedFood.calories)}</strong></div>
                    <div><span>Protein</span><strong>{formatNumber(selectedFood.protein)}g</strong></div>
                    <div><span>Carbs</span><strong>{formatNumber(selectedFood.carbs)}g</strong></div>
                    <div><span>Fat</span><strong>{formatNumber(selectedFood.fat)}g</strong></div>
                  </div>
                </div>
              ) : (
                <p className="nutrition-empty">No recommendation data found.</p>
              )}
            </section>
          </div>

          <section className="nutrition-assistant-panel">
            <h3>Smart Insights</h3>
            <div className="nutrition-insight-list">
              {insights.map((insight, index) => (
                <div className="nutrition-insight-item" key={`${index}-${insight}`}>{insight}</div>
              ))}
            </div>
          </section>

          <section className="nutrition-assistant-panel">
            <h3>Recommended Foods</h3>
            <div className="nutrition-category-grid">
              {[
                { key: 'highProtein', label: 'High Protein', items: foodGroups.highProtein },
                { key: 'lowCarb', label: 'Low Carb', items: foodGroups.lowCarb },
                { key: 'balanced', label: 'Balanced', items: foodGroups.balanced },
              ].map((group) => (
                <div className="nutrition-category-block" key={group.key}>
                  <h4>{group.label}</h4>
                  <div className="food-choice-grid">
                    {(group.items || []).map((food) => {
                      const key = food.id || food._id || food.name;
                      return (
                        <button
                          key={key}
                          type="button"
                          className={selectedFoodId === key ? 'food-choice-btn food-choice-btn--active' : 'food-choice-btn'}
                          onClick={() => setSelectedFoodId(key)}
                        >
                          <span>{food.name}</span>
                          <small>{formatNumber(food.calories)} kcal · {formatNumber(food.protein)}g protein</small>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            {foods.length === 0 ? <p className="nutrition-empty">No recommended foods available for this diet type yet.</p> : null}
          </section>

          <section className="nutrition-assistant-panel">
            <h3>Full Meal Plan</h3>
            <div className="meal-plan-grid">
              {(recommendation?.recommendedMeals || []).map((meal) => (
                <div className="meal-plan-item" key={meal.meal || meal.name}>
                  <span>{meal.meal || meal.name}</span>
                  <div className="selected-food-metrics" style={{ marginTop: '0.5rem' }}>
                    <div><span>Calories</span><strong>{formatNumber(meal.calories)}</strong></div>
                    <div><span>Foods</span><strong>{(meal.foods || []).length}</strong></div>
                  </div>
                  <ul>
                    {(meal.ideas || []).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default NutritionAssistant;
