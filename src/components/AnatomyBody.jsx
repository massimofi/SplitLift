// SplitLift body view powered by react-body-highlighter (MIT, by giavinh79).
// We pad the library's data array so coverage status maps to its 3-step
// frequency-color ramp:
//   freq 1 → under-worked (blue)
//   freq 2 → in target band (teal)
//   freq 3 → over the band (coral)
//   freq 0 → bodyColor (gray = unworked)

import React, { useMemo } from 'react';
import Model from 'react-body-highlighter';

// Our canonical muscle keys (MUSCLE_LABELS_V2) → react-body-highlighter slugs.
// hip_flex has no equivalent in the library and is intentionally omitted.
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
};

export const KEY_BY_SLUG = Object.fromEntries(
  Object.entries(SLUG_BY_KEY).map(([k, s]) => [s, k])
);

const HIGHLIGHTED_COLORS = ['#6E6EFF', '#4ED9C0', '#FF8A5B']; // under, optimal, over
const BODY_COLOR = '#BCC0CC'; // neutral gray that reads on light + dark themes

function buildData(coverage, targets) {
  const data = [];
  for (const [key, slug] of Object.entries(SLUG_BY_KEY)) {
    const s = (coverage && coverage[key]) || 0;
    const t = targets && targets[key];
    let level = 0;
    if (!t || s <= 0) level = 0;
    else if (s < t.min) level = 1;
    else if (s <= t.max) level = 2;
    else level = 3;
    for (let i = 0; i < level; i++) {
      // Each entry needs a unique-ish name so the lib's exercise list isn't
      // collapsed; we don't actually use that list in onClick.
      data.push({ name: `${key}-${i}`, muscles: [slug] });
    }
  }
  return data;
}

export function AnatomyBody({ coverage, targets, view = 'front', onMuscleClick }) {
  const data = useMemo(() => buildData(coverage, targets), [coverage, targets]);

  const handleClick = (stats) => {
    // The library passes either a string (older versions) or { muscle, data }
    // (current). Be defensive.
    const slug = typeof stats === 'string' ? stats : (stats && stats.muscle);
    if (!slug) return;
    const key = KEY_BY_SLUG[slug];
    if (key && onMuscleClick) onMuscleClick(key);
  };

  return (
    <div className="abh-host">
      <Model
        data={data}
        type={view === 'back' ? 'posterior' : 'anterior'}
        bodyColor={BODY_COLOR}
        highlightedColors={HIGHLIGHTED_COLORS}
        onClick={handleClick}
        style={{ width: '100%', maxWidth: 320, margin: '0 auto' }}
      />
    </div>
  );
}
