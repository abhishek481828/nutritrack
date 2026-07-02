import React from 'react';
import Spinner from '../Spinner';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  icon,
  ...props
}) => {
  const btnClass = [
    'btn',
    `btn-${variant}`,
    size !== 'md' ? `btn-${size}` : '',
    fullWidth ? 'btn-full' : '',
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={btnClass}
      disabled={disabled || loading}
      onClick={onClick}
      aria-busy={loading}
      aria-live="polite"
      {...props}
    >
      {loading ? (
        <>
          <Spinner size="sm" />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span className="btn-icon-slot">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;
