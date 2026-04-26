// SplitLift split templates + sport-aware ranking + planForSport.

import { SPORTS, DAY_TYPES, exercisesForDayType } from './exercises.js';

export const SPLIT_TEMPLATES = [
  { id:'full2',  name:'Full body × 2',          sub:'2-day generalist. Minimum effective dose.',
    days:['full','rest','rest','full','rest','rest','rest'],     level:'beginner' },
  { id:'full3',  name:'Full body × 3',          sub:'3-day generalist. Big bang for buck.',
    days:['full','rest','full','rest','full','rest','rest'],     level:'beginner' },
  { id:'ppl3',   name:'Push / Pull / Legs × 3', sub:'Lean PPL for a 3-day lifter.',
    days:['push','rest','pull','rest','legs','rest','rest'],     level:'intermediate' },
  { id:'ulhalf', name:'Upper / Lower',          sub:'4-day, balanced and time-efficient.',
    days:['upper','lower','rest','upper','lower','rest','rest'], level:'intermediate' },
  { id:'ppl5',   name:'PPL × 5',                sub:'5-day PPL with one repeat + rest.',
    days:['push','pull','legs','push','pull','rest','rest'],     level:'intermediate' },
  { id:'bro',    name:'Bro split',              sub:'5-day body-part split. Volume per group.',
    days:['chest','back','shoulder','arms','legs','rest','rest'],level:'intermediate' },
  { id:'ulppl',  name:'UL + PPL hybrid',        sub:'5-day. Upper, lower, then PPL.',
    days:['upper','lower','push','pull','legs','rest','rest'],   level:'advanced' },
  { id:'ppl',    name:'Push / Pull / Legs',     sub:'Classic 6-day. The crowd favorite.',
    days:['push','pull','legs','push','pull','legs','rest'],     level:'advanced' },
  { id:'sport4', name:'Sport-focused × 4',      sub:'2 lift + 2 cardio + sport practice.',
    days:['lower','sport','upper','rest','full','sport','rest'], level:'athlete' },
  { id:'custom', name:'Custom',                 sub:'Build it yourself, day by day.',
    days:['rest','rest','rest','rest','rest','rest','rest'],     level:'any' },
];

// Rough mapping of day-types to the muscle groups they primarily cover.
// Used only for sport-fit ranking — not for set-counting (that uses real exercise hits).
export const DAY_TYPE_MUSCLES = {
  push:    ['chest','shoulder','tris'],
  pull:    ['back','bis'],
  legs:    ['quads','hams','glutes','calves'],
  upper:   ['chest','back','shoulder','bis','tris'],
  lower:   ['quads','hams','glutes','calves'],
  full:    ['chest','back','shoulder','quads','glutes','core'],
  chest:   ['chest'],
  back:    ['back'],
  shoulder:['shoulder'],
  arms:    ['bis','tris'],
  bis:     ['bis'],
  tris:    ['tris'],
  quads:   ['quads'],
  hams:    ['hams'],
  glutes:  ['glutes'],
  calves:  ['calves'],
  core:    ['core'],
  cardio:  [],
  sport:   [],
  rest:    [],
  custom:  [],
};

export function templateLiftDays(tpl) {
  return tpl.days.filter(d => d !== 'rest').length;
}

export function templateMuscleCount(tpl) {
  const out = {};
  for (const dt of tpl.days) {
    for (const m of (DAY_TYPE_MUSCLES[dt] || [])) {
      out[m] = (out[m] || 0) + 1;
    }
  }
  return out;
}

// Score a template against a sport's muscle priorities. Higher = better fit.
export function scoreTemplateForSport(tpl, sport) {
  const priority = sport.priority || {};
  const counts = templateMuscleCount(tpl);
  let s = 0;
  for (const [muscle, count] of Object.entries(counts)) {
    s += count * (priority[muscle] || 1);
  }
  return s;
}

// Rank all templates for a given sport id + target days/week.
// Returns the top `limit` as [{ tpl, score, liftDays, fit }].
export function rankTemplatesForSport({ sport, days, limit = 3 }) {
  const sportId = (sport && sport.id) || sport;
  const sp = SPORTS.find(s => s.id === sportId) ||
             { id: sportId, priority: {}, daysHint: days || 4 };
  const targetDays = days || sp.daysHint || 4;

  return SPLIT_TEMPLATES
    .filter(t => t.id !== 'custom')
    .map(tpl => {
      const liftDays = templateLiftDays(tpl);
      const dayDelta = Math.abs(liftDays - targetDays);
      // Days fit drops 18% per day off-target, floors at 0.
      const fit = Math.max(0, 1 - dayDelta * 0.18);
      const raw = scoreTemplateForSport(tpl, sp);
      // Half base score + half fit-weighted, so a perfectly-fitted weak template
      // can't beat a strong one that's only one day off.
      return { tpl, score: raw * (0.5 + 0.5 * fit), liftDays, fit };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

// ---------- SPORT-AWARE AUTO PLANNER ----------
// Pick a template based on sport + days, then fill each day with exercises
// weighted by sport priorities and the user's body weight (for volume).
export function planForSport({ sport, days = 4, weight = 75, wUnit = 'kg', height = 175, hUnit = 'cm', template = null }) {
  const sp = SPORTS.find(s => s.id === sport) || SPORTS[0];
  const tplId = template || sp.template;
  const tpl = SPLIT_TEMPLATES.find(t => t.id === tplId) || SPLIT_TEMPLATES[0];
  if (!tpl) return [];
  const priority = sp.priority || {};

  const score = (ex) => {
    let s = 0;
    for (const [m, w] of Object.entries(ex.hits)) {
      s += (priority[m] || 1) * w;
    }
    return s;
  };

  return tpl.days.map((dayType) => {
    if (dayType === 'rest') {
      return { type:'rest', focus:'Rest', exIds:[], rest:true, restNote:'Recovery is where adaptation happens.' };
    }
    if (dayType === 'sport') {
      return { type:'sport', focus:'Sport', exIds:[], rest:true, restNote:`${sp.label} practice — coverage handled on the field.` };
    }
    const candidates = exercisesForDayType(dayType);
    const ranked = candidates
      .filter(e => e.type !== 'cardio')
      .map(e => ({ e, s: score(e) }))
      .sort((a,b) => b.s - a.s);
    const picked = [];
    const seenBody = new Set();
    for (const { e } of ranked) {
      if (seenBody.has(e.body)) continue;
      picked.push(e.id);
      seenBody.add(e.body);
      if (picked.length >= 4) break;
    }
    if (picked.length < 4) {
      for (const { e } of ranked) {
        if (picked.includes(e.id)) continue;
        picked.push(e.id);
        if (picked.length >= 4) break;
      }
    }
    return {
      type: dayType,
      focus: DAY_TYPES[dayType]?.label || dayType,
      exIds: picked,
    };
  });
}
