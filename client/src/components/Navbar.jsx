import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

/* ── Nav icon SVGs ─────────────────────────────────────────────────── */
const IconDashboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
  </svg>
);

const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
  </svg>
);

const IconUpload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);

const IconLogs = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
    <line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/>
    <line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
  </svg>
);

const IconStar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const IconActivity = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);

const IconUser = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconSun = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const IconMoon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

const NAV_LINKS = [
  { to: '/dashboard',      label: 'Dashboard',     icon: <IconDashboard /> },
  { to: '/add-food',       label: 'Add Food',      icon: <IconPlus /> },
  { to: '/upload',         label: 'Upload',        icon: <IconUpload /> },
  { to: '/logs',           label: 'Logs',          icon: <IconLogs /> },
  { to: '/recommendations',label: 'Recs',          icon: <IconStar /> },
  { to: '/activity',       label: 'Activity',      icon: <IconActivity /> },
  { to: '/profile',        label: 'Profile',       icon: <IconUser /> },
];

const Navbar = () => {
  const { user, logoutUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutUser();
    setMenuOpen(false);
    navigate('/login');
  };

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  /* Get initials for avatar */
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <nav className="navbar" aria-label="Global navigation">
      {/* Brand */}
      <div className="navbar-brand-wrap">
        <Link to={user ? '/dashboard' : '/login'} className="navbar-brand">
          <span className="navbar-brand-mark">🥗</span>
          <span className="navbar-brand-text">NutriTrack</span>
        </Link>
      </div>

      {/* Hamburger */}
      <button
        type="button"
        className="navbar-toggle"
        onClick={() => setMenuOpen(o => !o)}
        aria-label="Toggle navigation"
        aria-expanded={menuOpen}
        aria-controls="main-navigation"
      >
        <span /><span /><span />
      </button>

      {/* Links */}
      <div id="main-navigation" className={`navbar-links ${menuOpen ? 'navbar-links--open' : ''}`}>
        {user ? (
          <>
            {NAV_LINKS.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}
              >
                {icon}{label}
              </NavLink>
            ))}

            <div className="navbar-utilities">
              <div className="navbar-avatar" title={user.name}>{initials}</div>
              <span className="navbar-user-name">{user.name?.split(' ')[0]}</span>
              <button onClick={toggleTheme} className="btn-icon navbar-theme-btn" title="Toggle theme" aria-label="Toggle theme" type="button">
                {theme === 'dark' ? <IconSun /> : <IconMoon />}
              </button>
              <button onClick={handleLogout} className="btn btn-sm btn-outline" type="button">
                Logout
              </button>
            </div>
          </>
        ) : (
          <>
            <NavLink to="/login"    className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}>Login</NavLink>
            <NavLink to="/register" className={({ isActive }) => `nav-link ${isActive ? 'nav-link--active' : ''}`}>Register</NavLink>
            <button onClick={toggleTheme} className="btn-icon navbar-theme-btn" title="Toggle theme" aria-label="Toggle theme" type="button">
              {theme === 'dark' ? <IconSun /> : <IconMoon />}
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
