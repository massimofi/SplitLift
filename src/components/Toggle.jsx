// Toggle — segmented pill switch (front/back, kg/lb, etc.)
// Renders n options as buttons with a sliding pill behind the active one.

import React from 'react';

export function Toggle({ value, onChange, options, size = 'md', className = '' }) {
  const idx = Math.max(0, options.findIndex(o => o.value === value));
  const cls = ['sl-toggle', className].filter(Boolean).join(' ');
  return (
    <div className={cls} data-size={size} role="tablist">
      {/* WHY: previous transform used `idx * 100%` of pill width, but pill
          width is only 1/N of parent. For 3+ options the pill drifts left
          and exposes part of the active label (Coach tone bug). Position
          via left as a % of parent width so it always lines up. */}
      <div
        className="sl-toggle-pill"
        style={{
          width: `calc(${100 / options.length}% - 4px)`,
          left: `calc(${(idx * 100) / options.length}% + 2px)`,
        }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          className={`sl-toggle-btn ${o.value === value ? 'is-on' : ''}`}
          onClick={() => onChange(o.value)}
          role="tab"
          aria-selected={o.value === value}
          type="button"
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
