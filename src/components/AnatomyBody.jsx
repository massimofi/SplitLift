// SplitLift body view powered by react-body-highlighter (MIT, by giavinh79).
// Now with:
//   - 6-bucket heatmap colors (dead → red → orange → yellow → green → coral)
//   - Click-to-zoom: parent component supplies a focused muscle, we apply a
//     CSS transform to frame it
//   - All library slugs (including head, neck, abductors, soleus pair) map
//     to a canonical key so every muscle is clickable

import React, { useMemo } from 'react';
import Model from 'react-body-highlighter';

// Our canonical muscle keys → react-body-highlighter slugs.
// hip_flex has no slug equivalent in the library and is intentionally omitted.
export const SLUG_BY_KEY = {
  chest:      'chest',
  shoulder:   'front-deltoids',
  rear_delt:  'back-deltoids',
  biceps:     'biceps',
  triceps:    'triceps',
  forearm:    'forearm',
  abs:        'abs',
  obliques:   'obliques',
  lats:       'upper-back',
  traps:      'trapezius',
  lower_back: 'lower-back',
  quads:      'quadriceps',
  hams:       'hamstring',
  glutes:     'gluteal',
  calves:     'calves',
  adductors:  'adductor',
  abductors:  'abductors',
  neck:       'neck',
};

// Reverse lookup. soleus L/R fold into calves; head folds into neck so any
// click in the silhouette opens a meaningful drawer.
export const KEY_BY_SLUG = {
  ...Object.fromEntries(Object.entries(SLUG_BY_KEY).map(([k, s]) => [s, k])),
  'left-soleus':  'calves',
  'right-soleus': 'calves',
  'head':         'neck',
};

// Approximate frames for click-to-zoom. {x, y} are translate-percent on the
// host, scale is the zoom factor. Eyeballed for the ~100×200 viewBox the
// library renders. Tweak per slug if a particular muscle frames poorly.
export const MUSCLE_FRAMES = {
  // ---- Anterior (front) ----
  chest:            { x:  0,  y: -8,   scale: 1.7 },
  abs:              { x:  0,  y:  8,   scale: 1.7 },
  obliques:         { x:  0,  y:  6,   scale: 1.7 },
  'front-deltoids': { x:  0,  y: -18,  scale: 1.7 },
  biceps:           { x:  0,  y: -10,  scale: 1.7 },
  forearm:          { x:  0,  y:  4,   scale: 1.7 },
  quadriceps:       { x:  0,  y:  20,  scale: 1.55 },
  adductor:         { x:  0,  y:  22,  scale: 1.6 },
  abductors:        { x:  0,  y:  18,  scale: 1.6 },
  calves:           { x:  0,  y:  38,  scale: 1.55 },
  neck:             { x:  0,  y: -38,  scale: 2.0 },
  head:             { x:  0,  y: -45,  scale: 2.0 },

  // ---- Posterior (back) ----
  trapezius:        { x:  0,  y: -22,  scale: 1.7 },
  'upper-back':     { x:  0,  y: -10,  scale: 1.6 },
  'lower-back':     { x:  0,  y:  2,   scale: 1.7 },
  'back-deltoids':  { x:  0,  y: -20,  scale: 1.7 },
  triceps:          { x:  0,  y: -10,  scale: 1.7 },
  hamstring:        { x:  0,  y:  20,  scale: 1.55 },
  gluteal:          { x:  0,  y:  8,   scale: 1.6 },
  'left-soleus':    { x:  0,  y:  38,  scale: 1.55 },
  'right-soleus':   { x:  0,  y:  38,  scale: 1.55 },
};

// Heatmap ramp. Index 0 (freq 1) is dead-gray = same as bodyColor so
// muscles with 0 sets blend in but stay clickable. Subsequent indices walk
// red → orange → yellow → green (optimal) → coral (over).
const HIGHLIGHTED_COLORS = ['#2d2d3d', '#ff4444', '#ff8c42', '#ffd93d', '#00c896', '#ff8a5b'];
const BODY_COLOR = '#2d2d3d';

// Map a muscle's coverage to one of 6 bucket indices.
//   0  = unworked (no data)              → freq 1, dead gray
//   1  = 1-30% of mid                    → freq 2, red
//   2  = 30-60%                          → freq 3, orange
//   3  = 60-90%                          → freq 4, yellow
//   4  = 90-110% (optimal band)          → freq 5, green
//   5  = >110%                           → freq 6, coral
function bucketFor(sets, target) {
  if (!target) return 0;
  const mid = (target.min + target.max) / 2;
  if (mid <= 0) return 0;
  const pct = sets / mid;
  if (pct < 0.005) return 0;
  if (pct < 0.30)  return 1;
  if (pct < 0.60)  return 2;
  if (pct < 0.90)  return 3;
  if (pct < 1.10)  return 4;
  return 5;
}

function buildData(coverage, targets) {
  const data = [];
  for (const [key, slug] of Object.entries(SLUG_BY_KEY)) {
    const s = (coverage && coverage[key]) || 0;
    const t = targets && targets[key];
    const bucket = bucketFor(s, t);
    // freq = bucket + 1 → highlightedColors[bucket]
    const freq = bucket + 1;
    for (let i = 0; i < freq; i++) {
      data.push({ name: `${key}-${i}`, muscles: [slug] });
    }
  }
  return data;
}

export function AnatomyBody({ coverage, targets, view = 'front', focused = null, onMuscleClick }) {
  const data = useMemo(() => buildData(coverage, targets), [coverage, targets]);

  const handleClick = (stats) => {
    const slug = typeof stats === 'string' ? stats : (stats && stats.muscle);
    if (!slug) return;
    const key = KEY_BY_SLUG[slug];
    if (key && onMuscleClick) onMuscleClick(key);
  };

  // Compute zoom transform from focused muscle key.
  // Look up by slug (since MUSCLE_FRAMES is slug-keyed for both views).
  let zoomStyle = null;
  if (focused) {
    const slug = SLUG_BY_KEY[focused];
    const frame = slug && MUSCLE_FRAMES[slug];
    if (frame) {
      zoomStyle = {
        transform: `scale(${frame.scale}) translate(${frame.x}%, ${frame.y}%)`,
        transformOrigin: 'center center',
      };
    }
  }

  return (
    <div className="abh-host">
      <div className="abh-zoom" style={zoomStyle || undefined}>
        <Model
          data={data}
          type={view === 'back' ? 'posterior' : 'anterior'}
          bodyColor={BODY_COLOR}
          highlightedColors={HIGHLIGHTED_COLORS}
          onClick={handleClick}
          style={{ width: '100%', maxWidth: 360, margin: '0 auto' }}
        />
      </div>
    </div>
  );
}
