// localStorage persistence — versioned key so future shape changes don't crash
// the app on old saved state.
//
// v1 → v2 migration: profile.age is replaced by profile.birthday (YYYY-MM-DD).
// On load, if v1 state exists, we synthesize a birthday from `today - age`
// years and write v2 forward. v1 key is deleted to keep storage clean.

import { birthdayFromAge } from '../data/exercises.js';

const KEY    = 'splitlift-state-v2';
const KEY_V1 = 'splitlift-state-v1';

function migrateV1ToV2(v1) {
  if (!v1 || typeof v1 !== 'object') return v1;
  const profile = v1.profile || {};
  if (profile.birthday) return v1; // already migrated somehow
  const next = {
    ...v1,
    profile: {
      ...profile,
      birthday: birthdayFromAge(profile.age || 22),
    },
  };
  // Don't delete profile.age — keep it as a fallback / breadcrumb so anything
  // that still reads it during the same render doesn't see undefined.
  return next;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
    // No v2 → look for v1 + migrate.
    const rawV1 = localStorage.getItem(KEY_V1);
    if (!rawV1) return null;
    const v1 = JSON.parse(rawV1);
    const v2 = migrateV1ToV2(v1);
    try {
      localStorage.setItem(KEY, JSON.stringify(v2));
      localStorage.removeItem(KEY_V1);
    } catch {}
    return v2;
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
  try { localStorage.removeItem(KEY_V1); } catch {}
  try { localStorage.removeItem('sl-dash-order'); } catch {}
  try { localStorage.removeItem('sl-body-hint-seen'); } catch {}
}
