const clampPercent = (value) => {
  const numberValue = Number(value) || 0;
  return Math.min(100, Math.max(0, Math.round(numberValue)));
};

const ProgressRow = ({ label, consumed, target, unit }) => {
  const safeTarget = Number(target) || 0;
  const safeConsumed = Number(consumed) || 0;
  const percent = safeTarget > 0 ? clampPercent((safeConsumed / safeTarget) * 100) : 0;
  const suffix = unit ? ` ${unit}` : '';

  return (
    <div className="coach-progress-row">
      <div className="coach-progress-head">
        <span>{label}</span>
        <strong>
          {Math.round(safeConsumed)}{suffix} / {Math.round(safeTarget)}{suffix}
        </strong>
      </div>
      <div className="coach-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <div className="coach-progress-fill" style={{ width: `${percent}%` }} />
      </div>
      <small>{safeTarget > 0 ? `${percent}% complete` : 'No target data available'}</small>
    </div>
  );
};

const ProgressPanel = ({ progress }) => {
  return (
    <section className="coach-card">
      <h3>Daily Progress</h3>
      <div className="coach-progress-grid">
        <ProgressRow label="Calories" consumed={progress.calories.consumed} target={progress.calories.target} unit="kcal" />
        <ProgressRow label="Protein" consumed={progress.protein.consumed} target={progress.protein.target} unit="g" />
        <ProgressRow label="Carbs" consumed={progress.carbs.consumed} target={progress.carbs.target} unit="g" />
        <ProgressRow label="Fat" consumed={progress.fat.consumed} target={progress.fat.target} unit="g" />
      </div>
    </section>
  );
};

export default ProgressPanel;
