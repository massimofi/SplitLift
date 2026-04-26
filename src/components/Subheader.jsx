// Subheader — consistent section heading above grids/lists.
// Use `gradient` to fill the text with the priority gradient.

import React from 'react';

export function Subheader({ children, gradient = false, className = '', as: Tag = 'h2', ...rest }) {
  const cls = ['sl-subheader', gradient && 'grad-text', className].filter(Boolean).join(' ');
  return <Tag className={cls} {...rest}>{children}</Tag>;
}
