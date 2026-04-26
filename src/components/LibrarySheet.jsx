// Library bottom-sheet: searchable EXERCISES with day-target picker + body filter.
// Reachable from CmdK (which calls onAdd to add to today) and as a fallback from
// other surfaces. Not the primary editor — that's SplitsTab.

import React, { useState, useEffect } from 'react';
import { EXERCISES, FILTER_CHIPS, DAY_NAMES, TYPE_LABELS, DAY_TYPES } from '../data/exercises.js';
import { I } from './Icons.jsx';

export function LibrarySheet({ open, onClose, onAdd, days, defaultDay }) {
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [targetDay, setTargetDay] = useState(defaultDay ?? 0);
  useEffect(() => { if (open && defaultDay !== undefined && defaultDay !== null) setTargetDay(defaultDay); }, [open, defaultDay]);
  const filtered = EXERCISES.filter(ex => {
    if (filter !== 'all' && ex.body !== filter) return false;
    if (q.trim() && !ex.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  const targetDayObj = days[targetDay];
  return (
    <>
      <div className={`sheet-overlay ${open?'open':''}`} onClick={onClose}/>
      <div className={`sheet ${open?'open':''}`}>
        <div className="sheet-handle"/>
        <div className="sheet-head">
          <h2 className="sheet-title">Exercise library</h2>
          <p className="sheet-sub">Tap to add. Color = lift type.</p>
          <input className="sheet-search" placeholder="Search exercises…" value={q} onChange={(e)=>setQ(e.target.value)}/>
          <div className="day-target-prompt"><span className="b">Adding to:</span> {DAY_NAMES[targetDay]} · {targetDayObj?.focus || 'Rest'}</div>
          <div className="day-picker-row">
            {DAY_NAMES.map((d, i) => (<button key={i} className={targetDay===i?'active':''} onClick={()=>setTargetDay(i)}>{d}</button>))}
          </div>
          <div className="chip-row">
            {FILTER_CHIPS.map(c => {
              const bpColor = c.id === 'all' ? 'var(--ink-2)' : `var(--bp-${c.id})`;
              const cnt = c.id === 'all'
                ? EXERCISES.length
                : EXERCISES.filter(e => e.body === c.id).length;
              return (
                <button key={c.id} className={`chip ${filter===c.id?'active':''}`}
                  style={{ '--bp': bpColor }}
                  onClick={()=>setFilter(c.id)}>
                  {c.label}<span className="count">{cnt}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="sheet-body">
          {filtered.map(ex => {
            const bpColor = `var(--bp-${ex.body || ex.type})`;
            const bpLabel = (DAY_TYPES?.[ex.body]?.label) || TYPE_LABELS[ex.type]?.label;
            return (
              <div key={ex.id} className="lib-row" style={{ '--bp': bpColor }} onClick={()=>onAdd(ex.id, targetDay)}>
                <div className="body">
                  <div className="name">{ex.name}</div>
                  <div className="meta">
                    <span className="bp-tag">{bpLabel}</span>
                    <span>{ex.sets}</span>
                    <span>· {ex.gear}</span>
                  </div>
                </div>
                <button className="add"><I.plus/></button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
