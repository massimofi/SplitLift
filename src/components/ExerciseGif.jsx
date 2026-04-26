// Exercise thumbnail.
//
// v8 strategy (per the v8 spec, in priority order):
//   1. Try wrkout/exercises.json image (mapped via WRKOUT_SLUG below).
//   2. On image error / no mapping, fall back to the muscle-gradient
//      tile with a centered Lucide icon (always works, 0 KB).
//
// Slugs in WRKOUT_SLUG were probed live and verified to return 200 from
// https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/<Slug>/images/0.jpg
// at the time of writing. Anything not in the map skips straight to the
// icon tile so we never paint a broken-image placeholder.

import React, { useState } from 'react';
import { Dumbbell, Footprints, Bike, Activity, Zap, Anchor } from 'lucide-react';
import { EXERCISES } from '../data/exercises.js';

// Verified-good wrkout slugs. Keep this list curated — every entry must 200.
const WRKOUT_SLUG = {
  // Push
  bench:    'Barbell_Bench_Press_-_Medium_Grip',
  incline:  'Incline_Dumbbell_Press',
  incdb:    'Incline_Dumbbell_Press',
  dbpress:  'Dumbbell_Bench_Press',
  fly:      'Cable_Crossover',
  dip:      'Dips_-_Triceps_Version',
  ohp:      'Standing_Military_Press',
  arnold:   'Arnold_Dumbbell_Press',
  // Pull
  pullup:   'Pullups',
  row:      'Bent_Over_Barbell_Row',
  pulldown: 'Wide-Grip_Lat_Pulldown',
  cabrow:   'Seated_Cable_Rows',
  face:     'Face_Pull',
  rear:     'Reverse_Flyes',
  curlbb:   'Barbell_Curl',
  hammer:   'Hammer_Curls',
  // Triceps
  tri:      'Triceps_Pushdown',
  overtri:  'Standing_Dumbbell_Triceps_Extension',
  // Shoulders / front
  front:    'Front_Dumbbell_Raise',
  // Legs
  squat:    'Barbell_Squat',
  legpress: 'Leg_Press',
  box:      'Box_Squat',
  rdl:      'Romanian_Deadlift',
  curl:     'Lying_Leg_Curls',
  gm:       'Good_Morning',
  gluteback:'Glute_Ham_Raise',
  calf:     'Standing_Calf_Raises',
  seatedcalf:'Standing_Dumbbell_Calf_Raise',
  // Core
  crunch:    'Crunches',
  plank:     'Plank',
  cablecrunch:'Cable_Crunch',
  legraise:  'Hanging_Leg_Raise',
  twist:     'Russian_Twist',
};

function wrkoutUrl(exId) {
  const slug = WRKOUT_SLUG[exId];
  return slug ? `https://raw.githubusercontent.com/wrkout/exercises.json/master/exercises/${slug}/images/0.jpg` : null;
}

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
  if (ex.gear === 'RUN') return Footprints;
  if (ex.gear === 'BIK') return Bike;
  if (ex.gear === 'ROW') return Anchor;
  if (ex.body === 'cardio' || ex.type === 'cardio') {
    if (ex.id && ex.id.includes('hiit')) return Zap;
    return Footprints;
  }
  if (ex.body === 'core' || ex.body === 'neck') return Activity;
  if (ex.gear === 'BW' && ex.body === 'quads') return Activity;
  return Dumbbell;
}

export function ExerciseGif({ exId, ex: exProp, size = 48, round = true }) {
  const ex = exProp || EXERCISES.find(e => e.id === exId);
  const url = ex && wrkoutUrl(ex.id);
  const [failed, setFailed] = useState(false);

  const Icon = iconFor(ex);
  const color = bpColorFor(ex);
  const iconSize = Math.round(size * 0.5);

  const baseStyle = {
    width: size,
    height: size,
    background: `linear-gradient(135deg, color-mix(in oklab, ${color} 92%, white) 0%, ${color} 100%)`,
    boxShadow: `0 4px 12px color-mix(in oklab, ${color} 24%, transparent)`,
  };
  const cls = `ex-gif tile ${round ? 'round' : ''}`;

  // Try the real image first if we have a mapping and it hasn't 404'd.
  if (url && !failed) {
    return (
      <div className={cls} style={{ ...baseStyle, padding: 0, overflow: 'hidden' }} aria-hidden="true">
        <img
          src={url}
          alt=""
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    );
  }

  // Fallback: gradient tile + centered Lucide icon (always works).
  return (
    <div className={cls} style={baseStyle} aria-hidden="true">
      <Icon size={iconSize} color="white" strokeWidth={2.2}/>
    </div>
  );
}
