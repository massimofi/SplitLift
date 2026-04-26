// Animated thumbnail for an EXERCISE id. Alternates 0.jpg and 1.jpg from
// free-exercise-db every 600ms. Lazy-loads via native <img loading="lazy">.
// Falls back to a dumbbell glyph if no slug is mapped or the image 404s.

import React, { useEffect, useState } from 'react';
import { EXERCISE_IMAGES, EXERCISE_IMAGE_BASE } from '../data/exerciseImages.js';
import { DumbbellGlyph } from './Brand.jsx';

export function ExerciseGif({ exId, size = 48, round = true }) {
  const slug = EXERCISE_IMAGES[exId];
  const [frame, setFrame] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    setFrame(0);
    if (!slug) return undefined;
    const t = setInterval(() => setFrame(f => 1 - f), 600);
    return () => clearInterval(t);
  }, [slug]);

  const cls = `ex-gif ${round ? 'round' : ''}`;
  const style = { width: size, height: size };

  if (!slug || failed) {
    return (
      <div className={`${cls} placeholder`} style={style} aria-hidden="true">
        <DumbbellGlyph size={Math.round(size * 0.5)} stroke="var(--ink-3)"/>
      </div>
    );
  }

  const src = `${EXERCISE_IMAGE_BASE}/${slug}/images/${frame}.jpg`;
  return (
    <img
      className={cls}
      style={style}
      src={src}
      alt=""
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
