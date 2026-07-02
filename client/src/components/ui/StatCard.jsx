import React from 'react';

const StatCard = ({
  title,
  value,
  unit,
  icon,
  progress,
  progressColor = 'var(--primary)',
  statusText,
  statusColor,
  statusBg,
  className = '',
}) => {
  return (
    <div className={`card ${className}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
          {title}
        </span>
        {icon && <span style={{ fontSize: '1.2rem', opacity: 0.85 }}>{icon}</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem', marginBottom: '0.65rem' }}>
        <span style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text)', fontFamily: 'Outfit, sans-serif', lineHeight: 1.1 }}>
          {value}
        </span>
        {unit && <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>{unit}</span>}
      </div>

      {progress !== undefined && (
        <div className="progress-track" style={{ height: '6px', marginBottom: statusText ? '0.65rem' : '0' }}>
          <div
            className="progress-fill"
            style={{
              width: `${Math.min(Math.max(progress, 0), 100)}%`,
              background: progressColor,
              height: '100%',
              borderRadius: 'inherit'
            }}
          />
        </div>
      )}

      {statusText && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-xs)' }}>
          <span
            className="goal-badge"
            style={{
              background: statusBg || 'rgba(255,255,255,0.06)',
              color: statusColor || 'var(--text-muted)',
              padding: '0.2rem 0.6rem',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              fontSize: '0.68rem',
              fontWeight: 700,
              textTransform: 'uppercase'
            }}
          >
            {statusText}
          </span>
          {progress !== undefined && (
            <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{Math.round(progress)}%</span>
          )}
        </div>
      )}
    </div>
  );
};

export default StatCard;
