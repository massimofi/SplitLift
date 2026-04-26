// Cardio tab — sport-aware recommendations + this week's cardio + a
// "why this cardio?" expander that explains the energy systems.
//
// v9 Issue 7. Reuses the Card / Subheader / Chip primitives from the
// design system; no bespoke CSS beyond a few small list helpers in
// styles/screens.css.

import React, { useMemo, useState } from 'react';
import {
  SPORTS, CARDIO_LIBRARY, CARDIO_TYPES, DAY_NAMES,
  cardioFor, cardioHRZone, totalCardioMinutes,
} from '../data/exercises.js';
import { Card } from '../components/Card.jsx';
import { Subheader } from '../components/Subheader.jsx';
import { Chip } from '../components/Chip.jsx';
import { ChevronRight, ChevronDown } from 'lucide-react';

// One-line energy-system rationale per sport. Drives the "Why this cardio?"
// expander when sport-specific copy isn't already in cardioProfile.rationale.
const ENERGY_NOTE = {
  soccer:
    "Soccer is repeated sprints over 90 minutes — the alactic system fires for each sprint, the aerobic base lets you recover between them. Sprint intervals + Zone-2 cover both.",
  basketball:
    "Basketball is short, high-intensity bursts with brief recovery — train your phosphocreatine and glycolytic systems. Sprint work builds the burst, easy aerobic work the recovery.",
  baseball:
    "Baseball is rotational power + short bursts. Cardio is mostly about general aerobic capacity and lateral agility, not endurance.",
  tennis:
    "Tennis points are 5-15s of high intensity, separated by 15-25s of rest. Sprint intervals + agility work mirror that demand.",
  run:
    "Running is the cardio. Volume + tempo + occasional intervals build aerobic capacity and lactate threshold.",
  powerlift:
    "Lifting heavy is anaerobic — but 30 minutes of easy aerobic work twice a week speeds recovery between sessions and keeps resting HR healthy.",
  crossfit:
    "CrossFit demands metabolic conditioning across all energy systems. Mix sprint intervals (alactic), AMRAPs (glycolytic), and Zone-2 (aerobic).",
  general:
    "150 minutes of moderate cardio per week is the CDC baseline for general health. Mix easy aerobic with one or two harder sessions.",
};

export function CardioTab({ profile, cardioDays, setTab }) {
  const sport = SPORTS.find(s => s.id === profile?.sport) || SPORTS[0];
  const cardioProfile = sport.cardioProfile;
  const [whyOpen, setWhyOpen] = useState(false);

  // Build recommended list — primary first, then secondary.
  const recs = useMemo(() => {
    if (!cardioProfile) return [];
    const out = [];
    for (const id of cardioProfile.primary || []) {
      const c = CARDIO_LIBRARY.find(x => x.id === id);
      if (c) out.push({ ...c, tier: 'primary' });
    }
    for (const id of cardioProfile.secondary || []) {
      const c = CARDIO_LIBRARY.find(x => x.id === id);
      if (c) out.push({ ...c, tier: 'secondary' });
    }
    return out;
  }, [cardioProfile]);

  // Group this week's cardio by day.
  const week = useMemo(() => {
    const out = [];
    for (let i = 0; i < 7; i++) {
      const items = (cardioDays?.[i]?.items || []).map(id => cardioFor(id)).filter(Boolean);
      if (items.length > 0) out.push({ dayIdx: i, dayName: DAY_NAMES[i], items });
    }
    return out;
  }, [cardioDays]);

  const totalMin = totalCardioMinutes(cardioDays || []);
  const targetMin = profile?.cardioMin || 90;
  const energyNote = ENERGY_NOTE[sport.id] || ENERGY_NOTE.general;

  return (
    <div className="tab-pane cardio-page">
      <Subheader subtitle={`Sport-tailored sessions for ${sport.label.toLowerCase()}. Tap a recommendation to see how to add it.`}>
        Cardio for {sport.label}
      </Subheader>

      {/* Top weekly summary */}
      <Card variant="gradient" gradient="cardio" size="md" className="cardio-week-card">
        <div className="cardio-week-row">
          <div>
            <Card.Eyebrow>THIS WEEK</Card.Eyebrow>
            <Card.Value unit="min">{totalMin}</Card.Value>
            <Card.Sub>of {targetMin} min target</Card.Sub>
          </div>
          <Chip gradient={totalMin >= targetMin ? 'recovery' : (totalMin >= targetMin * 0.5 ? 'warning' : 'danger')} size="md">
            {totalMin >= targetMin ? 'On target' : (totalMin >= targetMin * 0.5 ? 'Halfway' : 'Behind')}
          </Chip>
        </div>
      </Card>

      {/* Recommended for sport */}
      {recs.length > 0 && (
        <>
          <Subheader subtitle={cardioProfile?.rationale}>Recommended for {sport.label}</Subheader>
          <div className="cardio-rec-stack">
            {recs.map(c => {
              const hr = cardioHRZone(c, profile);
              return (
                <Card
                  key={c.id}
                  variant="surface"
                  size="md"
                  interactive
                  onClick={() => setTab && setTab('schedule')}
                  className="cardio-rec-card"
                >
                  <div className="cardio-rec-head">
                    <div>
                      <Card.Eyebrow>{c.tier === 'primary' ? 'PRIMARY' : 'SECONDARY'}</Card.Eyebrow>
                      <Card.Title>{c.name}</Card.Title>
                    </div>
                    <Chip
                      gradient={c.tier === 'primary' ? 'cardio' : 'info'}
                      size="sm"
                    >
                      {c.dur} min
                    </Chip>
                  </div>
                  <Card.Sub className="cardio-rec-meta">
                    {CARDIO_TYPES[c.type]?.label || c.type}
                    {hr && ` · ${hr[0]}–${hr[1]} bpm`}
                    {c.dist > 0 && ` · ${c.dist}${c.unit}`}
                  </Card.Sub>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* This week's scheduled cardio */}
      <Subheader subtitle="Tap a session to jump to its day in Schedule.">Your week</Subheader>
      {week.length === 0 ? (
        <Card variant="subtle" size="md" className="cardio-empty">
          No cardio scheduled this week. Drag a chip onto a day in Schedule.
        </Card>
      ) : (
        <div className="cardio-week-stack">
          {week.map(({ dayIdx, dayName, items }) => (
            <Card
              key={dayIdx}
              variant="surface"
              size="md"
              interactive
              onClick={() => setTab && setTab('schedule')}
              className="cardio-day-card"
            >
              <div className="cardio-day-head">
                <span className="cardio-day-name mono">{dayName.toUpperCase()}</span>
                <span className="cardio-day-total mono">{items.reduce((s, c) => s + (c.dur || 0), 0)} min</span>
              </div>
              <div className="cardio-day-items">
                {items.map((c, k) => (
                  <span key={k} className="cardio-day-item">
                    {c.name} · {c.dur}m
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Why this cardio? expander */}
      <Card variant="subtle" size="md" interactive onClick={() => setWhyOpen(o => !o)} className="cardio-why-card">
        <div className="cardio-why-head">
          <Card.Title>Why this cardio?</Card.Title>
          {whyOpen ? <ChevronDown size={18}/> : <ChevronRight size={18}/>}
        </div>
        {whyOpen && (
          <Card.Sub className="cardio-why-body">{energyNote}</Card.Sub>
        )}
      </Card>

      <div style={{ height: 24 }}/>
    </div>
  );
}
