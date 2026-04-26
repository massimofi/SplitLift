// Toggle — segmented pill switch (front/back, kg/lb, etc.)
// Renders n options as buttons with a sliding pill behind the active one.

import React from 'react';

export function Toggle({ value, onChange, options, size = 'md', className = '' }) {
  const idx = Math.max(0, options.findIndex(o => o.value === value));
  const cls = ['sl-toggle', className].filter(Boolean).join(' ');
  return (
    <div className={cls} data-size={size} role="tablist">
      <div
        className="sl-toggle-pill"
        style={{
          width: `calc(${100 / options.length}% - 4px)`,
          transform: `translateX(calc(${idx * 100}% + 2px))`,
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
