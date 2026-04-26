// Helpers for the splitsByType data model + day construction.
// splitsByType is the source of truth for "what's in a Push day" / Pull day / etc.

import { SPORTS, EXERCISES, exercisesForDayType, DAY_TYPES } from '../data/exercises.js';
import { SPLIT_TEMPLATES } from '../data/templates.js';

// Take the first occurrence of each type's exIds. If a sport has two Push days
// with different exercises, the second loses — that's the canonical model.
export function splitsByTypeFromDays(days) {
  const out = {};
  for (const d of days || []) {
    if (!d || d.rest || !d.type) continue;
    if (out[d.type]) continue;
    out[d.type] = [...(d.exIds || [])];
  }
  return out;
}

// Apply splitsByType to days[]: every non-rest day with a known type gets that
// type's canonical exercise list copied in.
export function applySplitsByTypeToDays(days, splitsByType) {
  if (!splitsByType) return days;
  return days.map(d => {
    if (!d || d.rest) return d;
    const list = splitsByType[d.type];
    if (!list) return d;
    return { ...d, exIds: [...list] };
  });
}

// Build a day object for a given type. If a saved split-list exists for this
// type, reuse it. Otherwise fall back to a sport-priority pick of 4 exercises.
export function makeDayForType(typeId, profile, splitsByType) {
  if (typeId === 'rest') return { type:'rest', focus:'Rest', exIds:[], rest:true, restNote:'Recovery is where adaptation happens.' };
  if (typeId === 'sport') return { type:'sport', focus:'Sport', exIds:[], rest:true, restNote:`${SPORTS.find(s=>s.id===profile.sport)?.label || 'Sport'} practice — coverage handled on the field.` };
  if (splitsByType && splitsByType[typeId] && splitsByType[typeId].length > 0) {
    return { type: typeId, focus: DAY_TYPES[typeId]?.label || typeId, exIds: [...splitsByType[typeId]] };
  }
  const sp = SPORTS.find(s => s.id === profile.sport) || SPORTS[0];
  const priority = sp.priority || {};
  const score = (ex) => {
    let s = 0;
    for (const [m, w] of Object.entries(ex.hits)) s += (priority[m] || 1) * w;
    return s;
  };
  const candidates = exercisesForDayType(typeId).filter(e => e.type !== 'cardio');
  const ranked = candidates.map(e => ({e, s: score(e)})).sort((a,b)=>b.s-a.s);
  const picked = []; const seenBody = new Set();
  for (const {e} of ranked) {
    if (seenBody.has(e.body)) continue;
    picked.push(e.id); seenBody.add(e.body);
    if (picked.length >= 4) break;
  }
  if (picked.length < 4) for (const {e} of ranked) {
    if (picked.includes(e.id)) continue;
    picked.push(e.id); if (picked.length>=4) break;
  }
  return { type: typeId, focus: DAY_TYPES[typeId]?.label || typeId, exIds: picked };
}

// Find the best split-type to add an exercise into, given what splits exist.
export function bestSplitTypeFor(ex, splitsByType) {
  if (!ex || !splitsByType) return null;
  const candidates = ({
    push:  ['push','upper','full','chest'],
    pull:  ['pull','upper','full','back'],
    legs:  ['legs','lower','full','quads','hams','glutes'],
    shoul: ['push','upper','shoulder'],
    core:  ['core','full'],
    cardio:[],
  })[ex.type] || [ex.type];
  for (const t of candidates) if (splitsByType[t] !== undefined) return t;
  return null;
}

// Detect the user's current split pattern by matching the day-type sequence
// against known templates; falls back to a slash-joined list of distinct types.
export function currentSplitName(days) {
  const dayTypes = (days || []).map(d => (d && (d.rest ? 'rest' : d.type)) || 'rest').join(',');
  for (const t of SPLIT_TEMPLATES) {
    if (t.id === 'custom') continue;
    if (t.days.join(',') === dayTypes) return t.name;
  }
  const seen = [];
  for (const d of days || []) {
    if (!d || d.rest || !d.type) continue;
    if (d.type === 'sport' || d.type === 'cardio') continue;
    if (!seen.includes(d.type)) seen.push(d.type);
  }
  if (seen.length === 0) return 'Custom';
  return seen.map(t => DAY_TYPES[t]?.label || t).join(' / ');
}
