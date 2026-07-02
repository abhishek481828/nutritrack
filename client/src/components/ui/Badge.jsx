import React from 'react';

const Badge = ({
  children,
  variant = 'primary',
  className = '',
  ...props
}) => {
  const badgeClass = [
    'goal-badge', // Reuses the premium pill style from index.css
    className,
  ].filter(Boolean).join(' ');

  // Dynamic styling mapping based on variant
  const styles = {
    primary: { background: 'var(--primary-light)', color: 'var(--primary)', borderColor: 'rgba(16,185,129,0.25)' },
    secondary: { background: 'var(--secondary-light)', color: 'var(--secondary)', borderColor: 'rgba(139,92,246,0.25)' },
    success: { background: 'var(--success-light)', color: 'var(--success)', borderColor: 'rgba(16,185,129,0.25)' },
    danger: { background: 'var(--danger-light)', color: 'var(--danger)', borderColor: 'rgba(244,63,94,0.25)' },
    warning: { background: 'var(--warning-light)', color: 'var(--warning)', borderColor: 'rgba(245,158,11,0.25)' },
    info: { background: 'var(--info-light)', color: 'var(--info)', borderColor: 'rgba(56,189,248,0.25)' },
  };

  const currentStyle = styles[variant] || styles.primary;

  return (
    <span
      className={badgeClass}
      style={{
        background: currentStyle.background,
        color: currentStyle.color,
        borderColor: currentStyle.borderColor,
        borderStyle: 'solid',
        borderWidth: '1px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...props.style
      }}
      {...props}
    >
      {children}
    </span>
  );
};

export default Badge;
