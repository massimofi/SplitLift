// Splits tab — edit one day-type at a time. splitsByType is the source of truth;
// edits propagate to every day with that type via the App's useEffect.

import React, { useState, useEffect, useMemo } from 'react';
import { EXERCISES, DAY_TYPES, setsForExercise, exercisesForDayType } from '../data/exercises.js';
import { IconX, IconPlus } from '../components/Icons.jsx';
import { ExerciseGif } from '../components/ExerciseGif.jsx';
import { PresetsSheet } from '../components/PresetsSheet.jsx';
// v11.5: Splits now hosts the Presets browser (moved from Schedule).

// Map any day-type id to a v7 gradient token (matches Schedule's mapping
// per the v8 color semantic table).
function gradVarForDayType(t) {
  switch (t) {
    case 'push': case 'chest':                                   return 'var(--grad-strength)';
    case 'pull': case 'back':                                    return 'var(--grad-info)';
    case 'legs': case 'quads': case 'hams': case 'glutes': case 'calves':
                                                                 return 'var(--grad-priority)';
    case 'shoul': case 'shoulder':                               return 'var(--grad-strength)';
    case 'arms': case 'bis': case 'tris':                        return 'var(--grad-personal)';
    case 'core':                                                 return 'var(--grad-success)';
    case 'cardio':                                               return 'var(--grad-cardio)';
    case 'sport':                                                return 'var(--grad-recovery)';
    case 'upper':                                                return 'var(--grad-strength)';
    case 'lower':                                                return 'var(--grad-recovery)';
    case 'full':                                                 return 'var(--grad-cardio)';
    case 'rest':                                                 return 'var(--grad-muted)';
    default:                                                     return 'var(--grad-priority)';
  }
}

export function SplitsTab({ days, setDays, splitsByType, setSplitsByType, activeType, setActiveType, profile, setProfile, locked, showToast }) {
  const [addOpen, setAddOpen] = useState(false);
  // v11.5 Issue 3 — Presets sheet lives here now (moved from Schedule).
  const [presetsOpen, setPresetsOpen] = useState(false);

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
        <div className="st-types-row" style={{ justifyContent: 'flex-end' }}>
          <button
            className="presets-btn st-presets-btn"
            onClick={() => setPresetsOpen(true)}
            data-testid="splits-presets-btn"
          >
            Presets
          </button>
        </div>
        <div className="empty-pane">
          <div className="emp-t">No lift days yet</div>
          <div className="emp-s">Apply a preset above, or open Schedule and drop a Push / Pull / Legs chip onto a day.</div>
        </div>
        {presetsOpen && (
          <PresetsSheet
            profile={profile}
            setProfile={setProfile}
            locked={locked}
            days={days}
            setDays={setDays}
            splitsByType={splitsByType}
            setSplitsByType={setSplitsByType}
            showToast={showToast}
            onClose={() => setPresetsOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="tab-pane splits-page">
      <div className="st-types-row">
        <div className="st-types">
          {availableTypes.map(t => {
            const isActive = t === activeType;
            const dt2 = DAY_TYPES[t] || DAY_TYPES.custom;
            return (
              <button key={t} className={`st-chip ${isActive ? 'on' : ''}`}
                style={{ '--st-grad': gradVarForDayType(t) }}
                onClick={() => setActiveType(t)}>
                {dt2.label}
              </button>
            );
          })}
        </div>
        <button
          className="presets-btn st-presets-btn"
          onClick={() => setPresetsOpen(true)}
          aria-label="Open presets"
          data-testid="splits-presets-btn"
        >
          Presets
        </button>
      </div>

      <div className="st-head" style={{ '--st-grad': gradVarForDayType(activeType) }}>
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
            <div key={`${ex.id}-${i}`} className="st-ex"
                 style={{ '--st-grad': gradVarForDayType(ex.body || ex.type) }}>
              <ExerciseGif exId={ex.id} size={44}/>
              <div className="st-ex-body">
                <div className="st-ex-n">{ex.name}</div>
                <div className="st-ex-m mono">{ex.sets} · {ex.gear}</div>
              </div>
              <button className="st-ex-x" onClick={() => removeAt(i)} aria-label={`Remove ${ex.name}`}><IconX/></button>
            </div>
          ))
        )}
      </div>

      <button className="st-add" onClick={() => setAddOpen(true)}
              style={{ '--st-grad': gradVarForDayType(activeType) }}>
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

      {presetsOpen && (
        <PresetsSheet
          profile={profile}
          setProfile={setProfile}
          locked={locked}
          days={days}
          setDays={setDays}
          splitsByType={splitsByType}
          setSplitsByType={setSplitsByType}
          showToast={showToast}
          onClose={() => setPresetsOpen(false)}
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
                <ExerciseGif exId={ex.id} size={40}/>
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
