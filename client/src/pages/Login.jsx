import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errorHandler';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';

const Login = () => {
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.email?.trim() || !form.email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!form.password || form.password.length === 0) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(form);
      await loginUser(res.data.data.token);
      navigate('/dashboard');
    } catch (err) {
      const message = getErrorMessage(err, 'login');
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ── Left brand panel ── */}
      <div className="auth-brand-panel">
        {/* Decorative orbs */}
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />

        <div className="auth-brand-panel-logo">
          <div className="auth-brand-panel-mark">🥗</div>
          <span className="auth-brand-panel-name">NutriTrack</span>
        </div>

        <h2 className="auth-brand-panel-title">
          Track your nutrition,<br />
          <span>fuel your goals.</span>
        </h2>

        <p className="auth-brand-panel-sub">
          Log meals, monitor macros, and get AI-powered insights — all in one beautiful dashboard.
        </p>

        <div className="auth-brand-features">
          {[
            'Smart calorie & macro tracking',
            'AI meal photo analysis',
            'Personalized nutrition plans',
            'Weekly progress reports',
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
        <div className="auth-card">
          <h1>Welcome back</h1>
          <p className="auth-subtitle">Sign in to your NutriTrack account</p>

          <Alert type="error" message={error} onDismiss={() => setError('')} />

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              id="login-submit-btn"
              disabled={loading}
            >
              {loading ? <><Spinner size="sm" /> Signing in…</> : 'Sign In'}
            </button>
          </form>

          <p className="auth-footer">
            Don't have an account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
