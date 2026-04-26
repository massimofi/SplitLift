// Detailed anatomy SVG with NAMED muscle groups (clickable + highlightable).
// Both views (front/back) and male/female toggle (female = same shapes for now,
// minor proportional tweaks).
//
// Muscle keys (canonical):
//   chest, shoulder, biceps, triceps, forearm, abs, obliques,
//   lats, traps, lower_back, rear_delt,
//   quads, hams, glutes, calves, hip_flex, adductors

import React from 'react';
import { EXERCISES, setsForExercise } from '../data/exercises.js';

export const MUSCLE_LABELS_V2 = {
  chest: 'Chest',
  shoulder: 'Front Delts',
  rear_delt: 'Rear Delts',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearm: 'Forearms',
  abs: 'Abs',
  obliques: 'Obliques',
  lats: 'Lats',
  traps: 'Traps',
  lower_back: 'Lower Back',
  quads: 'Quads',
  hams: 'Hamstrings',
  glutes: 'Glutes',
  calves: 'Calves',
  hip_flex: 'Hip Flexors',
  adductors: 'Adductors',
};

// Map old aggregate keys → new detailed ones for back-compat with EXERCISES.hits
export const HITS_REMAP = {
  back: ['lats', 'traps', 'lower_back'],
  arms: ['biceps', 'triceps'],
  core: ['abs', 'obliques'],
};

// Targets per detailed group (weekly sets)
export const TARGETS_V2 = {
  chest:      { min: 10, max: 18 },
  shoulder:   { min: 6,  max: 12 },
  rear_delt:  { min: 6,  max: 14 },
  biceps:     { min: 6,  max: 14 },
  triceps:    { min: 6,  max: 14 },
  forearm:    { min: 4,  max: 12 },
  abs:        { min: 6,  max: 16 },
  obliques:   { min: 4,  max: 12 },
  lats:       { min: 8,  max: 16 },
  traps:      { min: 4,  max: 12 },
  lower_back: { min: 4,  max: 10 },
  quads:      { min: 10, max: 20 },
  hams:       { min: 8,  max: 16 },
  glutes:     { min: 8,  max: 16 },
  calves:     { min: 6,  max: 12 },
  hip_flex:   { min: 2,  max: 8 },
  adductors:  { min: 2,  max: 8 },
};

export function expandHits(rawHits) {
  const out = {};
  for (const [k, w] of Object.entries(rawHits || {})) {
    if (HITS_REMAP[k]) {
      for (const sub of HITS_REMAP[k]) out[sub] = (out[sub] || 0) + w;
    } else if (TARGETS_V2[k]) {
      out[k] = (out[k] || 0) + w;
    }
  }
  return out;
}

export function computeCoverageV2(days) {
  const out = {};
  Object.keys(TARGETS_V2).forEach(k => out[k] = 0);
  for (const day of days) {
    if (day.rest) continue;
    for (const exId of day.exIds) {
      const ex = EXERCISES.find(e => e.id === exId);
      if (!ex) continue;
      const setCount = setsForExercise(ex);
      const hits = expandHits(ex.hits);
      for (const [m, w] of Object.entries(hits)) {
        if (out[m] !== undefined) out[m] += setCount * w;
      }
    }
  }
  for (const k of Object.keys(out)) out[k] = Math.round(out[k]);
  return out;
}

export function exercisesForMuscle(muscleKey) {
  return EXERCISES.filter(ex => {
    const hits = expandHits(ex.hits);
    return (hits[muscleKey] || 0) >= 0.4;
  }).map(ex => ({ ex, weight: expandHits(ex.hits)[muscleKey] || 0 }))
    .sort((a, b) => b.weight - a.weight);
}

export const RAMP_V2 = {
  light:  ['#1B1F3D', '#2A2E63', '#5151C7', '#8C8CFF', '#C09BFF'],
  dark:   ['#1B1F3D', '#2A2E63', '#5151C7', '#8C8CFF', '#C09BFF'],
};

export function intensityForV2(sets, target) {
  if (sets <= 0) return 0;
  if (sets < target.min * 0.5) return 1;
  if (sets < target.min) return 2;
  if (sets <= target.max) return 3;
  return 4;
}

// ---------- DETAILED FRONT ANATOMY ----------
// All paths designed inside a 320×600 viewBox.
export function AnatomyFront({ sets, recently, onRegion, sex='m' }) {
  const fillFor = (key) => {
    const lvl = intensityForV2(sets[key] || 0, TARGETS_V2[key]);
    return RAMP_V2.dark[lvl];
  };
  const stroke = 'rgba(255,255,255,0.12)';
  const strokeWidth = 0.6;

  const Region = ({ k, d, ellipse, circle, rect }) => {
    const props = {
      className: `body-region ${recently === k ? 'pulse' : ''}`,
      fill: fillFor(k),
      stroke, strokeWidth,
      onClick: (e) => { e.stopPropagation(); onRegion && onRegion(k); },
      style: { cursor: 'pointer' },
      'data-muscle': k,
    };
    if (d) return <path d={d} {...props} />;
    if (ellipse) return <ellipse {...ellipse} {...props} />;
    if (circle) return <circle {...circle} {...props} />;
    if (rect) return <rect {...rect} {...props} />;
    return null;
  };

  // Female silhouette tweaks
  const shoulderW = sex === 'f' ? 0.92 : 1.0;
  const hipW = sex === 'f' ? 1.04 : 1.0;
  const sx = (x, base) => base + (x - base) * (sex === 'f' ? 1 : 1);

  return (
    <svg viewBox="0 0 320 600" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="bodyGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="rgba(0,194,101,0.0)"/>
          <stop offset="1" stopColor="rgba(0,194,101,0.0)"/>
        </radialGradient>
        <linearGradient id="fSheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="rgba(255,255,255,0)"/>
          <stop offset="0.5" stopColor="rgba(255,255,255,0.06)"/>
          <stop offset="1" stopColor="rgba(0,0,0,0.16)"/>
        </linearGradient>
      </defs>

      {/* ============== HEAD + NECK (neutral) ============== */}
      <ellipse cx="160" cy="50" rx="28" ry="34" fill="#1F2622" stroke={stroke} strokeWidth={strokeWidth}/>
      {/* jaw shading */}
      <path d="M138,68 Q160,84 182,68 L178,82 Q160,90 142,82 Z" fill="#171C18" opacity="0.5"/>
      {/* neck */}
      <path d="M148,82 L172,82 L176,108 L144,108 Z" fill="#1F2622" stroke={stroke} strokeWidth={strokeWidth}/>
      {/* collarbones (decorative) */}
      <path d="M118,114 Q140,108 160,112 Q180,108 202,114" fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="1"/>

      {/* ============== TRAPS (front upper) ============== */}
      <Region k="traps"
        d="M138,98 Q160,92 182,98 L188,118 Q160,114 132,118 Z"
      />

      {/* ============== SHOULDERS (front delts) ============== */}
      <Region k="shoulder"
        d={`M${100*shoulderW+(160-160*shoulderW)},120 Q88,118 84,138 Q88,156 110,156 Q120,150 122,134 Q120,124 ${118*shoulderW+(160-160*shoulderW)},120 Z`}
      />
      <Region k="shoulder"
        d={`M220,120 Q232,118 236,138 Q232,156 210,156 Q200,150 198,134 Q200,124 220,120 Z`}
      />

      {/* ============== CHEST ============== */}
      <Region k="chest"
        d="M118,124 Q160,114 202,124 L210,178 Q190,184 162,184 L158,184 Q130,184 110,178 Z"
      />
      {/* sternum line */}
      <path d="M160,128 L160,182" stroke="rgba(0,0,0,0.35)" strokeWidth="1.4"/>
      {/* chest crease */}
      <path d="M118,160 Q140,170 158,168 M202,160 Q180,170 162,168"
        fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="0.8"/>

      {/* ============== BICEPS ============== */}
      <Region k="biceps"
        d="M82,140 Q72,178 80,222 L102,222 Q108,180 100,140 Z"
      />
      <Region k="biceps"
        d="M238,140 Q248,178 240,222 L218,222 Q212,180 220,140 Z"
      />

      {/* ============== FOREARMS ============== */}
      <Region k="forearm"
        d="M80,224 L102,224 Q108,260 100,300 L78,304 Q70,260 80,224 Z"
      />
      <Region k="forearm"
        d="M218,224 L240,224 Q250,260 242,304 L220,300 Q212,260 218,224 Z"
      />
      {/* hands */}
      <ellipse cx="88" cy="320" rx="14" ry="18" fill="#1F2622" stroke={stroke} strokeWidth={strokeWidth}/>
      <ellipse cx="232" cy="320" rx="14" ry="18" fill="#1F2622" stroke={stroke} strokeWidth={strokeWidth}/>

      {/* ============== ABS (rectus) ============== */}
      <Region k="abs"
        d="M132,186 Q160,182 188,186 L184,288 Q160,294 136,288 Z"
      />
      {/* abs grid lines */}
      <g stroke="rgba(0,0,0,0.35)" strokeWidth="0.8" fill="none">
        <line x1="160" y1="190" x2="160" y2="288"/>
        <line x1="134" y1="212" x2="186" y2="212"/>
        <line x1="134" y1="234" x2="186" y2="234"/>
        <line x1="134" y1="256" x2="186" y2="256"/>
        <line x1="136" y1="278" x2="184" y2="278"/>
      </g>

      {/* ============== OBLIQUES ============== */}
      <Region k="obliques"
        d="M110,180 Q120,200 128,238 L132,288 L132,260 Q128,220 118,200 Q112,188 110,180 Z"
      />
      <Region k="obliques"
        d="M210,180 Q200,200 192,238 L188,288 L188,260 Q192,220 202,200 Q208,188 210,180 Z"
      />

      {/* ============== HIP FLEXORS ============== */}
      <Region k="hip_flex"
        d="M140,290 Q160,288 180,290 L186,316 Q160,322 134,316 Z"
      />

      {/* ============== ADDUCTORS (inner thighs) ============== */}
      <Region k="adductors"
        d="M152,316 Q160,318 168,316 L172,376 L160,378 L148,376 Z"
      />

      {/* ============== QUADS ============== */}
      <Region k="quads"
        d="M118,316 Q140,308 152,316 L150,432 Q138,440 120,436 Q108,400 110,360 Z"
      />
      <Region k="quads"
        d="M202,316 Q180,308 168,316 L170,432 Q182,440 200,436 Q212,400 210,360 Z"
      />
      {/* quad inner ridge */}
      <path d="M134,332 Q132,400 130,432" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="0.8"/>
      <path d="M186,332 Q188,400 190,432" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="0.8"/>

      {/* knees */}
      <ellipse cx="135" cy="442" rx="20" ry="9" fill="#1F2622" stroke={stroke} strokeWidth={strokeWidth}/>
      <ellipse cx="185" cy="442" rx="20" ry="9" fill="#1F2622" stroke={stroke} strokeWidth={strokeWidth}/>

      {/* shins (front of calves — small region) */}
      <path d="M120,452 L150,452 L148,548 L124,548 Z" fill="#1F2622" stroke={stroke} strokeWidth={strokeWidth}/>
      <path d="M170,452 L200,452 L196,548 L172,548 Z" fill="#1F2622" stroke={stroke} strokeWidth={strokeWidth}/>

      {/* feet */}
      <ellipse cx="132" cy="560" rx="16" ry="9" fill="#1F2622" stroke={stroke} strokeWidth={strokeWidth}/>
      <ellipse cx="186" cy="560" rx="16" ry="9" fill="#1F2622" stroke={stroke} strokeWidth={strokeWidth}/>

      {/* sheen */}
      <rect x="0" y="0" width="320" height="600" fill="url(#fSheen)" pointerEvents="none"/>
    </svg>
  );
}

// ---------- DETAILED BACK ANATOMY ----------
export function AnatomyBack({ sets, recently, onRegion, sex='m' }) {
  const fillFor = (key) => {
    const lvl = intensityForV2(sets[key] || 0, TARGETS_V2[key]);
    return RAMP_V2.dark[lvl];
  };
  const stroke = 'rgba(255,255,255,0.12)';
  const strokeWidth = 0.6;

  const Region = ({ k, d }) => (
    <path
      d={d}
      className={`body-region ${recently === k ? 'pulse' : ''}`}
      fill={fillFor(k)}
      stroke={stroke}
      strokeWidth={strokeWidth}
      onClick={(e) => { e.stopPropagation(); onRegion && onRegion(k); }}
      style={{ cursor: 'pointer' }}
      data-muscle={k}
    />
  );

  return (
    <svg viewBox="0 0 320 600" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="bSheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="rgba(0,0,0,0.16)"/>
          <stop offset="0.5" stopColor="rgba(255,255,255,0.06)"/>
          <stop offset="1" stopColor="rgba(255,255,255,0)"/>
        </linearGradient>
      </defs>

      {/* head */}
      <ellipse cx="160" cy="50" rx="28" ry="34" fill="#1F2622" stroke={stroke} strokeWidth={strokeWidth}/>
      <path d="M148,82 L172,82 L176,108 L144,108 Z" fill="#1F2622" stroke={stroke} strokeWidth={strokeWidth}/>

      {/* TRAPS (back, big diamond) */}
      <Region k="traps"
        d="M132,98 Q160,90 188,98 L196,144 Q180,156 160,156 Q140,156 124,144 Z"
      />

      {/* REAR DELTS */}
      <Region k="rear_delt"
        d="M86,124 Q78,140 84,160 Q98,168 116,162 Q124,148 122,132 Q108,120 86,124 Z"
      />
      <Region k="rear_delt"
        d="M234,124 Q242,140 236,160 Q222,168 204,162 Q196,148 198,132 Q212,120 234,124 Z"
      />

      {/* TRICEPS */}
      <Region k="triceps"
        d="M82,144 Q72,184 80,224 L102,224 Q108,184 100,142 Z"
      />
      <Region k="triceps"
        d="M238,144 Q248,184 240,224 L218,224 Q212,184 220,142 Z"
      />

      {/* FOREARMS */}
      <Region k="forearm"
        d="M80,226 L102,226 Q108,262 100,302 L78,306 Q70,262 80,226 Z"
      />
      <Region k="forearm"
        d="M218,226 L240,226 Q250,262 242,306 L220,302 Q212,262 218,226 Z"
      />
      <ellipse cx="88" cy="322" rx="14" ry="18" fill="#1F2622" stroke={stroke} strokeWidth={strokeWidth}/>
      <ellipse cx="232" cy="322" rx="14" ry="18" fill="#1F2622" stroke={stroke} strokeWidth={strokeWidth}/>

      {/* LATS (V-shape) */}
      <Region k="lats"
        d="M118,150 Q160,144 202,150 L210,224 Q170,238 160,238 Q150,238 110,224 Z"
      />

      {/* LOWER BACK */}
      <Region k="lower_back"
        d="M130,238 Q160,234 190,238 L186,288 Q160,294 134,288 Z"
      />
      {/* spinal line */}
      <path d="M160,148 L160,288" stroke="rgba(0,0,0,0.4)" strokeWidth="1.2"/>

      {/* GLUTES */}
      <Region k="glutes"
        d="M118,290 Q160,282 202,290 L196,346 Q160,360 124,346 Z"
      />
      {/* glute crack */}
      <path d="M160,294 L160,344" stroke="rgba(0,0,0,0.4)" strokeWidth="1.2"/>

      {/* HAMSTRINGS */}
      <Region k="hams"
        d="M120,348 Q140,344 152,348 L150,438 Q138,442 120,438 Z"
      />
      <Region k="hams"
        d="M168,348 Q180,344 200,348 L200,438 Q182,442 170,438 Z"
      />

      {/* knees */}
      <ellipse cx="135" cy="446" rx="20" ry="9" fill="#1F2622" stroke={stroke} strokeWidth={strokeWidth}/>
      <ellipse cx="185" cy="446" rx="20" ry="9" fill="#1F2622" stroke={stroke} strokeWidth={strokeWidth}/>

      {/* CALVES */}
      <Region k="calves"
        d="M120,456 Q138,452 150,456 L146,544 Q132,548 122,544 Z"
      />
      <Region k="calves"
        d="M170,456 Q182,452 200,456 L198,544 Q186,548 174,544 Z"
      />

      {/* feet */}
      <ellipse cx="134" cy="560" rx="16" ry="8" fill="#1F2622" stroke={stroke} strokeWidth={strokeWidth}/>
      <ellipse cx="184" cy="560" rx="16" ry="8" fill="#1F2622" stroke={stroke} strokeWidth={strokeWidth}/>

      <rect x="0" y="0" width="320" height="600" fill="url(#bSheen)" pointerEvents="none"/>
    </svg>
  );
}

// 3D wrapper with rotate + zoom on selected muscle
export function Anatomy2DSwivel({ sets, view, recently, focused, onRegion, sex='m' }) {
  const angle = view === 'back' ? 180 : 0;

  // Center points (in viewBox coords) for zoom-to-region
  const REGION_CENTERS = {
    chest: [160, 150], shoulder: [108, 138], rear_delt: [104, 142],
    biceps: [92, 180], triceps: [92, 184],
    forearm: [88, 264], abs: [160, 240], obliques: [122, 230],
    lats: [160, 190], traps: [160, 124], lower_back: [160, 264],
    quads: [135, 374], hams: [134, 392], glutes: [160, 318],
    calves: [134, 500], hip_flex: [160, 304], adductors: [160, 348],
  };

  let scale = 1, tx = 0, ty = 0;
  if (focused) {
    const [cx, cy] = REGION_CENTERS[focused] || [160, 300];
    scale = 1.85;
    tx = (160 - cx) * scale;
    ty = (300 - cy) * scale;
  }

  return (
    <div
      className="anatomy-3d"
      style={{
        transform: `translate(${tx}px, ${ty}px) scale(${scale}) rotateY(${angle}deg)`,
        transformStyle: 'preserve-3d',
      }}
    >
      <div className="body-face front">
        <AnatomyFront sets={sets} recently={recently} onRegion={onRegion} sex={sex}/>
      </div>
      <div className="body-face back">
        <AnatomyBack sets={sets} recently={recently} onRegion={onRegion} sex={sex}/>
      </div>
    </div>
  );
}

