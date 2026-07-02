import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile, getBMI } from '../services/authService';
import { getErrorMessage } from '../utils/errorHandler';
import Alert from '../components/Alert';
import Spinner from '../components/Spinner';
import PageTransition from '../components/ui/PageTransition';

const GOALS = [
  { value: 'lose_weight', label: 'Lose Weight' },
  { value: 'gain_muscle', label: 'Gain Muscle' },
  { value: 'maintain', label: 'Maintain Weight' },
  { value: 'eat_healthy', label: 'Eat Healthy' },
];

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    weight: '',
    height: '',
    goal: 'maintain',
  });
  const [bmi, setBmi] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingBmi, setLoadingBmi] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const profileCompletion = useMemo(() => {
    const fields = [profile.name, profile.age, profile.weight, profile.height, profile.goal];
    const filled = fields.filter((value) => String(value ?? '').trim() !== '').length;
    return Math.round((filled / fields.length) * 100);
  }, [profile]);

  const profileStats = useMemo(() => ([
    { label: 'Name', value: profile.name || 'Not set' },
    { label: 'Goal', value: profile.goal.replace(/_/g, ' ') },
    { label: 'Age', value: profile.age ? `${profile.age} yrs` : '—' },
    { label: 'Body', value: `${profile.weight || '—'} kg • ${profile.height || '—'} cm` },
  ]), [profile]);

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        age: user.age || '',
        weight: user.weight || '',
        height: user.height || '',
        goal: user.goal || 'maintain',
      });
    }
  }, [user]);

  useEffect(() => {
    const loadBmi = async () => {
      if (!user?.weight || !user?.height) {
        setBmi(null);
        return;
      }

      setLoadingBmi(true);
      try {
        const res = await getBMI();
        setBmi(res.data.data);
      } catch {
        setBmi(null);
      } finally {
        setLoadingBmi(false);
      }
    };

    loadBmi();
  }, [user]);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!profile.name.trim()) {
      setError('Please enter your name.');
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: profile.name.trim(),
        age: profile.age ? Number(profile.age) : undefined,
        weight: profile.weight ? Number(profile.weight) : undefined,
        height: profile.height ? Number(profile.height) : undefined,
        goal: profile.goal,
      });
      await refreshUser();
      setSuccess('Profile updated successfully.');
      setTimeout(() => setSuccess(''), 2500);
    } catch (err) {
      setError(getErrorMessage(err, 'profile update'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition>
    <div className="page-shell profile-page">
      <div className="page-header card profile-page-header">
        <div>
          <p className="page-kicker">Account</p>
          <h1 className="profile-page-title">Profile</h1>
          <p className="page-subtitle profile-page-subtitle">Keep your personal nutrition data current so recommendations stay accurate.</p>
          <div className="profile-header-meta">
            <span className="profile-meta-pill">Profile {profileCompletion}% complete</span>
            <span className="profile-meta-pill profile-meta-pill--accent">Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}</span>
          </div>
        </div>
      </div>

      <Alert type="error" message={error} onDismiss={() => setError('')} />
      <Alert type="success" message={success} onDismiss={() => setSuccess('')} />

      <div className="page-two-column profile-layout">
        <div className="card page-card profile-card profile-form-card">
          <div className="profile-card-head">
            <div>
              <p className="page-kicker">Edit Details</p>
              <h2>Personal Details</h2>
            </div>
            <span className="profile-card-badge">Ready to update</span>
          </div>
          <form className="page-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="profile-name">Name</label>
                <input id="profile-name" name="name" value={profile.name} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="profile-age">Age</label>
                <input id="profile-age" type="number" name="age" value={profile.age} onChange={handleChange} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="profile-weight">Weight (kg)</label>
                <input id="profile-weight" type="number" name="weight" value={profile.weight} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="profile-height">Height (cm)</label>
                <input id="profile-height" type="number" name="height" value={profile.height} onChange={handleChange} />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="profile-goal">Goal</label>
              <select id="profile-goal" name="goal" value={profile.goal} onChange={handleChange}>
                {GOALS.map((goal) => (
                  <option key={goal.value} value={goal.value}>{goal.label}</option>
                ))}
              </select>
            </div>
            <div className="page-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><Spinner size="sm" /> Saving…</> : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        <div className="profile-side-column">
          <div className="card page-card profile-card profile-side-card">
            <div className="profile-side-top">
              <div className="profile-avatar">{(profile.name || user?.name || 'U').charAt(0).toUpperCase()}</div>
              <div>
                <p className="page-kicker">Profile Summary</p>
                <h2>{profile.name || user?.name || 'Your profile'}</h2>
                <p className="profile-side-email">{user?.email || '—'}</p>
              </div>
            </div>

            <div className="profile-completion-wrap">
              <div className="profile-completion-head">
                <span>Profile completion</span>
                <strong>{profileCompletion}%</strong>
              </div>
              <div className="profile-completion-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={profileCompletion}>
                <div className="profile-completion-fill" style={{ width: `${profileCompletion}%` }} />
              </div>
            </div>

            <div className="profile-stat-grid">
              {profileStats.map((stat) => (
                <div className="profile-stat-card" key={stat.label}>
                  <span>{stat.label}</span>
                  <strong>{stat.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="card page-card profile-card profile-insight-card">
            <h2>Current Snapshot</h2>
            <div className="profile-summary-grid">
              <div className="summary-tile">
                <span>Email</span>
                <strong>{user?.email || '—'}</strong>
              </div>
              <div className="summary-tile">
                <span>Goal</span>
                <strong>{profile.goal.replace(/_/g, ' ')}</strong>
              </div>
              <div className="summary-tile">
                <span>Height</span>
                <strong>{profile.height ? `${profile.height} cm` : '—'}</strong>
              </div>
              <div className="summary-tile">
                <span>Weight</span>
                <strong>{profile.weight ? `${profile.weight} kg` : '—'}</strong>
              </div>
            </div>
            <div className="page-note-card profile-note-card">
              <p className="profile-note-text">
                {loadingBmi
                  ? 'Loading BMI…'
                  : bmi?.value && bmi?.category
                    ? `BMI ${bmi.value} · ${bmi.category}`
                    : 'Add your height and weight to calculate BMI and improve recommendations.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    </PageTransition>
  );
};

export default Profile;
