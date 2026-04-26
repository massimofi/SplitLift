// Toast list rendered fixed at the bottom of the app. Push messages via the
// showToast(...) callback handed to tabs/sheets.

import React from 'react';

export function Toaster({ toasts }) {
  if (!toasts || toasts.length === 0) return null;
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.leaving ? 'leaving' : ''}`}>{t.msg}</div>
      ))}
    </div>
  );
}
