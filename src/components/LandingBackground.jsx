// Animated landing background — three layers, all CSS + SVG.
// Only mounts on the Landing screen; other screens get a static gradient.
//
// Layer 1: three large blurred radial blobs drifting (20s loop)
// Layer 2: subtle SVG grid lines drifting horizontally (30s loop)
// Layer 3: 3 glassy floating orbs (12s loop)
//
// Performance note: filter:blur and backdrop-filter are GPU-accelerated on
// modern phones. We only animate transform, not size/position, so the
// layers stay 60fps.

import React from 'react';

export function LandingBackground() {
  return (
    <div className="lp-bg" aria-hidden="true">
      <div className="lp-blob lp-b1"/>
      <div className="lp-blob lp-b2"/>
      <div className="lp-blob lp-b3"/>
      <svg className="lp-grid" width="100%" height="100%">
        <defs>
          <pattern id="lpGrid" width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M 56 0 L 0 0 0 56" fill="none" stroke="white" strokeOpacity="0.08" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#lpGrid)"/>
      </svg>
      <div className="lp-orbs">
        <div className="lp-orb"/>
        <div className="lp-orb"/>
        <div className="lp-orb"/>
      </div>
    </div>
  );
}
