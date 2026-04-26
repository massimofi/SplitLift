// Exercise thumbnail. After v5 we no longer fetch real photos from
// free-exercise-db (they were ugly real-person stock shots, and the wrkout
// fork shipped identical bytes). Render a clean colored tile with a lucide
// icon instead — 0 KB network, consistent aesthetic, never broken.
//
// Color comes from the exercise's primary body part via the existing --bp-*
// CSS vars; icon picks based on gear (cardio modalities) or body group.

import React from 'react';
import { Dumbbell, Footprints, Bike, Activity, Zap, User, Anchor } from 'lucide-react';
import { EXERCISES } from '../data/exercises.js';

// Body keys that don't have a --bp-* var of their own. Map to the closest
// existing one so the tile gets a sensible color.
const BODY_TO_BP = {
  forearm:   'bis',
  neck:      'core',
  adductors: 'quads',
  abductors: 'glutes',
};

function bpColorFor(ex) {
  if (!ex || !ex.body) return 'var(--bp-arms)';
  const key = BODY_TO_BP[ex.body] || ex.body;
  return `var(--bp-${key})`;
}

function iconFor(ex) {
  if (!ex) return Dumbbell;
  // Cardio modalities — pick by equipment first.
  if (ex.gear === 'RUN') return Footprints;
  if (ex.gear === 'BIK') return Bike;
  if (ex.gear === 'ROW') return Anchor;
  // Cardio by ID/type as fallback
  if (ex.body === 'cardio' || ex.type === 'cardio') {
    if (ex.id && ex.id.includes('hiit')) return Zap;
    return Footprints;
  }
  // Core + abs gets a different vibe — moving body
  if (ex.body === 'core' || ex.body === 'neck') return Activity;
  // Bodyweight + plyometrics
  if (ex.gear === 'BW' && ex.body === 'quads') return Activity;
  return Dumbbell;
}

export function ExerciseGif({ exId, ex: exProp, size = 48, round = true }) {
  const ex = exProp || EXERCISES.find(e => e.id === exId);
  const Icon = iconFor(ex);
  const color = bpColorFor(ex);
  const iconSize = Math.round(size * 0.5);

  const cls = `ex-gif tile ${round ? 'round' : ''}`;
  const style = {
    width: size,
    height: size,
    background: `linear-gradient(135deg, color-mix(in oklab, ${color} 92%, white) 0%, ${color} 100%)`,
    boxShadow: `0 4px 12px color-mix(in oklab, ${color} 24%, transparent)`,
  };

  return (
    <div className={cls} style={style} aria-hidden="true">
      <Icon size={iconSize} color="white" strokeWidth={2.2}/>
    </div>
  );
}
