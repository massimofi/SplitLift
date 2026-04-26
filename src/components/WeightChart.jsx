// Weight-over-time line chart. Lazy-loaded by GeneralTab via React.lazy so
// recharts (~120 KB gzipped) only ships when the user opens General.

import React, { useMemo } from 'react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, Tooltip, CartesianGrid,
} from 'recharts';

const KG_TO_LB = 2.20462;

function fmtMonth(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', { month: 'short' });
}

function ChartTip({ active, payload, label, unit }) {
  if (!active || !payload || !payload.length) return null;
  const v = payload[0].value;
  return (
    <div className="wc-tip">
      <div className="wc-tip-d mono">{label}</div>
      <div className="wc-tip-v">{v.toFixed(1)} <span>{unit}</span></div>
    </div>
  );
}

export default function WeightChart({ data, unit = 'kg' }) {
  const series = useMemo(() => {
    if (!Array.isArray(data) || data.length === 0) return [];
    // Sort ascending by date — recharts assumes left-to-right time order.
    return [...data]
      .filter(p => p && p.date && typeof p.kg === 'number')
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(p => ({
        date: p.date,
        weight: unit === 'lb' ? p.kg * KG_TO_LB : p.kg,
      }));
  }, [data, unit]);

  if (series.length === 0) {
    return <div className="wc-empty">No weight logged yet.</div>;
  }
  if (series.length === 1) {
    return <div className="wc-empty">Log a few more weigh-ins to see your trend.</div>;
  }

  return (
    <div className="wc-host">
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={series} margin={{ top: 10, right: 12, bottom: 0, left: 12 }}>
          <defs>
            <linearGradient id="wcStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%"   stopColor="var(--accent)"/>
              <stop offset="100%" stopColor="var(--accent-2)"/>
            </linearGradient>
          </defs>
          <CartesianGrid stroke="transparent"/>
          <XAxis
            dataKey="date"
            tickFormatter={fmtMonth}
            tick={{ fill: 'var(--ink-3)', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
            axisLine={false} tickLine={false}
            interval="preserveStartEnd"
            minTickGap={28}
          />
          <Tooltip content={<ChartTip unit={unit}/>} cursor={{ stroke: 'var(--accent)', strokeOpacity: 0.4 }}/>
          <Line
            type="monotone"
            dataKey="weight"
            stroke="url(#wcStroke)"
            strokeWidth={3}
            dot={{ fill: 'var(--accent)', r: 3, strokeWidth: 0 }}
            activeDot={{ fill: 'var(--accent)', r: 5, strokeWidth: 2, stroke: 'white' }}
            isAnimationActive
            animationDuration={600}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
