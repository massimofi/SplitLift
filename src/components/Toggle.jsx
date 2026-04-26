// Toggle — segmented pill switch (front/back, kg/lb, etc.)
// v11.6 Issue 5: pill position + width now read from the active button's
// actual bounding rect after layout, instead of trying to compute it from
// 100/N math. Handles uneven label widths (e.g. Coach tone "Gentle" vs
// "Balanced" vs "Drill") without any centering drift.

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

export function Toggle({ value, onChange, options, size = 'md', className = '' }) {
  const idx = Math.max(0, options.findIndex(o => o.value === value));
  const cls = ['sl-toggle', className].filter(Boolean).join(' ');
  const containerRef = useRef(null);
  const btnRefs = useRef([]);
  const [pillRect, setPillRect] = useState(null);  // { left, width } in px

  // Measure the active button after every render. useLayoutEffect runs
  // before paint so the pill never appears in the wrong spot.
  useLayoutEffect(() => {
    const btn = btnRefs.current[idx];
    const container = containerRef.current;
    if (!btn || !container) return;
    const containerLeft = container.getBoundingClientRect().left;
    const r = btn.getBoundingClientRect();
    setPillRect({ left: r.left - containerLeft, width: r.width });
  }, [idx, options.length, value]);

  // Re-measure on resize (orientation, window resize, font load).
  useEffect(() => {
    const onResize = () => {
      const btn = btnRefs.current[idx];
      const container = containerRef.current;
      if (!btn || !container) return;
      const containerLeft = container.getBoundingClientRect().left;
      const r = btn.getBoundingClientRect();
      setPillRect({ left: r.left - containerLeft, width: r.width });
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [idx]);

  return (
    <div ref={containerRef} className={cls} data-size={size} role="tablist">
      <div
        className="sl-toggle-pill"
        style={pillRect
          ? { width: `${pillRect.width}px`, transform: `translateX(${pillRect.left}px)`, left: 0 }
          : { width: `${100 / options.length}%`, left: `${(idx * 100) / options.length}%` }
        }
      />
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => { btnRefs.current[i] = el; }}
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
