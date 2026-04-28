import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getMe } from '../../services/authService';
import { getDietRecommendation, getNutritionSummary } from '../../services/nutritionService';
import InsightBanner from './InsightBanner';
import ProgressPanel from './ProgressPanel';
import DailyScoreCard from './DailyScoreCard';
import SuggestionCards from './SuggestionCards';
import MealGenerator from './MealGenerator';
import QuickSuggestion from './QuickSuggestion';
import Spinner from '../Spinner';
import './NutritionCoachDashboard.css';

const toNumber = (value) => Number(value) || 0;

const initialProgress = {
  calories: { consumed: 0, target: 0, remaining: 0 },
  protein: { consumed: 0, target: 0, remaining: 0 },
  carbs: { consumed: 0, target: 0, remaining: 0 },
  fat: { consumed: 0, target: 0, remaining: 0 },
};

const initialMealPlan = [
  { meal: 'Breakfast', calories: 0, ideas: [] },
  { meal: 'Lunch', calories: 0, ideas: [] },
  { meal: 'Dinner', calories: 0, ideas: [] },
];

const completionRatio = (consumed, target) => {
  const safeConsumed = toNumber(consumed);
  const safeTarget = toNumber(target);
  if (safeTarget <= 0) return 0;
  return Math.min(safeConsumed / safeTarget, 1);
};

const balanceRatio = (consumed, target) => {
  const safeConsumed = toNumber(consumed);
  const safeTarget = toNumber(target);
  if (safeTarget <= 0) return 0;
  const ratio = safeConsumed / safeTarget;
  return Math.max(0, 1 - Math.abs(1 - ratio));
};

const normalizeFoodName = (value = '') => {
  const normalized = String(value || '').trim().toLowerCase();
  const typoMap = {
    chickne: 'chicken',
    brocolli: 'broccoli',
    tomatos: 'tomatoes',
  };
  const corrected = typoMap[normalized] || normalized;
  return corrected.replace(/\b\w/g, (char) => char.toUpperCase());
};

const foodKey = (item = {}) => String(item.id || item._id || item.name || '').toLowerCase();

const toFood = (item = {}) => ({
  id: item.id || item._id || item.name,
  name: normalizeFoodName(item.name),
  calories: toNumber(item.calories),
  protein: toNumber(item.protein),
  carbs: toNumber(item.carbs),
  fat: toNumber(item.fat ?? item.fats),
  servingSize: item.servingSize || '1 serving',
});

const dedupeFoods = (foods = []) => {
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

const rotateArray = (items = [], offset = 0) => {
  if (!Array.isArray(items) || items.length === 0) return [];
  const length = items.length;
  const safeOffset = ((offset % length) + length) % length;
  return [...items.slice(safeOffset), ...items.slice(0, safeOffset)];
};

const cloneMealFood = (food, suffix) => ({
  ...food,
  id: `${food.id || food.name || 'food'}-${suffix}`,
});

const topUpMealCalories = (items = [], targetCalories = 0, preferredFoods = [], seed = 0) => {
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

const normalizeMeals = (meals = []) => {
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

const calculateScore = (progress) => {
  const calorieComponent = completionRatio(progress.calories.consumed, progress.calories.target) * 40;
  const proteinComponent = completionRatio(progress.protein.consumed, progress.protein.target) * 30;
  const carbsComponent = balanceRatio(progress.carbs.consumed, progress.carbs.target) * 15;
  const fatComponent = balanceRatio(progress.fat.consumed, progress.fat.target) * 15;

  return Math.round(calorieComponent + proteinComponent + carbsComponent + fatComponent);
};

const buildInsightMessage = (progress) => {
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

const buildSuggestionCards = (recommendations = [], progress = initialProgress) => {
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

const buildMealPlan = (recommendationPayload = {}, progress = initialProgress, options = {}) => {
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

const profileIsComplete = (profile) => (
  toNumber(profile?.age) > 0 &&
  toNumber(profile?.height) > 0 &&
  toNumber(profile?.weight) > 0 &&
  Boolean(profile?.goal)
);

const formatGoal = (goal) => String(goal || 'maintain').replace(/_/g, ' ');

const scoreLabel = (score) => {
  if (score >= 85) return 'Dialed in';
  if (score >= 70) return 'Strong match';
  if (score >= 50) return 'Needs balance';
  return 'Needs attention';
};

const trendLabel = (progress) => {
  if (progress.calories.target <= 0) return 'Profile incomplete';
  if (progress.calories.remaining === 0 && progress.protein.remaining === 0) return 'Goals met';
  if (progress.calories.remaining < 250) return 'Near target';
  return 'Room to grow';
};

const NutritionCoachDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(user);
  const [dietType, setDietType] = useState('veg');
  const [loading, setLoading] = useState(true);
  const [mealLoading, setMealLoading] = useState(false);
  const [error, setError] = useState('');
  const [profileReady, setProfileReady] = useState(true);
  const [progress, setProgress] = useState(initialProgress);
  const [score, setScore] = useState(0);
  const [insight, setInsight] = useState({ message: '', subMessage: '' });
  const [suggestionCards, setSuggestionCards] = useState([]);
  const [mealPlan, setMealPlan] = useState(initialMealPlan);
  const [quickSuggestions, setQuickSuggestions] = useState([]);
  const [recommendationData, setRecommendationData] = useState({ recommendedMeals: [], suggestedFoods: [] });
  const [mealGenerationCount, setMealGenerationCount] = useState(0);
  const [lastMealUpdate, setLastMealUpdate] = useState(null);

  useEffect(() => {
    let mounted = true;

    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      try {
        let currentUser = user;
        if (!currentUser) {
          const meRes = await getMe();
          currentUser = meRes.data?.data?.user || null;
        }

        if (mounted) setProfile(currentUser);

        if (!profileIsComplete(currentUser)) {
          if (!mounted) return;
          setProfileReady(false);
          setProgress(initialProgress);
          setScore(0);
          setSuggestionCards([]);
          setQuickSuggestions([]);
          setMealPlan(initialMealPlan);
          setInsight({
            message: 'Complete your profile to unlock insights',
            subMessage: 'Add age, height, weight, and your goal in profile settings.',
          });
          return;
        }

        if (mounted) setProfileReady(true);

        const [nutritionRes, recommendationRes] = await Promise.all([
          getNutritionSummary(),
          getDietRecommendation(dietType),
        ]);

        const nutritionData = nutritionRes.data?.data || {};
        const targets = nutritionData.targets || {};
        const consumed = nutritionData.consumed || {};
        const recommendationPayload = recommendationRes.data?.data || { recommendedMeals: [], suggestedFoods: [] };

        const nextProgress = {
          calories: {
            consumed: toNumber(nutritionData.consumedCalories ?? consumed.calories),
            target: toNumber(nutritionData.targetCalories ?? targets.calories ?? targets.calorieGoal),
            remaining: Math.max(
              toNumber(nutritionData.targetCalories ?? targets.calories ?? targets.calorieGoal)
              - toNumber(nutritionData.consumedCalories ?? consumed.calories),
              0
            ),
          },
          protein: {
            consumed: toNumber(nutritionData.consumedProtein ?? consumed.protein),
            target: toNumber(nutritionData.targetProtein ?? targets.protein ?? targets.macros?.protein),
            remaining: Math.max(
              toNumber(nutritionData.targetProtein ?? targets.protein ?? targets.macros?.protein)
              - toNumber(nutritionData.consumedProtein ?? consumed.protein),
              0
            ),
          },
          carbs: {
            consumed: toNumber(nutritionData.consumedCarbs ?? consumed.carbs),
            target: toNumber(nutritionData.targetCarbs ?? targets.carbs ?? targets.macros?.carbs),
            remaining: Math.max(
              toNumber(nutritionData.targetCarbs ?? targets.carbs ?? targets.macros?.carbs)
              - toNumber(nutritionData.consumedCarbs ?? consumed.carbs),
              0
            ),
          },
          fat: {
            consumed: toNumber(nutritionData.consumedFat ?? consumed.fats),
            target: toNumber(nutritionData.targetFat ?? targets.fat ?? targets.fats ?? targets.macros?.fat),
            remaining: Math.max(
              toNumber(nutritionData.targetFat ?? targets.fat ?? targets.fats ?? targets.macros?.fat)
              - toNumber(nutritionData.consumedFat ?? consumed.fats),
              0
            ),
          },
        };

        const mergedSuggestions = [
          ...(nutritionData.recommendations || []),
          { type: 'recommend', items: recommendationPayload.suggestedFoods || [] },
        ];
        const cards = buildSuggestionCards(mergedSuggestions, nextProgress);
        const computedMealPlan = buildMealPlan(recommendationPayload, nextProgress, { variant: 0 });

        if (!mounted) return;
        setProgress(nextProgress);
        setScore(calculateScore(nextProgress));
        setInsight(buildInsightMessage(nextProgress));
        setSuggestionCards(cards);
        setRecommendationData(recommendationPayload);
        setMealPlan(computedMealPlan);
        setLastMealUpdate(new Date());
      } catch (err) {
        if (!mounted) return;
        setError(err.response?.data?.message || err.message || 'Unable to load nutrition dashboard right now.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, [user, dietType]);

  const allCardFoods = useMemo(() => suggestionCards.flatMap((card) => card.items || []), [suggestionCards]);
  const heroStats = useMemo(() => ([
    {
      label: 'Score',
      value: `${Math.min(100, Math.max(0, Math.round(score)))} / 100`,
      note: scoreLabel(score),
    },
    {
      label: 'Calories',
      value: progress.calories.target > 0 ? `${Math.round(progress.calories.remaining)} left` : 'Set targets',
      note: trendLabel(progress),
    },
    {
      label: 'Protein',
      value: progress.protein.target > 0 ? `${Math.round(progress.protein.remaining)}g left` : 'Set targets',
      note: progress.protein.target > 0 ? 'Prioritize lean protein' : 'Add profile data',
    },
  ]), [progress, score]);

  const handleMealGenerate = async () => {
    setMealLoading(true);
    setError('');

    try {
      const mealRes = await getDietRecommendation(dietType);
      const payload = mealRes.data?.data || { recommendedMeals: [], suggestedFoods: [] };
      const nextCount = mealGenerationCount + 1;
      const meals = buildMealPlan(payload, progress, { variant: nextCount });
      setMealPlan(meals);
      setRecommendationData(payload);
      setMealGenerationCount(nextCount);
      setLastMealUpdate(new Date());
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to generate meal plan.');
    } finally {
      setMealLoading(false);
    }
  };

  const handleQuickSuggestion = () => {
    const foods = dedupeFoods([
      ...allCardFoods,
      ...(recommendationData?.suggestedFoods || []),
      ...mealPlan.flatMap((meal) => meal.foods || []),
    ]);

    if (foods.length === 0) {
      setQuickSuggestions([]);
      return;
    }

    const deficiencies = [
      { key: 'protein', remaining: progress.protein.remaining },
      { key: 'calories', remaining: progress.calories.remaining },
      { key: 'fat', remaining: progress.fat.remaining },
      { key: 'carbs', remaining: progress.carbs.remaining },
    ].sort((a, b) => b.remaining - a.remaining);

    const primaryNeed = deficiencies[0]?.key || 'protein';

    const sorted = foods.slice().sort((a, b) => {
      if (primaryNeed === 'protein') {
        return b.protein - a.protein;
      }
      if (primaryNeed === 'calories') {
        return b.calories - a.calories;
      }
      if (primaryNeed === 'carbs' && progress.carbs.consumed > progress.carbs.target) {
        return a.calories - b.calories;
      }
      return (b.protein + b.fat) - (a.protein + a.fat);
    });

    setQuickSuggestions(sorted.slice(0, 2));
  };

  if (loading) {
    return (
      <div className="recommendations-loading">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!profileReady) {
    return (
      <section className="recommendations-empty-state">
        <div className="recommendations-empty-copy">
          <p className="recommendations-kicker">Adaptive Plan</p>
          <h1>Nutrition Recommendation Atlas</h1>
          <p>
            Add age, height, weight, and your goal to unlock a personalized coaching map.
          </p>
        </div>
        <div className="recommendations-empty-card">
          <span className="recommendations-empty-badge">Profile missing</span>
          <h2>Complete your profile to unlock insights</h2>
          <p>Once your profile is filled out, this page will generate macro guidance, food ideas, and meal timing tailored to you.</p>
        </div>
      </section>
    );
  }

  return (
    <div className="recommendations-dashboard">
      <div className="recommendations-backdrop" aria-hidden="true">
        <span className="recommendations-orb recommendations-orb--one" />
        <span className="recommendations-orb recommendations-orb--two" />
        <span className="recommendations-gridline" />
      </div>

      <header className="recommendations-hero">
        <div className="recommendations-hero-copy">
          <p className="recommendations-kicker">Adaptive Plan</p>
          <h1>Nutrition Recommendation Atlas</h1>
          <p className="recommendations-subtitle">
            A live coaching surface that turns your profile, current intake, and meal choices into a focused plan.
          </p>

          <div className="recommendations-chip-row">
            <span className="recommendations-chip">Profile: {profile?.name || 'User'}</span>
            <span className="recommendations-chip">Goal: {formatGoal(profile?.goal)}</span>
            <span className="recommendations-chip recommendations-chip--accent">Mode: {dietType === 'veg' ? 'Vegetarian' : 'Non-vegetarian'}</span>
          </div>

          <div className="recommendations-toggle-row" role="tablist" aria-label="Diet type switch">
            <button type="button" className={dietType === 'veg' ? 'is-active' : ''} onClick={() => setDietType('veg')}>Veg</button>
            <button type="button" className={dietType === 'non-veg' ? 'is-active' : ''} onClick={() => setDietType('non-veg')}>Non-Veg</button>
          </div>
        </div>

        <div className="recommendations-hero-card">
          <div className="recommendations-hero-ring">
            <span>{Math.min(100, Math.max(0, Math.round(score)))}</span>
            <small>nutrition score</small>
          </div>
          <div className="recommendations-hero-stack">
            {heroStats.map((stat) => (
              <div className="recommendations-hero-stat" key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <small>{stat.note}</small>
              </div>
            ))}
          </div>
        </div>
      </header>

      {error ? <div className="recommendations-error">{error}</div> : null}

      <section className="recommendations-signal-row">
        <InsightBanner message={insight.message} subMessage={insight.subMessage} />
        <DailyScoreCard score={score} />
      </section>

      <section className="recommendations-grid recommendations-grid--main">
        <div className="recommendations-column">
          <ProgressPanel progress={progress} />
          <SuggestionCards cards={suggestionCards} onSelectFood={(food) => setQuickSuggestions([food])} />
        </div>

        <div className="recommendations-column recommendations-column--stacked">
          <QuickSuggestion suggestions={quickSuggestions} onSuggest={handleQuickSuggestion} />
          <div className="recommendations-side-note">
            <p className="recommendations-side-note-kicker">Coach Signal</p>
            <h3>{trendLabel(progress)}</h3>
            <p>
              This view prioritizes the next best move based on your remaining calories and protein target, then backs it with meal ideas.
            </p>
          </div>
        </div>
      </section>

      <section className="recommendations-grid recommendations-grid--bottom">
        <MealGenerator
          mealPlan={mealPlan}
          loading={mealLoading}
          onGenerate={handleMealGenerate}
          generatedCount={mealGenerationCount}
          lastUpdated={lastMealUpdate}
        />
      </section>

      <p className="recommendations-footer-note">
        Coach profile: {profile?.name || 'User'} • Goal: {formatGoal(profile?.goal)}
      </p>
    </div>
  );
};

export default NutritionCoachDashboard;
