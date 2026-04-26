// Chip — color-filled pill for filters, status, day-types.
// tone: neutral | accent | success | warning | danger | info | personal
// Or pass `gradient="push"` etc. for a gradient-filled chip.

import React from 'react';

export function Chip({
  tone = 'neutral',
  gradient,
  size = 'md',
  active = false,
  className = '',
  children,
  ...rest
}) {
  const cls = ['sl-chip', active && 'is-active', className].filter(Boolean).join(' ');
  return (
    <span
      className={cls}
      data-tone={tone}
      data-grad={gradient || undefined}
      data-size={size}
      {...rest}
    >
      {children}
    </span>
  );
}
