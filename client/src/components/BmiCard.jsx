import React from 'react';
import { motion } from 'framer-motion';

const BMI_COLORS = {
  blue:   { bg: 'rgba(59,130,246,0.1)',  border: 'rgba(59,130,246,0.3)',  text: '#60a5fa', badge: '#3b82f6' },
  green:  { bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.3)',  text: '#10b981', badge: '#10b981' },
  yellow: { bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.3)',  text: '#f59e0b', badge: '#f59e0b' },
  red:    { bg: 'rgba(244,63,94,0.1)',   border: 'rgba(244,63,94,0.3)',   text: '#f43f5e', badge: '#f43f5e' },
};

const bmiToAngle = (value) => {
  const clamped = Math.min(Math.max(value, 10), 40);
  return ((clamped - 10) / 30) * 180;
};

const BmiCard = ({ bmi }) => {
  if (!bmi) {
    return (
      <div className="card bmi-card">
        <h2>📏 BMI Overview</h2>
        <p className="bmi-missing">
          Update your <strong>weight</strong> and <strong>height</strong> in your profile to see your BMI.
        </p>
      </div>
    );
  }

  const palette = BMI_COLORS[bmi.color] || BMI_COLORS.green;
  const angle   = bmiToAngle(bmi.value);
  const cx = 80, cy = 80, r = 60;
  const toRad  = (deg) => (deg * Math.PI) / 180;
  const needleX = cx + r * 0.75 * Math.cos(toRad(180 - angle));
  const needleY = cy - r * 0.75 * Math.sin(toRad(180 - angle));

  return (
    <div className="card bmi-card">
      <h2>📏 BMI Overview</h2>
      <div className="bmi-layout">
        <div className="bmi-gauge-wrap">
          <svg viewBox="0 0 160 90" className="bmi-gauge-svg">
            <path d="M20,80 A60,60 0 0,1 53,27"  stroke="rgba(59,130,246,0.5)"  strokeWidth="10" fill="none" strokeLinecap="round" />
            <path d="M53,27 A60,60 0 0,1 107,27"  stroke="rgba(16,185,129,0.5)" strokeWidth="10" fill="none" strokeLinecap="round" />
            <path d="M107,27 A60,60 0 0,1 133,55"  stroke="rgba(245,158,11,0.5)" strokeWidth="10" fill="none" strokeLinecap="round" />
            <path d="M133,55 A60,60 0 0,1 140,80"  stroke="rgba(244,63,94,0.5)"  strokeWidth="10" fill="none" strokeLinecap="round" />
            <motion.line
              x1="80"
              y1="80"
              x2="35"
              y2="80"
              stroke={palette.badge}
              strokeWidth="2.5"
              strokeLinecap="round"
              initial={{ rotate: 0 }}
              animate={{ rotate: angle }}
              style={{ originX: '80px', originY: '80px' }}
              transition={{ type: 'spring', stiffness: 60, damping: 12, delay: 0.2 }}
            />
            <circle cx={cx} cy={cy} r="4" fill={palette.badge} />
            <text x={cx} y={cy + 18} textAnchor="middle" fontSize="14" fontWeight="800" fill="var(--text)">{bmi.value}</text>
          </svg>
          <div className="bmi-scale-labels">
            <span>10</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
          </div>
        </div>
        <div className="bmi-details">
          <div className="bmi-badge" style={{ background: palette.bg, border: `1px solid ${palette.border}`, color: palette.text }}>
            {bmi.category}
          </div>
          <p className="bmi-suggestion">{bmi.suggestion}</p>
        </div>
      </div>
    </div>
  );
};

export default BmiCard;
