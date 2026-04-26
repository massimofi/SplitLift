// localStorage persistence — versioned key so future shape changes don't
// crash the app on old saved state.
//
// v1 → v2: profile.age replaced by profile.birthday (YYYY-MM-DD).
// v2 → v3: profile gains weightLog [{ date, kg }, …] seeded with today's
//          stored weight if missing.

import { birthdayFromAge } from '../data/exercises.js';

const KEY    = 'splitlift-state-v3';
const KEY_V2 = 'splitlift-state-v2';
const KEY_V1 = 'splitlift-state-v1';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function migrateV1ToV2(v1) {
  if (!v1 || typeof v1 !== 'object') return v1;
  const profile = v1.profile || {};
  if (profile.birthday) return v1;
  return {
    ...v1,
    profile: { ...profile, birthday: birthdayFromAge(profile.age || 22) },
  };
}

function migrateV2ToV3(v2) {
  if (!v2 || typeof v2 !== 'object') return v2;
  const profile = v2.profile || {};
  if (Array.isArray(profile.weightLog) && profile.weightLog.length > 0) return v2;
  // Convert stored weight to kg for the log (canonical unit), even if
  // profile.wUnit is 'lb'. This way the chart can always render in any unit.
  const w = Number(profile.weight) || 74;
  const kg = profile.wUnit === 'lb' ? Math.round(w * 0.4536 * 10) / 10 : w;
  return {
    ...v2,
    profile: {
      ...profile,
      weightLog: [{ date: todayISO(), kg }],
    },
  };
}

export function loadState() {
  try {
    const rawV3 = localStorage.getItem(KEY);
    if (rawV3) return JSON.parse(rawV3);
    // No v3 — try migrating from v2, or v1 → v2 → v3.
    const rawV2 = localStorage.getItem(KEY_V2);
    const rawV1 = localStorage.getItem(KEY_V1);
    let migrated = null;
    if (rawV2) {
      migrated = migrateV2ToV3(JSON.parse(rawV2));
    } else if (rawV1) {
      migrated = migrateV2ToV3(migrateV1ToV2(JSON.parse(rawV1)));
    }
    if (!migrated) return null;
    try {
      localStorage.setItem(KEY, JSON.stringify(migrated));
      localStorage.removeItem(KEY_V1);
      localStorage.removeItem(KEY_V2);
    } catch {}
    return migrated;
  } catch { return null; }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('persist failed', e);
  }
}

export function clearState() {
  try { localStorage.removeItem(KEY); } catch {}
  try { localStorage.removeItem(KEY_V2); } catch {}
  try { localStorage.removeItem(KEY_V1); } catch {}
  try { localStorage.removeItem('sl-dash-order'); } catch {}
  try { localStorage.removeItem('sl-body-hint-seen'); } catch {}
}
