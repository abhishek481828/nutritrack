import React from 'react';

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
          <svg width="130" height="130" viewBox="0 0 130 130" aria-hidden="true">
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
              style={{
                transition: 'stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)',
                filter: `drop-shadow(0 2px 6px ${status.accent}66)`
              }}
            />
            <defs>
              <linearGradient id="calGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={status.accent} />
                <stop offset="100%" stopColor={over ? '#f43f5e' : pct >= 85 ? '#fb923c' : '#06b6d4'} />
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
          <div className="cal-bar-wrap" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label="Today's calorie intake progress">
            <div
              className="cal-bar-fill"
              style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${status.accent}88, ${status.accent})` }}
            />
          </div>

          {/* Bottom row */}
          <div className="cal-bottom-row">
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

export default CalorieProgress;
