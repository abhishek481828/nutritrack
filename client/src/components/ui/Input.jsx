import React from 'react';

const Input = ({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  const inputId = id || `input-${label ? label.replace(/\s+/g, '-').toLowerCase() : 'field'}`;
  const helperId = `${inputId}-helper`;
  const errorId = `${inputId}-error`;
  const describedBy = [
    error ? errorId : null,
    helperText ? helperId : null
  ].filter(Boolean).join(' ');

  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label htmlFor={inputId}>
          {label} {required && <span style={{ color: 'var(--danger)' }} aria-hidden="true">*</span>}
        </label>
      )}
      <input
        type={type}
        id={inputId}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={error ? 'input-error' : ''}
        aria-invalid={!!error}
        aria-describedby={describedBy || undefined}
        {...props}
      />
      {error && (
        <span id={errorId} style={{ fontSize: 'var(--text-xs)', color: 'var(--danger)', marginTop: '2px' }} role="alert">
          ⚠️ {error}
        </span>
      )}
      {!error && helperText && (
        <span id={helperId} style={{ fontSize: 'var(--text-xs)', color: 'var(--text-light)', marginTop: '2px' }}>
          {helperText}
        </span>
      )}
    </div>
  );
};

export default Input;
