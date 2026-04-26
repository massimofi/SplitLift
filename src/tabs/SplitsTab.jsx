// Splits tab — edit one day-type at a time. splitsByType is the source of truth;
// edits propagate to every day with that type via the App's useEffect.

import React, { useState, useEffect, useMemo } from 'react';
import { EXERCISES, DAY_TYPES, setsForExercise, exercisesForDayType } from '../data/exercises.js';
import { IconX, IconPlus } from '../components/Icons.jsx';

export function SplitsTab({ days, splitsByType, setSplitsByType, activeType, setActiveType, profile, showToast }) {
  const [addOpen, setAddOpen] = useState(false);

  const availableTypes = useMemo(() => {
    const seen = [];
    for (const d of days) {
      if (!d || d.rest) continue;
      if (d.type === 'sport' || d.type === 'cardio' || d.type === 'rest') continue;
      if (!seen.includes(d.type)) seen.push(d.type);
    }
    return seen;
  }, [days]);

  useEffect(() => {
    if (availableTypes.length === 0) return;
    if (!availableTypes.includes(activeType)) setActiveType(availableTypes[0]);
  }, [availableTypes, activeType, setActiveType]);

  const exIds = (splitsByType && splitsByType[activeType]) || [];
  const exObjs = exIds.map(id => EXERCISES.find(e => e.id === id)).filter(Boolean);
  const totalSets = exObjs.reduce((s, ex) => s + setsForExercise(ex), 0);
  const dt = DAY_TYPES[activeType] || DAY_TYPES.custom;
  const daysCount = days.filter(d => d && !d.rest && d.type === activeType).length;

  const removeAt = (i) => {
    setSplitsByType(prev => {
      const cur = [...((prev && prev[activeType]) || [])];
      cur.splice(i, 1);
      return { ...(prev || {}), [activeType]: cur };
    });
  };

  const addEx = (exId) => {
    setSplitsByType(prev => {
      const cur = [...((prev && prev[activeType]) || [])];
      if (cur.includes(exId)) return prev;
      cur.push(exId);
      return { ...(prev || {}), [activeType]: cur };
    });
    showToast(`Added to ${dt.label}`);
  };

  if (availableTypes.length === 0) {
    return (
      <div className="tab-pane splits-page">
        <div className="empty-pane">
          <div className="emp-t">No lift days yet</div>
          <div className="emp-s">Open Schedule and drop a Push / Pull / Legs chip onto a day.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-pane splits-page">
      <div className="st-types">
        {availableTypes.map(t => {
          const isActive = t === activeType;
          const dt2 = DAY_TYPES[t] || DAY_TYPES.custom;
          return (
            <button key={t} className={`st-chip ${isActive ? 'on' : ''}`}
              style={{ '--bp': `var(--bp-${t})` }}
              onClick={() => setActiveType(t)}>
              {dt2.label}
            </button>
          );
        })}
      </div>

      <div className="st-head" style={{ '--bp': `var(--bp-${activeType})` }}>
        <div className="st-h-l">
          <div className="st-h-t">{dt.label} day</div>
          <div className="st-h-s mono">{exObjs.length} EX · {totalSets} SETS · {daysCount}× / WK</div>
        </div>
      </div>

      <div className="st-list">
        {exObjs.length === 0 ? (
          <div className="empty-pane">
            <div className="emp-t">No exercises on {dt.label} yet</div>
            <div className="emp-s">Tap the button below to add one.</div>
          </div>
        ) : (
          exObjs.map((ex, i) => (
            <div key={`${ex.id}-${i}`} className="st-ex" style={{ '--bp': `var(--bp-${ex.body || ex.type})` }}>
              <div className="st-ex-body">
                <div className="st-ex-n">{ex.name}</div>
                <div className="st-ex-m mono">{ex.sets} · {ex.gear}</div>
              </div>
              <button className="st-ex-x" onClick={() => removeAt(i)} aria-label={`Remove ${ex.name}`}><IconX/></button>
            </div>
          ))
        )}
      </div>

      <button className="st-add" onClick={() => setAddOpen(true)}>
        <IconPlus/> Add to {dt.label}
      </button>

      {addOpen && (
        <SplitExSheet
          dayType={activeType}
          existing={exIds}
          onAdd={addEx}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  );
}

function SplitExSheet({ dayType, existing, onAdd, onClose }) {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const cands = exercisesForDayType(dayType) || [];
    const ql = q.trim().toLowerCase();
    return ql ? cands.filter(ex => ex.name.toLowerCase().includes(ql)) : cands;
  }, [dayType, q]);
  const dt = DAY_TYPES[dayType] || DAY_TYPES.custom;
  return (
    <div className="ps-overlay" onClick={onClose}>
      <div className="ps-sheet" onClick={e=>e.stopPropagation()}>
        <div className="ps-head">
          <div>
            <div className="ps-t">Add to {dt.label}</div>
            <div className="ps-s mono">{list.length} MATCHING</div>
          </div>
          <button className="ip-x" onClick={onClose} aria-label="Close"><IconX/></button>
        </div>
        <input className="sx-search" placeholder="Search exercises…" value={q} onChange={e=>setQ(e.target.value)}/>
        <div className="sx-list">
          {list.length === 0 && <div className="empty-pane"><div className="emp-t">No matches.</div></div>}
          {list.map(ex => {
            const inUse = existing.includes(ex.id);
            return (
              <button key={ex.id} className={`sx-row ${inUse ? 'in' : ''}`}
                style={{ '--bp': `var(--bp-${ex.body || ex.type})` }}
                onClick={() => !inUse && onAdd(ex.id)}
                disabled={inUse}>
                <div className="sx-body">
                  <div className="sx-n">{ex.name}</div>
                  <div className="sx-m mono">{ex.sets} · {ex.gear}</div>
                </div>
                <span className="sx-add">{inUse ? <IconX/> : <IconPlus/>}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
