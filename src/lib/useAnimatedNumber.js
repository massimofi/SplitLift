// Tween a number from its previous value to the new target on every change.
// 60fps via requestAnimationFrame, easeOutCubic. ~30 lines of plain React, no
// library — keeps the bundle tight.

import { useEffect, useRef, useState } from 'react';

export function useAnimatedNumber(target, durationMs = 600) {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  const targetRef = useRef(target);
  const startRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (target === targetRef.current) return;
    fromRef.current = value;
    targetRef.current = target;
    startRef.current = performance.now();

    const tick = () => {
      const t = Math.min(1, (performance.now() - startRef.current) / durationMs);
      const ease = 1 - Math.pow(1 - t, 3);
      const v = fromRef.current + (targetRef.current - fromRef.current) * ease;
      setValue(v);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setValue(targetRef.current);
      }
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return value;
}
