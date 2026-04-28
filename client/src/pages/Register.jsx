import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errorHandler';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';

const GOALS = [
  { value: 'lose_weight', label: 'Lose Weight',    icon: '🔥' },
  { value: 'gain_muscle', label: 'Gain Muscle',    icon: '💪' },
  { value: 'maintain',    label: 'Maintain',       icon: '⚖️' },
  { value: 'eat_healthy', label: 'Eat Healthy',    icon: '🥗' },
];

const Register = () => {
  const navigate  = useNavigate();
  const { loginUser } = useAuth();

  const [form, setForm] = useState({
    name: '', email: '', password: '',
    age: '', weight: '', height: '', goal: 'maintain',
  });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleGoal = (value) => setForm({ ...form, goal: value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name?.trim() || form.name.length < 2) {
      setError('Name must be at least 2 characters.');
      return;
    }
    if (!form.email?.trim() || !form.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.age && (Number(form.age) < 10 || Number(form.age) > 120)) {
      setError('Age must be between 10 and 120.');
      return;
    }
    if (form.weight && (Number(form.weight) < 20 || Number(form.weight) > 300)) {
      setError('Weight must be between 20 kg and 300 kg.');
      return;
    }
    if (form.height && (Number(form.height) < 100 || Number(form.height) > 250)) {
      setError('Height must be between 100 cm and 250 cm.');
      return;
    }

    setLoading(true);
    try {
      const res = await register(form);
      await loginUser(res.data.data.token);
      navigate('/dashboard');
    } catch (err) {
      const message = getErrorMessage(err, 'registration');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ── Left brand panel ── */}
      <div className="auth-brand-panel">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />

        <div className="auth-brand-panel-logo">
          <div className="auth-brand-panel-mark">🥗</div>
          <span className="auth-brand-panel-name">NutriTrack</span>
        </div>

        <h2 className="auth-brand-panel-title">
          Start your journey<br />
          <span>to a healthier you.</span>
        </h2>

        <p className="auth-brand-panel-sub">
          Join thousands of people achieving their nutrition goals with smart tracking and AI-powered insights.
        </p>

        <div className="auth-brand-features">
          {[
            'Personalized calorie goals',
            'Macro breakdown & analysis',
            'AI food photo recognition',
            'Weekly progress PDF reports',
          ].map((f) => (
            <div key={f} className="auth-brand-feature">
              <span className="auth-brand-feature-dot" />
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-form-panel">
        <div className="auth-card auth-card-wide">
          <h1>Create account</h1>
          <p className="auth-subtitle">Start tracking your nutrition today — it's free</p>

          <Alert type="error" message={error} onDismiss={() => setError('')} />

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name" type="text" name="name"
                  placeholder="Jane Doe"
                  value={form.name} onChange={handleChange}
                  required disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email" type="email" name="email"
                  placeholder="you@example.com"
                  value={form.email} onChange={handleChange}
                  required disabled={loading} autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password" type="password" name="password"
                placeholder="Minimum 6 characters"
                value={form.password} onChange={handleChange}
                required disabled={loading} autoComplete="new-password"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="age">Age</label>
                <input
                  id="age" type="number" name="age" min="10" max="120"
                  placeholder="25"
                  value={form.age} onChange={handleChange} disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="weight">Weight (kg)</label>
                <input
                  id="weight" type="number" name="weight" min="20" max="300"
                  placeholder="70"
                  value={form.weight} onChange={handleChange} disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="height">Height (cm)</label>
                <input
                  id="height" type="number" name="height" min="100" max="250"
                  placeholder="170"
                  value={form.height} onChange={handleChange} disabled={loading}
                />
              </div>
            </div>

            {/* Goal pill selector */}
            <div className="form-group">
              <label>Your Goal</label>
              <div className="goal-pill-grid">
                {GOALS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    className={`goal-pill${form.goal === g.value ? ' goal-pill--active' : ''}`}
                    onClick={() => handleGoal(g.value)}
                    disabled={loading}
                  >
                    <span className="goal-pill-icon">{g.icon}</span>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              id="register-submit-btn"
              className="btn btn-primary btn-full btn-lg"
              disabled={loading}
            >
              {loading ? <><Spinner size="sm" /> Creating account…</> : 'Create Account'}
            </button>
          </form>

          <p className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
