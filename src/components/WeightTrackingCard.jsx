// Weight tracking widget — log a weigh-in + (when there's enough data)
// see the trend chart. v11.5 Issue 6: chart only renders with >= 2
// entries; otherwise an empty-state with a "Use sample data" CTA so the
// demo can show off the chart.

import React, { useState, Suspense, lazy } from 'react';
import { Scale, Sparkles } from 'lucide-react';
import { Card } from './Card.jsx';
import { LogWeightSheet } from './LogWeightSheet.jsx';
import { useAnimatedNumber } from '../lib/useAnimatedNumber.js';
import { IconPlus } from './Icons.jsx';

const WeightChart = lazy(() => import('./WeightChart.jsx'));

const KG_TO_LB = 2.20462;

// 6 fake weigh-ins over the last ~4 weeks. Loose downward trend around
// 225 lb (~102 kg) so the chart looks plausible for a powerlifter or
// general athlete in maintenance / mild cut.
function buildSampleWeightLog(targetUnit) {
  const today = new Date();
  const offsets = [-28, -21, -14, -7, -3, 0];
  const lbs    = [230, 226, 228, 224, 227, 225];
  return offsets.map((d, i) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + d);
    const date = dt.toISOString().slice(0, 10);
    // Always store kg as canonical unit; the chart converts to display unit.
    const kg = Math.round(lbs[i] * 0.4536 * 10) / 10;
    return { date, kg, sample: true };
  });
}

export function WeightTrackingCard({ profile, setProfile, showToast }) {
  const [logOpen, setLogOpen] = useState(false);
  const weightLog = profile.weightLog || [];
  const animWeight = useAnimatedNumber(Number(profile.weight) || 0, 600);
  const hasChart = weightLog.length >= 2;
  const isSampled = weightLog.some(w => w.sample);

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

  // Replace whatever's in the log with the sample series. Updates the
  // displayed weight to the latest entry too so the big number tracks.
  const useSampleData = () => {
    setProfile(p => {
      const sample = buildSampleWeightLog(p.wUnit);
      const latest = sample[sample.length - 1];
      const displayWeight = (p.wUnit === 'lb')
        ? Math.round(latest.kg * KG_TO_LB)
        : Math.round(latest.kg * 10) / 10;
      return { ...p, weightLog: sample, weight: displayWeight };
    });
    showToast && showToast('Sample data loaded');
  };

  return (
    <>
      <Card variant="gradient" gradient="cardio" size="md" icon={Scale}>
        <Card.Eyebrow>
          WEIGHT{isSampled ? ' · ✨ SAMPLE DATA' : ''}
        </Card.Eyebrow>
        <div className="gen-weight-card-row">
          <Card.Value unit={profile.wUnit}>
            {animWeight.toFixed(profile.wUnit === 'kg' ? 1 : 0)}
          </Card.Value>
          <button className="gen-weight-log-btn" onClick={()=>setLogOpen(true)} type="button">
            <IconPlus/> Log weigh-in
          </button>
        </div>
        <div className="gen-weight-chart-host">
          {hasChart ? (
            <Suspense fallback={<div style={{padding:8,opacity:0.7}}>Loading chart…</div>}>
              <WeightChart data={weightLog} unit={profile.wUnit}/>
            </Suspense>
          ) : (
            <div className="weight-empty">
              <p className="weight-empty-copy">
                Log your weight this week to start tracking your progress.
              </p>
              {weightLog.length <= 1 && (
                <button
                  type="button"
                  className="weight-sample-btn"
                  onClick={useSampleData}
                  data-testid="weight-sample-btn"
                >
                  <Sparkles size={14} strokeWidth={2.4}/> Use sample data
                </button>
              )}
            </div>
          )}
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
