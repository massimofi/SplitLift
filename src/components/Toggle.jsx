// Toggle — segmented pill switch (front/back, kg/lb, etc.)
// Renders n options as buttons with a sliding pill behind the active one.

import React from 'react';

export function Toggle({ value, onChange, options, size = 'md', className = '' }) {
  const idx = Math.max(0, options.findIndex(o => o.value === value));
  const cls = ['sl-toggle', className].filter(Boolean).join(' ');
  return (
    <div className={cls} data-size={size} role="tablist">
      {/* v11 Issue 5 — REAL root cause:
          parent had padding:2px, which makes absolute-positioned
          children measure % against the padding-box (excludes 4px).
          Subtracting 4px from the pill width on top of that put the
          pill's right edge ~2px LEFT of the active option's center.
          Fix: parent padding is now 0, pill spans exactly 100/N% of
          parent and starts at idx*100/N% — no offsets, no fudge.
          Tested at N=2, N=3, N=4 (see tests/smoke.spec.js). */}
      <div
        className="sl-toggle-pill"
        style={{
          width: `${100 / options.length}%`,
          left: `${(idx * 100) / options.length}%`,
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
