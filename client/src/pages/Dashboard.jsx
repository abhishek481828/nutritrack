import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardSummary } from '../services/dashboardService';
import { downloadWeeklyReport } from '../services/reportService';
import { getErrorMessage } from '../utils/errorHandler';
import Alert       from '../components/Alert';
import Spinner     from '../components/Spinner';
import PageLoader  from '../components/PageLoader';
import WeeklyChart from '../components/WeeklyChart';
import CalorieProgress from '../components/CalorieProgress';
import MacroPanel from '../components/MacroPanel';
import BmiCard from '../components/BmiCard';
import StatCard from '../components/ui/StatCard';
import { motion } from 'framer-motion';
import PageTransition from '../components/ui/PageTransition';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15
    }
  }
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

const goalLabel = (goal) =>
  ({ lose_weight: 'Lose Weight', gain_muscle: 'Gain Muscle', maintain: 'Maintain', eat_healthy: 'Eat Healthy' }[goal] || goal);

// ─── Dashboard ─────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();

  const [summary,     setSummary]     = useState(null);
  const [loadingPage, setLoadingPage] = useState(true);
  const [weeklyData,  setWeeklyData]  = useState([]);
  const [calorieGoal, setCalorieGoal] = useState(0);

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
        setSummary(null); setWeeklyData([]);
        return;
      }
      setSummary(data);
      setWeeklyData(data.weekly?.trend ?? []);
      setCalorieGoal(data.weekly?.calorieGoal ?? 0);
    } catch (err) {
      setError(getErrorMessage(err, 'dashboard'));
      setSummary(null); setWeeklyData([]);
    } finally {
      setLoadingPage(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDownloadReport = async () => {
    setDownloading(true);
    setError('');
    try {
      await downloadWeeklyReport();
      setSuccess('Report downloaded successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(getErrorMessage(err, 'report generation'));
    } finally {
      setDownloading(false);
    }
  };

  if (loadingPage) return <PageLoader />;

  const s = summary?.summary;

  return (
    <PageTransition>
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

      {/* ── Stats Grid ── */}
      {s && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="dashboard-stats-grid"
        >
          <motion.div variants={itemVariants}>
            <StatCard
              title="Calories"
              value={s.calories.consumed}
              unit={`/ ${s.calories.target} kcal`}
              icon="🔥"
              progress={s.calories.target > 0 ? (s.calories.consumed / s.calories.target) * 100 : 0}
              progressColor="var(--primary)"
              statusText={s.calories.remaining >= 0 ? `${s.calories.remaining.toLocaleString()} left` : `${Math.abs(s.calories.remaining).toLocaleString()} over`}
              statusColor={s.calories.remaining >= 0 ? 'var(--success)' : 'var(--danger)'}
              statusBg={s.calories.remaining >= 0 ? 'var(--success-light)' : 'var(--danger-light)'}
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard
              title="Protein"
              value={s.protein.consumed}
              unit={`/ ${s.protein.target}g`}
              icon="🍗"
              progress={s.protein.target > 0 ? (s.protein.consumed / s.protein.target) * 100 : 0}
              progressColor="#4ade80"
              statusText="Daily Target"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard
              title="Carbs"
              value={s.carbs.consumed}
              unit={`/ ${s.carbs.target}g`}
              icon="🍞"
              progress={s.carbs.target > 0 ? (s.carbs.consumed / s.carbs.target) * 100 : 0}
              progressColor="#60a5fa"
              statusText="Daily Target"
            />
          </motion.div>
          <motion.div variants={itemVariants}>
            <StatCard
              title="Fats"
              value={s.fats.consumed}
              unit={`/ ${s.fats.target}g`}
              icon="🥑"
              progress={s.fats.target > 0 ? (s.fats.consumed / s.fats.target) * 100 : 0}
              progressColor="#fb923c"
              statusText="Daily Target"
            />
          </motion.div>
        </motion.div>
      )}

      {/* ── Dashboard Grid ── */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="dashboard-grid"
      >
        <div className="dashboard-main">
          {/* ── Calorie Ring + Progress ── */}
          {s && (
            <motion.div variants={itemVariants}>
              <CalorieProgress
                consumed={s.calories.consumed}
                target={s.calories.target}
                remaining={s.calories.remaining}
                mealsCount={summary?.meals?.count ?? 0}
              />
            </motion.div>
          )}

          {/* ── Weekly Trend ── */}
          <motion.div variants={itemVariants}>
            <WeeklyChart data={weeklyData} calorieGoal={calorieGoal} loading={loadingPage} />
          </motion.div>
        </div>

        <div className="dashboard-sidebar">
          {/* ── BMI ── */}
          <motion.div variants={itemVariants}>
            <BmiCard bmi={summary?.bmi} />
          </motion.div>

          {/* ── Macros ── */}
          {s && (
            <motion.div variants={itemVariants}>
              <MacroPanel protein={s.protein} carbs={s.carbs} fats={s.fats} />
            </motion.div>
          )}

          {/* ── Quick Actions ── */}
          <motion.div variants={itemVariants}>
            <div className="card page-card quick-actions-card-panel">
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
          </motion.div>
        </div>
      </motion.div>

      </div>
    </PageTransition>
  );
};

export default Dashboard;
