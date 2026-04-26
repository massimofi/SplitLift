// Fake iPhone status bar — just decoration so the simulated phone looks real.

import React from 'react';

export function StatusBar({ dark = false }) {
  return (
    <div className={`statusbar ${dark ? 'dark' : ''}`}>
      <span>9:41</span>
      <div className="icons">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="9" width="3" height="3"/><rect x="5" y="6" width="3" height="6"/><rect x="10" y="3" width="3" height="9"/><rect x="15" y="0" width="3" height="12"/></svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 5a8 8 0 0 1 12 0M4.5 7.5a4.5 4.5 0 0 1 7 0"/><circle cx="8" cy="10" r="1" fill="currentColor"/></svg>
        <svg width="24" height="12" viewBox="0 0 24 12" fill="none"><rect x="1" y="2" width="20" height="8" rx="2" stroke="currentColor"/><rect x="3" y="4" width="14" height="4" fill="currentColor"/><rect x="22" y="4.5" width="1.5" height="3" fill="currentColor"/></svg>
      </div>
    </div>
  );
}
