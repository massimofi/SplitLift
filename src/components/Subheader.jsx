// Subheader — consistent section heading above grids/lists.
//
// Optional subtitle prop renders a readable secondary line below the
// heading (Satoshi 15px / 500 / -0.01em / 1.4 lh / --ink-3 per v9 spec).

import React from 'react';

export function Subheader({ children, subtitle, gradient = false, className = '', as: Tag = 'h2', ...rest }) {
  const cls = ['sl-subheader', gradient && 'grad-text', className].filter(Boolean).join(' ');
  if (!subtitle) {
    return <Tag className={cls} {...rest}>{children}</Tag>;
  }
  return (
    <div className="sl-subheader-block">
      <Tag className={cls} {...rest}>{children}</Tag>
      <p className="sl-subheader-sub">{subtitle}</p>
    </div>
  );
}
