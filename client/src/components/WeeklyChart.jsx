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
import EmptyState from './EmptyState';

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
        {calorieGoal > 0 && (
          <span className="weekly-chart-goal-badge">
            🎯 {calorieGoal.toLocaleString()} kcal goal
          </span>
        )}
      </div>

      {!hasData ? (
        <EmptyState
          icon="📈"
          title="No data yet"
          message="Start logging food to see your weekly calorie trend."
        />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="calGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#4f46e5" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}    />
              </linearGradient>
              <linearGradient id="proGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="carbGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
              </linearGradient>
              <linearGradient id="fatGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f97316" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0}   />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />

            <XAxis
              dataKey="day"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={false}
              tickLine={false}
            />

            <YAxis
              tick={{ fontSize: 11, fill: '#6b7280' }}
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
                stroke="#4f46e5"
                strokeDasharray="5 4"
                strokeOpacity={0.5}
                label={{
                  value: 'Goal',
                  position: 'insideTopRight',
                  fontSize: 11,
                  fill: '#4f46e5',
                  dy: -4,
                }}
              />
            )}

            {/* Main calorie area */}
            <Area
              type="monotone"
              dataKey="calories"
              name="Calories"
              stroke="#4f46e5"
              strokeWidth={2.5}
              fill="url(#calGrad)"
              dot={{ r: 3, fill: '#4f46e5', strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />

            {/* Optional macro areas */}
            {showMacros && (
              <>
                <Area type="monotone" dataKey="protein" name="Protein"
                  stroke="#22c55e" strokeWidth={1.5} fill="url(#proGrad)"
                  dot={false} />
                <Area type="monotone" dataKey="carbs" name="Carbs"
                  stroke="#3b82f6" strokeWidth={1.5} fill="url(#carbGrad)"
                  dot={false} />
                <Area type="monotone" dataKey="fats" name="Fats"
                  stroke="#f97316" strokeWidth={1.5} fill="url(#fatGrad)"
                  dot={false} />
              </>
            )}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default WeeklyChart;
