import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../services/authService';
import { getDashboardSummary } from '../services/dashboardService';
import { calculateNutrition } from '../services/nutritionService';
import { addFoodLog, deleteFoodLog, updateFoodLog } from '../services/foodLogService';
import { downloadWeeklyReport } from '../services/reportService';
import { getErrorMessage } from '../utils/errorHandler';
import FoodSearchInput from '../components/FoodSearchInput';
import Alert       from '../components/Alert';
import Spinner     from '../components/Spinner';
import EmptyState  from '../components/EmptyState';
import PageLoader  from '../components/PageLoader';
import WeeklyChart from '../components/WeeklyChart';
import NutritionAssistant from '../components/NutritionAssistant';

// ─── CalorieProgress — SVG ring + bar hybrid ───────────────────────
const CalorieProgress = ({ consumed = 0, target = 0, remaining = 0, mealsCount = 0 }) => {
  const pct = target > 0 ? Math.min((consumed / target) * 100, 100) : 0;
  const over = consumed > target;

  const status =
    over      ? { label: 'Over Goal',    accent: '#f43f5e', track: 'rgba(244,63,94,0.15)' } :
    pct >= 85 ? { label: 'Almost There', accent: '#f59e0b', track: 'rgba(245,158,11,0.15)' } :
                { label: 'On Track',     accent: '#10b981', track: 'rgba(16,185,129,0.15)' };

  // SVG ring params
  const R = 52, C = 2 * Math.PI * R;
  const dash = (p) => `${(p / 100) * C} ${C}`;

  return (
    <div className="cal-progress-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        {/* Ring */}
        <div style={{ position: 'relative', flexShrink: 0, width: 130, height: 130 }}>
          <svg width="130" height="130" viewBox="0 0 130 130">
            {/* Track */}
            <circle cx="65" cy="65" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            {/* Fill */}
            <circle
              cx="65" cy="65" r={R}
              fill="none"
              stroke="url(#calGrad)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={dash(pct)}
              transform="rotate(-90 65 65)"
              style={{ transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)' }}
            />
            <defs>
              <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={status.accent} />
                <stop offset="100%" stopColor={over ? '#ef4444' : pct >= 85 ? '#f97316' : '#06b6d4'} />
              </linearGradient>
            </defs>
          </svg>
          {/* Center text */}
          <div style={{
            position: 'absolute', inset: 0, display: 'flex',
            flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}>
            <span style={{ fontFamily: 'Outfit,sans-serif', fontSize: '1.5rem', fontWeight: 800, lineHeight: 1, color: 'var(--text)' }}>
              {Math.round(pct)}%
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 2 }}>
              of goal
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ flex: 1, minWidth: 180 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.65rem' }}>
            <span className="cal-big" style={{ fontSize: '2rem' }}>{consumed.toLocaleString()}</span>
            <span className="cal-unit">kcal consumed</span>
            <span className="cal-status-pill" style={{ background: status.track, color: status.accent, marginLeft: 'auto' }}>
              {status.label}
            </span>
          </div>

          {/* Bar */}
          <div className="cal-bar-wrap" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="cal-bar-fill"
              style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${status.accent}88, ${status.accent})` }}
            />
          </div>

          {/* Bottom row */}
          <div className="cal-bottom-row" style={{ marginTop: '1rem' }}>
            <div className="cal-stat">
              <span className="cal-stat-value" style={{ color: status.accent }}>
                {over ? (consumed - target).toLocaleString() : remaining.toLocaleString()}
              </span>
              <span className="cal-stat-label">{over ? 'kcal over' : 'remaining'}</span>
            </div>
            <div className="cal-stat">
              <span className="cal-stat-value">{target.toLocaleString()}</span>
              <span className="cal-stat-label">daily goal</span>
            </div>
            <div className="cal-stat">
              <span className="cal-stat-value">{mealsCount}</span>
              <span className="cal-stat-label">meals today</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── MacroBar — single macro row ──────────────────────────────────
const MacroBar = ({ label, consumed = 0, target = 0, unit = 'g', color }) => {
  const pct = target > 0 ? Math.min(Math.round((consumed / target) * 100), 100) : 0;
  return (
    <div className="macro-bar">
      <div className="macro-bar-header">
        <div className="macro-bar-label">
          <span className="macro-dot" style={{ background: color }} />
          <span>{label}</span>
        </div>
        <span className="macro-bar-values">
          <strong>{consumed}{unit}</strong>
          <span className="macro-of"> / {target}{unit}</span>
        </span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
      </div>
      <span className="pct-label">{pct}%</span>
    </div>
  );
};

// ─── MacroPanel ────────────────────────────────────────────────────
const MacroPanel = ({ protein = {}, carbs = {}, fats = {} }) => {
  const totalKcal =
    (protein.consumed || 0) * 4 +
    (carbs.consumed   || 0) * 4 +
    (fats.consumed    || 0) * 9;

  const pPct = totalKcal > 0 ? ((protein.consumed * 4) / totalKcal) * 100 : 33;
  const cPct = totalKcal > 0 ? ((carbs.consumed   * 4) / totalKcal) * 100 : 34;
  const fPct = totalKcal > 0 ? ((fats.consumed    * 9) / totalKcal) * 100 : 33;

  return (
    <div className="card">
      <h2>Macronutrients</h2>
      <div className="macro-overview-bar" title="Today's macro split">
        <div className="macro-seg seg-protein" style={{ width: `${pPct}%` }} />
        <div className="macro-seg seg-carbs"   style={{ width: `${cPct}%` }} />
        <div className="macro-seg seg-fats"    style={{ width: `${fPct}%` }} />
      </div>
      <div className="macro-legend">
        <span className="macro-legend-item"><span className="macro-dot" style={{ background: '#4ade80' }} />Protein {Math.round(pPct)}%</span>
        <span className="macro-legend-item"><span className="macro-dot" style={{ background: '#60a5fa' }} />Carbs {Math.round(cPct)}%</span>
        <span className="macro-legend-item"><span className="macro-dot" style={{ background: '#fb923c' }} />Fats {Math.round(fPct)}%</span>
      </div>
      <div className="macro-bars-list">
        <MacroBar label="Protein" consumed={protein.consumed ?? 0} target={protein.target ?? 0} color="#4ade80" />
        <MacroBar label="Carbs"   consumed={carbs.consumed   ?? 0} target={carbs.target   ?? 0} color="#60a5fa" />
        <MacroBar label="Fats"    consumed={fats.consumed    ?? 0} target={fats.target     ?? 0} color="#fb923c" />
      </div>
    </div>
  );
};

const NUTRITION_GOALS = [
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'maintenance', label: 'Maintenance' },
];

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentary' },
  { value: 'moderate',  label: 'Moderate' },
  { value: 'active',    label: 'Active' },
];

const GENDER_OPTIONS = [
  { value: 'female', label: 'Female' },
  { value: 'male',   label: 'Male' },
];

const profileGoalToNutritionGoal = (goal) => {
  if (goal === 'gain_muscle') return 'muscle_gain';
  if (goal === 'lose_weight') return 'weight_loss';
  return 'maintenance';
};

const nutritionGoalLabel = (goal) =>
  ({ muscle_gain: 'Muscle Gain', weight_loss: 'Weight Loss', maintenance: 'Maintenance' }[goal] || goal);

const buildNutritionForm = (currentUser) => ({
  age: currentUser?.age ? String(currentUser.age) : '',
  weight: currentUser?.weight ? String(currentUser.weight) : '',
  height: currentUser?.height ? String(currentUser.height) : '',
  gender: '',
  activityLevel: 'sedentary',
  goal: profileGoalToNutritionGoal(currentUser?.goal),
});

const goalLabel = (goal) =>
  ({ lose_weight: 'Lose Weight', gain_muscle: 'Gain Muscle', maintain: 'Maintain', eat_healthy: 'Eat Healthy' }[goal] || goal);

const GOALS = ['lose_weight', 'gain_muscle', 'maintain', 'eat_healthy'];
const EMPTY_LOG = { foodName: '', calories: '', protein: '', carbs: '', fats: '' };

const BMI_COLORS = {
  blue:   { bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.3)',  text: '#60a5fa', badge: '#3b82f6' },
  green:  { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)',  text: '#10b981', badge: '#10b981' },
  yellow: { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  text: '#f59e0b', badge: '#f59e0b' },
  red:    { bg: 'rgba(244,63,94,0.1)',   border: 'rgba(244,63,94,0.3)',   text: '#f43f5e', badge: '#f43f5e' },
};

const bmiToAngle = (value) => {
  const clamped = Math.min(Math.max(value, 10), 40);
  return ((clamped - 10) / 30) * 180;
};

// ─── BMI Card ──────────────────────────────────────────────────────
const BmiCard = ({ bmi }) => {
  if (!bmi) {
    return (
      <div className="card bmi-card">
        <h2>📏 BMI Overview</h2>
        <p className="bmi-missing">
          Update your <strong>weight</strong> and <strong>height</strong> in your profile to see your BMI.
        </p>
      </div>
    );
  }

  const palette = BMI_COLORS[bmi.color] || BMI_COLORS.green;
  const angle   = bmiToAngle(bmi.value);
  const cx = 80, cy = 80, r = 60;
  const toRad  = (deg) => (deg * Math.PI) / 180;
  const needleX = cx + r * 0.75 * Math.cos(toRad(180 - angle));
  const needleY = cy - r * 0.75 * Math.sin(toRad(180 - angle));

  return (
    <div className="card bmi-card">
      <h2>📏 BMI Overview</h2>
      <div className="bmi-layout">
        <div className="bmi-gauge-wrap">
          <svg viewBox="0 0 160 90" className="bmi-gauge-svg">
            <path d="M20,80 A60,60 0 0,1 53,27"  stroke="rgba(59,130,246,0.5)"  strokeWidth="10" fill="none" strokeLinecap="round" />
            <path d="M53,27 A60,60 0 0,1 107,27"  stroke="rgba(16,185,129,0.5)" strokeWidth="10" fill="none" strokeLinecap="round" />
            <path d="M107,27 A60,60 0 0,1 133,55"  stroke="rgba(245,158,11,0.5)" strokeWidth="10" fill="none" strokeLinecap="round" />
            <path d="M133,55 A60,60 0 0,1 140,80"  stroke="rgba(244,63,94,0.5)"  strokeWidth="10" fill="none" strokeLinecap="round" />
            <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke={palette.badge} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx={cx} cy={cy} r="4" fill={palette.badge} />
            <text x={cx} y={cy + 18} textAnchor="middle" fontSize="14" fontWeight="800" fill="var(--text)">{bmi.value}</text>
          </svg>
          <div className="bmi-scale-labels">
            <span>10</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
          </div>
        </div>
        <div className="bmi-details">
          <div className="bmi-badge" style={{ background: palette.bg, border: `1px solid ${palette.border}`, color: palette.text }}>
            {bmi.category}
          </div>
          <p className="bmi-suggestion">{bmi.suggestion}</p>
        </div>
      </div>
    </div>
  );
};

// ─── Quick Action data ──────────────────────────────────────────────
const QUICK_ACTIONS = [
  { to: '/add-food',        icon: '➕', label: 'Add Food',       desc: 'Create a food record in your database.' },
  { to: '/upload',          icon: '📸', label: 'Upload Food',    desc: 'Analyze a meal photo with AI.' },
  { to: '/logs',            icon: '📋', label: 'Food Logs',      desc: 'Review today\'s meals and totals.' },
  { to: '/recommendations', icon: '⭐', label: 'Recs',           desc: 'Get personalized meal suggestions.' },
  { to: '/activity',        icon: '🏃', label: 'Activity',       desc: 'Track exercise and adjust calories.' },
  { to: '/profile',         icon: '👤', label: 'Profile',        desc: 'Update your nutrition goals.' },
];

// ─── Dashboard ─────────────────────────────────────────────────────
const Dashboard = () => {
  const { user, refreshUser } = useAuth();

  const [summary,     setSummary]     = useState(null);
  const [logs,        setLogs]        = useState([]);
  const [loadingPage, setLoadingPage] = useState(true);
  const [weeklyData,  setWeeklyData]  = useState([]);
  const [calorieGoal, setCalorieGoal] = useState(0);

  const [form,          setForm]          = useState(EMPTY_LOG);
  const [submitting,    setSubmitting]    = useState(false);
  const [deletingId,    setDeletingId]    = useState(null);
  const [editingId,     setEditingId]     = useState(null);
  const [editingForm,   setEditingForm]   = useState(null);
  const [savingEdit,    setSavingEdit]    = useState(false);

  const [editMode,      setEditMode]      = useState(false);
  const [profile,       setProfile]       = useState({});
  const [savingProfile, setSavingProfile] = useState(false);

  const [nutritionForm, setNutritionForm] = useState(() => buildNutritionForm(user));
  const [nutritionResult, setNutritionResult] = useState(null);
  const [calculatingNutrition, setCalculatingNutrition] = useState(false);

  const [error,       setError]       = useState('');
  const [success,     setSuccess]     = useState('');
  const [downloading, setDownloading] = useState(false);

  const fetchData = async () => {
    try {
      setLoadingPage(true);
      setError('');
      const res  = await getDashboardSummary();
      const data = res.data.data;
      if (!data) {
        setError('Failed to load dashboard data. Please refresh.');
        setSummary(null); setLogs([]); setWeeklyData([]);
        return;
      }
      setSummary(data);
      setLogs(data.meals?.entries ?? []);
      setWeeklyData(data.weekly?.trend ?? []);
      setCalorieGoal(data.weekly?.calorieGoal ?? 0);
    } catch (err) {
      setError(getErrorMessage(err, 'dashboard'));
      setSummary(null); setLogs([]); setWeeklyData([]);
    } finally {
      setLoadingPage(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name || '', age: user.age || '', weight: user.weight || '', height: user.height || '', goal: user.goal || 'maintain' });
      setNutritionForm((c) => ({
        ...c,
        age: user.age ? String(user.age) : c.age,
        weight: user.weight ? String(user.weight) : c.weight,
        height: user.height ? String(user.height) : c.height,
        goal: profileGoalToNutritionGoal(user.goal),
      }));
    }
  }, [user]);

  const handleLogChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSelectFood = (food) => {
    setForm({
      foodName: food.name,
      calories: String(food.calories ?? ''),
      protein:  String(food.protein  ?? ''),
      carbs:    String(food.carbs    ?? ''),
      fats:     String(food.fat      ?? ''),
    });
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!form.foodName?.trim()) { setError('Please enter a food name.'); return; }
    if (!form.calories || Number(form.calories) <= 0) { setError('Please enter calories (> 0).'); return; }
    setSubmitting(true);
    try {
      await addFoodLog({ ...form, foodName: form.foodName.trim(), calories: Number(form.calories), protein: Number(form.protein)||0, carbs: Number(form.carbs)||0, fats: Number(form.fats)||0 });
      setForm(EMPTY_LOG);
      setSuccess('Food logged!');
      setTimeout(() => setSuccess(''), 3000);
      await fetchData();
    } catch (err) { setError(getErrorMessage(err, 'food entry')); }
    finally       { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (deletingId) return;
    setDeletingId(id); setError('');
    try { await deleteFoodLog(id); await fetchData(); }
    catch (err) { setError(getErrorMessage(err, 'deletion')); }
    finally     { setDeletingId(null); }
  };

  const handleEditStart = (log) => {
    setEditingId(log._id);
    setEditingForm({ foodName: log.foodName||'', calories: String(log.calories||''), protein: String(log.protein||''), carbs: String(log.carbs||''), fats: String(log.fats||'') });
    setError('');
  };

  const handleEditChange = (e) => { if (!editingForm) return; setEditingForm({ ...editingForm, [e.target.name]: e.target.value }); };

  const handleEditSave = async () => {
    if (!editingId || !editingForm || savingEdit) return;
    if (!editingForm.foodName?.trim()) { setError('Please enter a food name.'); return; }
    if (!editingForm.calories || Number(editingForm.calories) <= 0) { setError('Calories must be > 0.'); return; }
    setSavingEdit(true); setError('');
    try {
      await updateFoodLog(editingId, { foodName: editingForm.foodName.trim(), calories: Number(editingForm.calories), protein: Number(editingForm.protein)||0, carbs: Number(editingForm.carbs)||0, fats: Number(editingForm.fats)||0 });
      setEditingId(null); setEditingForm(null);
      setSuccess('Updated!'); setTimeout(() => setSuccess(''), 3000);
      await fetchData();
    } catch (err) { setError(getErrorMessage(err, 'update')); }
    finally       { setSavingEdit(false); }
  };

  const handleEditCancel = () => { setEditingId(null); setEditingForm(null); setError(''); };

  const handleProfileChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (!profile.name?.trim() || profile.name.length < 2)                                { setError('Name must be at least 2 chars.'); return; }
    if (profile.age    && (Number(profile.age)    <  10  || Number(profile.age)    > 120)) { setError('Age 10–120.');        return; }
    if (profile.weight && (Number(profile.weight) <  20  || Number(profile.weight) > 300)) { setError('Weight 20–300 kg.');  return; }
    if (profile.height && (Number(profile.height) < 100  || Number(profile.height) > 250)) { setError('Height 100–250 cm.'); return; }
    setSavingProfile(true);
    try {
      await updateProfile({ name: profile.name.trim(), age: profile.age ? Number(profile.age) : undefined, weight: profile.weight ? Number(profile.weight) : undefined, height: profile.height ? Number(profile.height) : undefined, goal: profile.goal||'maintain' });
      await refreshUser(); await fetchData();
      setEditMode(false); setSuccess('Profile updated!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) { setError(getErrorMessage(err, 'profile')); }
    finally       { setSavingProfile(false); }
  };

  const handleNutritionChange = (e) => setNutritionForm({ ...nutritionForm, [e.target.name]: e.target.value });

  const handleNutritionSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!nutritionForm.age || !nutritionForm.weight || !nutritionForm.height || !nutritionForm.gender || !nutritionForm.activityLevel || !nutritionForm.goal) {
      setError('Please fill in all nutrition calculator fields.'); return;
    }
    setCalculatingNutrition(true);
    try {
      const res = await calculateNutrition({ age: Number(nutritionForm.age), weight: Number(nutritionForm.weight), height: Number(nutritionForm.height), gender: nutritionForm.gender, activityLevel: nutritionForm.activityLevel, goal: nutritionForm.goal });
      setNutritionResult(res.data.data);
      setSuccess('Nutrition plan updated!'); setTimeout(() => setSuccess(''), 2500);
    } catch (err) { setError(getErrorMessage(err, 'nutrition calculator')); }
    finally       { setCalculatingNutrition(false); }
  };

  const handleDownloadReport = async () => {
    setDownloading(true); setError('');
    try { await downloadWeeklyReport(); }
    catch (err) { setError(getErrorMessage(err, 'report generation')); }
    finally     { setDownloading(false); }
  };

  if (loadingPage) return <PageLoader />;

  const s = summary?.summary;

  return (
    <div className="dashboard-page">

      {/* ── Header ── */}
      <div className="dashboard-header">
        <div>
          <h1>Good day, <span className="greeting-name">{user?.name?.split(' ')[0]}!</span> 👋</h1>
          <p className="subtitle">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="dashboard-header-actions">
          {user?.goal && <span className="goal-badge">{goalLabel(user.goal)}</span>}
          <button
            id="download-report-btn"
            className={`btn-report ${downloading ? 'btn-report--loading' : ''}`}
            onClick={handleDownloadReport}
            disabled={downloading}
            title="Download weekly nutrition PDF report"
          >
            {downloading ? <><Spinner size="sm" /> Generating…</> : <>📄 Weekly Report</>}
          </button>
        </div>
      </div>

      {/* ── Alerts ── */}
      <Alert type="error"   message={error}   onDismiss={() => setError('')}   />
      <Alert type="success" message={success} onDismiss={() => setSuccess('')} />

      {/* ── Calorie Ring + Progress ── */}
      {s && (
        <CalorieProgress
          consumed={s.calories.consumed}
          target={s.calories.target}
          remaining={s.calories.remaining}
          mealsCount={summary?.meals?.count ?? 0}
        />
      )}

      {/* ── Weekly Trend ── */}
      <WeeklyChart data={weeklyData} calorieGoal={calorieGoal} loading={loadingPage} />

      {/* ── Macros ── */}
      {s && <MacroPanel protein={s.protein} carbs={s.carbs} fats={s.fats} />}

      {/* ── BMI ── */}
      <BmiCard bmi={summary?.bmi} />

      {/* ── Quick Actions ── */}
      <div className="card page-card">
        <h2>Quick Actions</h2>
        <div className="quick-actions-grid">
          {QUICK_ACTIONS.map(({ to, icon, label, desc }) => (
            <Link key={to + label} className="quick-action-card" to={to}>
              <div className="quick-action-icon">{icon}</div>
              <strong>{label}</strong>
              <span>{desc}</span>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
