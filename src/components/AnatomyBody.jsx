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

// Per-slug zoom frames for click-to-zoom. {x, y} are translate offsets in
// viewport-percent units applied via CSS transform; scale is the zoom factor.
// Calibrated against react-body-highlighter's ~100×200 viewBox so the focused
// muscle ends up roughly centered and ~70% of the visible area.
//
// Values tuned per Massi's request — increase scale/y for a tighter framing,
// decrease for wider context. Limbs use side x-offsets so the muscle isn't
// cut off after scaling.
// v11 Issue 4: re-tuned for the 38vh body region (drawer is now 50vh).
// The previous values were calibrated for the larger ~60vh body — quads
// were ending up showing the feet, calves were off-screen, etc. Halved
// most y offsets and reduced scale slightly so the focus muscle lands
// in the visible body region above the drawer.
export const MUSCLE_FRAMES = {
  // ---- Anterior (front) ----
  chest:            { x:   0,  y:  -4,  scale: 1.7 },
  abs:              { x:   0,  y:   3,  scale: 1.8 },
  obliques:         { x:   0,  y:   3,  scale: 1.8 },
  'front-deltoids': { x:   0,  y:  -8,  scale: 1.8 },
  biceps:           { x: -22,  y:  -2,  scale: 2.0 },
  triceps:          { x: -22,  y:  -2,  scale: 2.0 },
  forearm:          { x: -26,  y:   3,  scale: 2.1 },
  quadriceps:       { x:   0,  y:  12,  scale: 2.0 },
  adductor:         { x:   0,  y:  11,  scale: 2.0 },
  abductors:        { x:  -8,  y:  11,  scale: 2.0 },
  calves:           { x:   0,  y:  20,  scale: 2.1 },
  neck:             { x:   0,  y: -12,  scale: 2.2 },
  head:             { x:   0,  y: -18,  scale: 2.2 },

  // ---- Posterior (back) ----
  trapezius:        { x:   0,  y: -10,  scale: 1.8 },
  'upper-back':     { x:   0,  y:  -5,  scale: 1.7 },
  'lower-back':     { x:   0,  y:   4,  scale: 1.8 },
  'back-deltoids':  { x:   0,  y:  -8,  scale: 1.8 },
  hamstring:        { x:   0,  y:  12,  scale: 2.0 },
  gluteal:          { x:   0,  y:   8,  scale: 2.0 },
  'left-soleus':    { x:   0,  y:  20,  scale: 2.1 },
  'right-soleus':   { x:   0,  y:  20,  scale: 2.1 },
};

// v10 heatmap ramp. Pure red → orange → yellow → green only.
// v10 Issue 3 dropped the indigo "over" color — over-trained shows as
// the deepest green so the body never has any cool/purple hue.
//   index 0 = bright red    (untrained, 0 sets)
//   index 1 = orange        (1-30% of mid)
//   index 2 = amber/yellow  (30-60%)
//   index 3 = light green   (60-90%)
//   index 4 = green         (90-110%, optimal)
//   index 5 = deep green    (>110%, over)
const HIGHLIGHTED_COLORS = ['#FF4444', '#FF8C42', '#FFD93D', '#7CB342', '#2E7D32', '#1B5E20'];
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
