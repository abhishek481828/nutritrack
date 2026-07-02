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

import {
  toNumber,
  initialProgress,
  initialMealPlan,
  dedupeFoods,
  calculateScore,
  buildInsightMessage,
  buildSuggestionCards,
  buildMealPlan,
  profileIsComplete,
  formatGoal,
  scoreLabel,
  trendLabel,
} from './coachHelpers';

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
