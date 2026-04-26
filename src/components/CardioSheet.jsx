// Cardio library bottom-sheet — pick a session and a target day. Largely
// superseded by the Schedule day-picker but kept available.

import React, { useState, useEffect } from 'react';
import { CARDIO_LIBRARY, CARDIO_TYPES, DAY_NAMES } from '../data/exercises.js';
import { I } from './Icons.jsx';

export function CardioSheet({ open, onClose, onAdd, defaultDay }) {
  const [targetDay, setTargetDay] = useState(defaultDay ?? 0);
  const [filter, setFilter] = useState('all');
  useEffect(() => { if (open && defaultDay !== undefined) setTargetDay(defaultDay); }, [open, defaultDay]);
  const filtered = CARDIO_LIBRARY.filter(c => filter === 'all' || c.type === filter);
  const types = [{id:'all',label:'All'}, ...Object.entries(CARDIO_TYPES).map(([id,v]) => ({id,label:v.label}))];
  return (
    <>
      <div className={`sheet-overlay ${open?'open':''}`} onClick={onClose}/>
      <div className={`sheet ${open?'open':''}`}>
        <div className="sheet-handle"/>
        <div className="sheet-head">
          <h2 className="sheet-title">Cardio library</h2>
          <p className="sheet-sub">Pick a session for any day.</p>
          <div className="day-target-prompt"><span className="b">Adding to:</span> {DAY_NAMES[targetDay]}</div>
          <div className="day-picker-row">
            {DAY_NAMES.map((d, i) => (<button key={i} className={targetDay===i?'active':''} onClick={()=>setTargetDay(i)}>{d}</button>))}
          </div>
          <div className="chip-row">
            {types.map(t => {
              const c = t.id === 'all' ? 'var(--ink-2)' : (CARDIO_TYPES[t.id]?.color || 'var(--ink-2)');
              const cnt = t.id === 'all'
                ? CARDIO_LIBRARY.length
                : CARDIO_LIBRARY.filter(x => x.type === t.id).length;
              return (
                <button key={t.id} className={`chip ${filter===t.id?'active':''}`}
                  style={{ '--bp': c }}
                  onClick={()=>setFilter(t.id)}>
                  {t.label}<span className="count">{cnt}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="sheet-body">
          {filtered.map(c => {
            const t = CARDIO_TYPES[c.type];
            return (
              <div key={c.id} className="lib-row" style={{ '--bp': t.color }} onClick={()=>onAdd(c.id, targetDay)}>
                <div className="body">
                  <div className="name">{c.name}</div>
                  <div className="meta">
                    <span className="bp-tag">{t.label}</span>
                    <span>{c.dur} min{c.dist > 0 ? ` · ${c.dist} ${c.unit}` : ''}</span>
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
