import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Legend,
} from 'recharts';
import EmptyState from './ui/EmptyState';

// ─── Custom tooltip ────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color }} className="chart-tooltip-row">
          <span>{p.name}</span>
          <strong>{Math.round(p.value)}{p.dataKey === 'calories' ? ' kcal' : 'g'}</strong>
        </p>
      ))}
    </div>
  );
};

// ─── Legend label formatter ────────────────────────────────────────
const formatLegend = (value) =>
  value.charAt(0).toUpperCase() + value.slice(1);

// ─── WeeklyChart ───────────────────────────────────────────────────
/**
 * Reusable weekly nutrition area chart.
 * Props:
 *   data        — Array of { day, date, calories, protein, carbs, fats }
 *   calorieGoal — number (draws a dashed reference line)
 *   showMacros  — bool — toggle protein/carbs/fats areas (default: false)
 *   loading     — bool
 */
const WeeklyChart = ({ data = [], calorieGoal = 0, showMacros = false, loading = false }) => {
  const [localShowMacros, setLocalShowMacros] = useState(showMacros);
  const hasData = data.some((d) => d.calories > 0);

  if (loading) {
    return (
      <div className="card weekly-chart-card">
        <div className="weekly-chart-header">
          <h2>7-Day Calorie Trend</h2>
        </div>
        <div className="weekly-chart-skeleton" />
      </div>
    );
  }

  return (
    <div className="card weekly-chart-card">
      <div className="weekly-chart-header">
        <div>
          <h2>7-Day Calorie Trend</h2>
          <p className="weekly-chart-sub">
            Your calorie intake over the last 7 days
            {calorieGoal > 0 && ` — goal: ${calorieGoal.toLocaleString()} kcal/day`}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={localShowMacros}
              onChange={(e) => setLocalShowMacros(e.target.checked)}
              style={{ accentColor: 'var(--success)', cursor: 'pointer' }}
            />
            Show Macros
          </label>
          {calorieGoal > 0 && (
            <span className="weekly-chart-goal-badge">
              🎯 {calorieGoal.toLocaleString()} kcal goal
            </span>
          )}
        </div>
      </div>

      {!hasData ? (
        <EmptyState
          icon="📈"
          title="No data yet"
          message="Start logging food to see your weekly calorie trend."
        />
      ) : (
        <div role="img" aria-label="7-Day Calorie Trend Area Chart">
          <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--secondary)" stopOpacity={0.25} />
                <stop offset="95%" stopColor="var(--secondary)" stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="proGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--success)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--success)" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="carbGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--info)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--info)" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="var(--warning)" stopOpacity={0.2} />
                <stop offset="95%" stopColor="var(--warning)" stopOpacity={0}   />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.4} vertical={false} />

            <XAxis
              dataKey="day"
              tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
              axisLine={false}
              tickLine={false}
              width={40}
              tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(1)}k` : v}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend formatter={formatLegend} iconType="circle" iconSize={8} />

            {/* Dashed calorie goal reference line */}
            {calorieGoal > 0 && (
              <ReferenceLine
                y={calorieGoal}
                stroke="var(--secondary)"
                strokeDasharray="5 4"
                strokeOpacity={0.5}
                label={{
                  value: 'Goal',
                  position: 'insideTopRight',
                  fontSize: 10,
                  fill: 'var(--secondary)',
                  dy: -4,
                }}
              />
            )}

            {/* Main calorie area */}
            <Area
              type="monotone"
              dataKey="calories"
              name="Calories"
              stroke="var(--secondary)"
              strokeWidth={2.5}
              fill="url(#calGrad)"
              dot={{ r: 3, fill: 'var(--secondary)', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />

            {/* Optional macro areas */}
            {localShowMacros && (
              <>
                <Area type="monotone" dataKey="protein" name="Protein"
                  stroke="var(--success)" strokeWidth={1.5} fill="url(#proGrad)"
                  dot={false} />
                <Area type="monotone" dataKey="carbs" name="Carbs"
                  stroke="var(--info)" strokeWidth={1.5} fill="url(#carbGrad)"
                  dot={false} />
                <Area type="monotone" dataKey="fats" name="Fats"
                  stroke="var(--warning)" strokeWidth={1.5} fill="url(#fatGrad)"
                  dot={false} />
              </>
            )}
          </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default WeeklyChart;
