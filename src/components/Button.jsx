// Button — primary / secondary / ghost / gradient.
// Sizes: sm | md | lg.
// gradient prop maps to --grad-* tokens (use with variant="gradient").

import React from 'react';

export function Button({
  variant = 'primary',
  gradient = 'priority',
  size = 'md',
  fullWidth = false,
  iconLeft,
  iconRight,
  className = '',
  style,
  children,
  ...rest
}) {
  const cls = ['sl-btn', fullWidth && 'is-full', className].filter(Boolean).join(' ');
  return (
    <button
      className={cls}
      data-variant={variant}
      data-grad={variant === 'gradient' ? gradient : undefined}
      data-size={size}
      style={style}
      {...rest}
    >
      {iconLeft && <span className="sl-btn-ico left">{iconLeft}</span>}
      <span className="sl-btn-label">{children}</span>
      {iconRight && <span className="sl-btn-ico right">{iconRight}</span>}
    </button>
  );
}
