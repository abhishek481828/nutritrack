import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDashboardSummary } from '../services/dashboardService';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';

const WALKING_PACES = [
  { value: 'slow', label: 'Slow', met: 2.8 },
  { value: 'moderate', label: 'Moderate', met: 3.5 },
  { value: 'brisk', label: 'Brisk', met: 4.3 },
];

const WORKOUT_LEVELS = [
  { value: 'light', label: 'Light', met: 3.5 },
  { value: 'moderate', label: 'Moderate', met: 5.5 },
  { value: 'hard', label: 'Hard', met: 7.0 },
];

const FOOD_SUGGESTIONS = {
  deficit: [
    { name: 'Banana', calories: 105, protein: 1, carbs: 27, fat: 0 },
    { name: 'Oats', calories: 170, protein: 6, carbs: 28, fat: 4 },
    { name: 'Peanut Butter Toast', calories: 220, protein: 8, carbs: 18, fat: 12 },
    { name: 'Paneer Bowl', calories: 240, protein: 14, carbs: 8, fat: 15 },
  ],
  balanced: [
    { name: 'Dal', calories: 180, protein: 10, carbs: 24, fat: 4 },
    { name: 'Curd', calories: 110, protein: 6, carbs: 8, fat: 5 },
    { name: 'Egg', calories: 155, protein: 13, carbs: 1, fat: 11 },
    { name: 'Chicken', calories: 240, protein: 28, carbs: 0, fat: 12 },
  ],
  surplus: [
    { name: 'Salad Bowl', calories: 90, protein: 3, carbs: 10, fat: 4 },
    { name: 'Soup', calories: 120, protein: 5, carbs: 15, fat: 3 },
    { name: 'Fruit Bowl', calories: 95, protein: 1, carbs: 24, fat: 0 },
    { name: 'Sprouts', calories: 140, protein: 9, carbs: 20, fat: 3 },
  ],
};

const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const WEEKLY_THEMES = [
  'Recovery & balance',
  'Strength & protein',
  'Light cardio & fiber',
  'High energy training',
  'Core stability & hydration',
  'Long walk & meal prep',
  'Rest & reset',
];

const DAILY_FOOD_PATTERNS = [
  {
    breakfast: 'Oats, banana, curd',
    lunch: 'Rice, dal, salad, paneer',
    dinner: 'Roti, vegetable soup, sprouts',
    snack: 'Fruit and nuts',
  },
  {
    breakfast: 'Eggs, toast, milk',
    lunch: 'Chicken, rice, greens',
    dinner: 'Paneer bowl and vegetables',
    snack: 'Greek yogurt',
  },
  {
    breakfast: 'Poha, peanuts, tea',
    lunch: 'Roti, dal, curd, salad',
    dinner: 'Grilled protein and soup',
    snack: 'Apple and seeds',
  },
  {
    breakfast: 'Smoothie and oats',
    lunch: 'Rice bowl with chicken or tofu',
    dinner: 'Khichdi and vegetables',
    snack: 'Roasted chana',
  },
  {
    breakfast: 'Idli, sambar, fruit',
    lunch: 'Roti, paneer, dal, salad',
    dinner: 'Light soup and protein',
    snack: 'Buttermilk and nuts',
  },
  {
    breakfast: 'Upma, curd, banana',
    lunch: 'Meal-prep bowl with grains and protein',
    dinner: 'Veg stir fry with roti',
    snack: 'Fruit bowl',
  },
  {
    breakfast: 'Dosa, chutney, milk',
    lunch: 'Balanced thali with protein',
    dinner: 'Simple soup and salad',
    snack: 'Seeds and berries',
  },
];

const calculateCalories = (met, weight, minutes) => Math.round((met * weight * minutes) / 60);

const toTitleCase = (value = '') => String(value || '').replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());

const Activity = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    walkingMinutes: '30',
    walkingPace: 'moderate',
    steps: '4000',
    workoutMinutes: '0',
    workoutLevel: 'moderate',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await getDashboardSummary();
        setSummary(res.data.data);
      } catch {
        setError('Unable to load your current calorie data.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const weight = user?.weight || 70;
  const consumedCalories = summary?.summary?.calories?.consumed || 0;
  const baseGoal = summary?.summary?.calories?.target || 0;

  const walkingMet = WALKING_PACES.find((item) => item.value === form.walkingPace)?.met || 3.5;
  const workoutMet = WORKOUT_LEVELS.find((item) => item.value === form.workoutLevel)?.met || 5.5;

  const walkingCalories = useMemo(
    () => calculateCalories(walkingMet, weight, Number(form.walkingMinutes) || 0),
    [walkingMet, weight, form.walkingMinutes]
  );
  const stepCalories = useMemo(
    () => Math.round((Number(form.steps) || 0) * 0.04 * (weight / 70)),
    [form.steps, weight]
  );
  const workoutCalories = useMemo(
    () => calculateCalories(workoutMet, weight, Number(form.workoutMinutes) || 0),
    [workoutMet, weight, form.workoutMinutes]
  );

  const totalBurned = walkingCalories + stepCalories + workoutCalories;
  const adjustedGoal = Math.max(baseGoal + totalBurned, 0);
  const remainingCalories = Math.max(adjustedGoal - consumedCalories, 0);

  const suggestionGroup = remainingCalories > 500 ? 'deficit' : remainingCalories < 150 ? 'surplus' : 'balanced';
  const suggestions = FOOD_SUGGESTIONS[suggestionGroup];

  const burnSegments = useMemo(() => {
    const total = Math.max(totalBurned, 1);
    return [
      { key: 'walking', label: 'Walking', calories: walkingCalories, percent: Math.round((walkingCalories / total) * 100) },
      { key: 'steps', label: 'Steps', calories: stepCalories, percent: Math.round((stepCalories / total) * 100) },
      { key: 'workout', label: 'Workout', calories: workoutCalories, percent: Math.round((workoutCalories / total) * 100) },
    ];
  }, [totalBurned, walkingCalories, stepCalories, workoutCalories]);

  const weeklyPlan = useMemo(() => {
    return WEEKDAY_NAMES.map((dayName, index) => {
      const dayBurn = Math.max(totalBurned + (index % 3) * 35 - (index === 6 ? 55 : 0), 0);
      const dayGoal = Math.max(baseGoal + dayBurn + (index === 5 ? 120 : 0) - (index === 6 ? 100 : 0), 0);
      const dayRemaining = Math.max(dayGoal - consumedCalories, 0);
      const mealCalories = [
        Math.round(dayGoal * 0.27),
        Math.round(dayGoal * 0.36),
        Math.round(dayGoal * 0.24),
        Math.round(dayGoal * 0.13),
      ];

      return {
        dayName,
        theme: WEEKLY_THEMES[index],
        goal: dayGoal,
        burn: dayBurn,
        remaining: dayRemaining,
        meals: DAILY_FOOD_PATTERNS[index],
        mealCalories,
      };
    });
  }, [baseGoal, consumedCalories, totalBurned]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="page-shell activity-page">
      <div className="page-header card activity-header-card">
        <div>
          <p className="page-kicker">Activity</p>
          <h1 className="activity-title">Exercise Calorie Adjuster</h1>
          <p className="page-subtitle activity-subtitle">
            Enter your walking and workout time to estimate calories burned and update your food allowance.
          </p>
          <div className="activity-header-chips">
            <span className="activity-header-chip">Weight: {weight} kg</span>
            <span className="activity-header-chip">Goal: {toTitleCase(user?.goal || 'maintain')}</span>
            <span className="activity-header-chip">Base Target: {baseGoal.toLocaleString()} kcal</span>
          </div>
        </div>
      </div>

      <Alert type="error" message={error} onDismiss={() => setError('')} />

      <div className="page-two-column activity-layout">
        <div className="card page-card activity-form-card">
          <h2>Activity Input</h2>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="walkingMinutes">Walking Minutes</label>
              <input id="walkingMinutes" name="walkingMinutes" type="number" min="0" value={form.walkingMinutes} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="walkingPace">Walking Pace</label>
              <select id="walkingPace" name="walkingPace" value={form.walkingPace} onChange={handleChange}>
                {WALKING_PACES.map((pace) => (
                  <option key={pace.value} value={pace.value}>{pace.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="steps">Steps Walked</label>
              <input id="steps" name="steps" type="number" min="0" value={form.steps} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label htmlFor="workoutMinutes">Workout Minutes</label>
              <input id="workoutMinutes" name="workoutMinutes" type="number" min="0" value={form.workoutMinutes} onChange={handleChange} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="workoutLevel">Workout Intensity</label>
            <select id="workoutLevel" name="workoutLevel" value={form.workoutLevel} onChange={handleChange}>
              {WORKOUT_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="card page-card activity-summary-card">
          <h2>Calorie Summary</h2>
          {loading ? (
            <div className="page-loading-row"><Spinner size="md" /></div>
          ) : (
            <div className="activity-summary-stack">
              <div className="activity-hero-stat">
                <span>Calories Burned</span>
                <strong>{totalBurned.toLocaleString()}</strong>
              </div>
              <div className="activity-summary-grid">
                <div className="summary-tile">
                  <span>Walking</span>
                  <strong>{walkingCalories} kcal</strong>
                </div>
                <div className="summary-tile">
                  <span>Steps</span>
                  <strong>{stepCalories} kcal</strong>
                </div>
                <div className="summary-tile">
                  <span>Workout</span>
                  <strong>{workoutCalories} kcal</strong>
                </div>
                <div className="summary-tile">
                  <span>Adjusted Goal</span>
                  <strong>{adjustedGoal.toLocaleString()} kcal</strong>
                </div>
              </div>
              <div className="page-note-card activity-note-card">
                <p>
                  Base goal {baseGoal.toLocaleString()} kcal + burned calories {totalBurned.toLocaleString()} kcal - today consumed {consumedCalories.toLocaleString()} kcal.
                </p>
              </div>
              <div className="activity-remain-pill">
                {remainingCalories.toLocaleString()} kcal remaining today
              </div>

              <div className="activity-burn-breakdown">
                {burnSegments.map((segment) => (
                  <div key={segment.key} className="activity-burn-row">
                    <div className="activity-burn-head">
                      <span>{segment.label}</span>
                      <strong>{segment.calories} kcal</strong>
                    </div>
                    <div className="activity-burn-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={segment.percent}>
                      <div className={`activity-burn-fill activity-burn-fill--${segment.key}`} style={{ width: `${segment.percent}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card page-card activity-recommendation-card">
        <div className="activity-section-head">
          <h2>Food Suggestions</h2>
          <span className={`activity-status-pill activity-status-pill--${suggestionGroup}`}>
            {suggestionGroup === 'deficit' ? 'High-energy needed' : suggestionGroup === 'surplus' ? 'Keep it lighter' : 'Balanced intake'}
          </span>
        </div>
        <p className="page-subtitle activity-subtitle-small">
          Based on your activity, here are foods that fit your current calorie needs.
        </p>
        <div className="activity-food-grid">
          {suggestions.map((food) => (
            <div key={food.name} className="activity-food-card">
              <strong>{food.name}</strong>
              <span>{food.calories} kcal per serving</span>
              <small>P {food.protein}g · C {food.carbs}g · F {food.fat}g</small>
            </div>
          ))}
        </div>
      </div>

      <div className="card page-card activity-plan-card">
        <h2>Simple Meal Plan</h2>
        <div className="meal-plan-grid activity-meal-grid">
          <div className="meal-plan-item">
            <span>Breakfast</span>
            <ul>
              <li>Oats with curd and banana</li>
              <li>2 eggs or paneer toast</li>
            </ul>
          </div>
          <div className="meal-plan-item">
            <span>Lunch</span>
            <ul>
              <li>Rice or roti with dal</li>
              <li>Chicken or paneer with salad</li>
            </ul>
          </div>
          <div className="meal-plan-item">
            <span>Dinner</span>
            <ul>
              <li>Light protein bowl</li>
              <li>Vegetables with soup</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="card page-card activity-weekly-card">
        <div className="section-heading">
          <div>
            <p className="page-kicker">7 Day Goal</p>
            <h2>Weekly calorie and food plan</h2>
          </div>
          <p className="page-subtitle activity-subtitle-small">
            Every day includes a calorie goal, activity target, and meal breakdown so you can follow the full week.
          </p>
        </div>

        <div className="activity-weekly-grid">
          {weeklyPlan.map((day, index) => (
            <article key={day.dayName} className={`activity-day-card ${index === 0 ? 'activity-day-card--today' : ''}`}>
              <div className="activity-day-header">
                <div>
                  <strong>{day.dayName}</strong>
                  <span>{day.theme}</span>
                </div>
                <div className="activity-day-badge">Day {index + 1}</div>
              </div>

              <div className="activity-day-stats">
                <div>
                  <span>Goal</span>
                  <strong>{day.goal.toLocaleString()} kcal</strong>
                </div>
                <div>
                  <span>Activity burn</span>
                  <strong>{day.burn.toLocaleString()} kcal</strong>
                </div>
                <div>
                  <span>Remaining</span>
                  <strong>{day.remaining.toLocaleString()} kcal</strong>
                </div>
              </div>

              <div className="activity-day-meals">
                <div>
                  <span>Breakfast</span>
                  <strong>{day.meals.breakfast}</strong>
                  <small>~{day.mealCalories[0]} kcal</small>
                </div>
                <div>
                  <span>Lunch</span>
                  <strong>{day.meals.lunch}</strong>
                  <small>~{day.mealCalories[1]} kcal</small>
                </div>
                <div>
                  <span>Dinner</span>
                  <strong>{day.meals.dinner}</strong>
                  <small>~{day.mealCalories[2]} kcal</small>
                </div>
                <div>
                  <span>Snack</span>
                  <strong>{day.meals.snack}</strong>
                  <small>~{day.mealCalories[3]} kcal</small>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Activity;
