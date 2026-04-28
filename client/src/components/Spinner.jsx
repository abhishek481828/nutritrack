/**
 * Spinner — gradient ring loading indicator.
 * Props:
 *   size   — 'sm' | 'md' (default) | 'lg'
 *   color  — CSS color string (overrides border-top-color)
 *   label  — accessible aria-label (default: "Loading")
 */
const Spinner = ({ size = 'md', color, label = 'Loading' }) => (
  <span
    className={`spinner spinner--${size}`}
    style={color ? { borderTopColor: color, borderRightColor: `${color}44` } : undefined}
    role="status"
    aria-label={label}
  />
);

export default Spinner;
