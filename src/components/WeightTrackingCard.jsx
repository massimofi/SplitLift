// Weight tracking widget — log a weigh-in + see the trend chart.
// Used on the Dashboard (v11 Issue 2 moved this from General).

import React, { useState, Suspense, lazy } from 'react';
import { Scale } from 'lucide-react';
import { Card } from './Card.jsx';
import { LogWeightSheet } from './LogWeightSheet.jsx';
import { useAnimatedNumber } from '../lib/useAnimatedNumber.js';
import { IconPlus } from './Icons.jsx';

const WeightChart = lazy(() => import('./WeightChart.jsx'));

const KG_TO_LB = 2.20462;

export function WeightTrackingCard({ profile, setProfile, showToast }) {
  const [logOpen, setLogOpen] = useState(false);
  const weightLog = profile.weightLog || [];
  const animWeight = useAnimatedNumber(Number(profile.weight) || 0, 600);

  const logWeight = ({ date, kg, unit }) => {
    setProfile(p => {
      const existing = (p.weightLog || []).filter(w => w.date !== date);
      const next = [...existing, { date, kg }].sort((a, b) => a.date.localeCompare(b.date));
      const latest = next[next.length - 1];
      const displayWeight = (p.wUnit === 'lb')
        ? Math.round(latest.kg * KG_TO_LB)
        : Math.round(latest.kg * 10) / 10;
      return { ...p, weightLog: next, weight: displayWeight, wUnit: unit || p.wUnit };
    });
    setLogOpen(false);
    showToast && showToast(`Logged ${kg} kg`);
  };

  return (
    <>
      <Card variant="gradient" gradient="cardio" size="md" icon={Scale}>
        <Card.Eyebrow>WEIGHT</Card.Eyebrow>
        <div className="gen-weight-card-row">
          <Card.Value unit={profile.wUnit}>
            {animWeight.toFixed(profile.wUnit === 'kg' ? 1 : 0)}
          </Card.Value>
          <button className="gen-weight-log-btn" onClick={()=>setLogOpen(true)} type="button">
            <IconPlus/> Log weigh-in
          </button>
        </div>
        <div className="gen-weight-chart-host">
          <Suspense fallback={<div style={{padding:8,opacity:0.7}}>Loading chart…</div>}>
            <WeightChart data={weightLog} unit={profile.wUnit}/>
          </Suspense>
        </div>
      </Card>
      {logOpen && (
        <LogWeightSheet
          defaultUnit={profile.wUnit}
          defaultWeight={profile.weight}
          onSubmit={logWeight}
          onClose={() => setLogOpen(false)}
        />
      )}
    </>
  );
}
