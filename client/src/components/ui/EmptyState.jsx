import React from 'react';

/**
 * EmptyState — shown when a list/section has no data.
 * Props:
 *   icon      — emoji or string (default: '📭')
 *   title     — bold heading
 *   message   — supporting text
 *   action    — optional { label, onClick } for a CTA button
 */
const EmptyState = ({
  icon = '📭',
  title = 'Nothing here yet',
  message,
  action,
}) => {
  return (
    <div className="empty-state">
      <span className="empty-state-icon" role="img" aria-label={title}>
        {icon}
      </span>
      <p className="empty-state-title">{title}</p>
      {message && <p className="empty-state-msg">{message}</p>}
      {action && (
        <button
          className="btn btn-primary"
          style={{ marginTop: '0.5rem' }}
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
