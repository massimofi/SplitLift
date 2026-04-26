// localStorage persistence — versioned key so future shape changes don't crash
// the app on old saved state.

const KEY = 'splitlift-state-v1';

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    // Quota / private mode — fail silently; app still works without persist.
    console.warn('persist failed', e);
  }
}

export function clearState() {
  try { localStorage.removeItem(KEY); } catch {}
  try { localStorage.removeItem('sl-dash-order'); } catch {}
}
