// SplitLift brand — dumbbell mark + wordmark.
// Two variants:
//   BrandMark    — square dumbbell tile only, used in compact header
//   BrandLockup  — mark + "SplitLift" wordmark, used on landing

import React from 'react';

export function DumbbellGlyph({ size = 22, stroke = 'currentColor', strokeWidth = 2.2 }) {
  // Chunky horizontal dumbbell: two end-weights + bar.
  // Drawn so the silhouette reads at 16px and still feels punchy at 80px.
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none"
         stroke={stroke} strokeWidth={strokeWidth}
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {/* Bar */}
      <path d="M9 16h14"/>
      {/* Left end-weight (outer + inner plates) */}
      <path d="M7 9v14"/>
      <path d="M4 12v8"/>
      {/* Right end-weight */}
      <path d="M25 9v14"/>
      <path d="M28 12v8"/>
    </svg>
  );
}

export function BrandMark({ size = 36 }) {
  // Filled tile with a gradient and the dumbbell glyph centered.
  const inner = Math.round(size * 0.62);
  return (
    <div className="brand-mark" style={{ width: size, height: size }} aria-label="SplitLift">
      <DumbbellGlyph size={inner} stroke="var(--on-accent)" strokeWidth={2.4}/>
    </div>
  );
}

export function BrandLockup({ markSize = 56, showTagline = false }) {
  return (
    <div className="brand-lockup">
      <BrandMark size={markSize}/>
      <div className="brand-text">
        <div className="brand-word">
          <span className="brand-split">Split</span><span className="brand-lift">Lift</span>
        </div>
        {showTagline && <div className="brand-tag mono">SPORT · SPLIT · SCORE</div>}
      </div>
    </div>
  );
}

