// Exercise pictogram tile.
//
// v9 strategy:
//   - Drop ALL wrkout/real-person photos (Massi never wanted them).
//   - Render a consistent line-art pictogram for every exercise:
//     theme-aware solid surface + a stroked Lucide icon picked by
//     equipment / body / movement pattern. 0 KB, always renders,
//     looks intentional. Same approach StrengthLevel uses.
//   - Optional: a per-muscle accent stripe on the left edge so the
//     tile still telegraphs which body part it hits without going
//     full-saturated (which competed visually with the cards).

import React from 'react';
import {
  Dumbbell, Footprints, Bike, Activity, Zap, Anchor,
  Flame, Move, ArrowDown, ArrowUp, RotateCcw, ArrowLeftRight,
} from 'lucide-react';
import { EXERCISES } from '../data/exercises.js';

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

// Pick the best Lucide pictogram for an exercise based on its movement
// pattern. Goal: ~10 distinct icons total so the tiles read at a glance
// (a curl always looks different from a row).
function iconFor(ex) {
  if (!ex) return Dumbbell;

  // Cardio modalities
  if (ex.gear === 'RUN') return Footprints;
  if (ex.gear === 'BIK') return Bike;
  if (ex.gear === 'ROW') return Anchor;
  if (ex.body === 'cardio' || ex.type === 'cardio') {
    if (ex.id && /hiit|sprint|tabata/i.test(ex.id)) return Zap;
    if (ex.id && /jump/i.test(ex.id)) return Flame;
    return Footprints;
  }

  // Movement patterns by id keyword
  const id = (ex.id || '').toLowerCase();
  const name = (ex.name || '').toLowerCase();

  if (/curl|bicep|hammer|preacher/.test(id + name)) return RotateCcw;
  if (/row|pulldown|pullup|chinup|face/.test(id + name)) return ArrowDown;
  if (/press|push|bench|ohp|incline|fly/.test(id + name)) return ArrowUp;
  if (/squat|lunge|legpress|deadlift|rdl|hip|thrust/.test(id + name)) return Move;
  if (/calf|raise/.test(id + name)) return ArrowUp;
  if (/twist|rotation|wood|chop/.test(id + name)) return ArrowLeftRight;

  // Core / abs / dynamic
  if (ex.body === 'core' || ex.body === 'abs' || ex.body === 'obliques' || ex.body === 'neck') return Activity;

  // Bodyweight plyometrics
  if (ex.gear === 'BW' && ex.body === 'quads') return Activity;

  return Dumbbell;
}

export function ExerciseGif({ exId, ex: exProp, size = 48, round = true }) {
  const ex = exProp || EXERCISES.find(e => e.id === exId);
  const Icon = iconFor(ex);
  const accent = bpColorFor(ex);
  const iconSize = Math.round(size * 0.55);

  const cls = `ex-gif tile ${round ? 'round' : ''}`;
  // Theme-aware surface bg + stroked icon. The accent shows as a left
  // stripe so we still telegraph the muscle group at a glance, without
  // dominating the card visuals.
  const style = {
    width: size,
    height: size,
    background: 'var(--bg-2)',
    borderLeft: `3px solid ${accent}`,
    color: 'var(--ink)',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
  };

  return (
    <div className={cls} style={style} aria-hidden="true">
      <Icon size={iconSize} strokeWidth={2.0} color="currentColor"/>
    </div>
  );
}
