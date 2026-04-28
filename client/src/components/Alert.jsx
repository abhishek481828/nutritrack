import { useState } from 'react';

/**
 * Alert — dismissible notification banner.
 * Props:
 *   type      — 'error' | 'success' | 'warning' | 'info'
 *   message   — string | React node
 *   onDismiss — optional callback; if omitted, no dismiss button shown
 */
const ICONS = {
  error:   '✕',
  success: '✓',
  warning: '⚠',
  info:    'ℹ',
};

const Alert = ({ type = 'error', message, onDismiss }) => {
  const [visible, setVisible] = useState(true);

  if (!visible || !message) return null;

  const dismiss = () => {
    setVisible(false);
    onDismiss?.();
  };

  return (
    <div className={`ui-alert ui-alert--${type}`} role="alert">
      <span className="ui-alert-icon">{ICONS[type]}</span>
      <span className="ui-alert-msg">{message}</span>
      {onDismiss !== undefined && (
        <button
          className="ui-alert-close"
          onClick={dismiss}
          aria-label="Dismiss"
          type="button"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default Alert;
