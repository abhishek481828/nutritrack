import React from 'react';

const MacroBar = ({ label, consumed = 0, target = 0, unit = 'g', color }) => {
  const pct = target > 0 ? Math.min(Math.round((consumed / target) * 100), 100) : 0;
  return (
    <div className="macro-bar">
      <div className="macro-bar-header">
        <div className="macro-bar-label">
          <span className="macro-dot" style={{ background: color }} />
          <span>{label}</span>
        </div>
        <span className="macro-bar-values">
          <strong>{consumed}{unit}</strong>
          <span className="macro-of"> / {target}{unit}</span>
        </span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
      </div>
      <span className="pct-label">{pct}%</span>
    </div>
  );
};

const MacroPanel = ({ protein = {}, carbs = {}, fats = {} }) => {
  const totalKcal =
    (protein.consumed || 0) * 4 +
    (carbs.consumed   || 0) * 4 +
    (fats.consumed    || 0) * 9;

  const pPct = totalKcal > 0 ? ((protein.consumed * 4) / totalKcal) * 100 : 33;
  const cPct = totalKcal > 0 ? ((carbs.consumed   * 4) / totalKcal) * 100 : 34;
  const fPct = totalKcal > 0 ? ((fats.consumed    * 9) / totalKcal) * 100 : 33;

  return (
    <div className="card">
      <h2>Macronutrients</h2>
      <div className="macro-overview-bar" title="Today's macro split">
        <div className="macro-seg seg-protein" style={{ width: `${pPct}%` }} />
        <div className="macro-seg seg-carbs"   style={{ width: `${cPct}%` }} />
        <div className="macro-seg seg-fats"    style={{ width: `${fPct}%` }} />
      </div>
      <div className="macro-legend">
        <span className="macro-legend-item"><span className="macro-dot" style={{ background: '#4ade80' }} />Protein {Math.round(pPct)}%</span>
        <span className="macro-legend-item"><span className="macro-dot" style={{ background: '#60a5fa' }} />Carbs {Math.round(cPct)}%</span>
        <span className="macro-legend-item"><span className="macro-dot" style={{ background: '#fb923c' }} />Fats {Math.round(fPct)}%</span>
      </div>
      <div className="macro-bars-list">
        <MacroBar label="Protein" consumed={protein.consumed ?? 0} target={protein.target ?? 0} color="#4ade80" />
        <MacroBar label="Carbs"   consumed={carbs.consumed   ?? 0} target={carbs.target   ?? 0} color="#60a5fa" />
        <MacroBar label="Fats"    consumed={fats.consumed    ?? 0} target={fats.target     ?? 0} color="#fb923c" />
      </div>
    </div>
  );
};

export default MacroPanel;
export { MacroBar };
