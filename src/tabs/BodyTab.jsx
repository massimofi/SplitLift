// Body tab — 3D anatomy (Phase 2 swap-in) with 2D fallback. Phase 1 ships
// with 2D only; the toggle / drawer / coverage list all work either way.

import React, { useState, useEffect, useMemo } from 'react';
import { EXERCISES, SPORTS, DAY_TYPES } from '../data/exercises.js';
import {
  AnatomyFront, AnatomyBack,
  MUSCLE_LABELS_V2, TARGETS_V2,
  computeCoverageV2, exercisesForMuscle,
} from '../components/Anatomy2D.jsx';
import { bestSplitTypeFor } from '../lib/splits.js';
import { IconX, IconPlus } from '../components/Icons.jsx';
// Phase 2 will wire in the R3F 3D anatomy. Phase 1 ships 2D-only by hardcoding
// Anatomy3D = null here; the 3D / 2D toggle is hidden when null.
const Anatomy3D = null;

function statusFromCoverage(sets, target) {
  if (!target) return 'unknown';
  if (sets <= 0) return 'unworked';
  if (sets < target.min) return 'under';
  if (sets <= target.max) return 'optimal';
  return 'over';
}

export function BodyTab({ days, onAddExercise, setTab, profile, splitsByType, setSplitsByType, setSplitsActiveType, showToast }) {
  const has3D = !!Anatomy3D;
  const [mode, setMode] = useState(has3D ? '3d' : '2d');
  const [view, setView] = useState('front');
  const [focus, setFocus] = useState(null);
  const [recently, setRecently] = useState(null);
  const [status3d, setStatus3d] = useState('loading');

  const sets = useMemo(() => computeCoverageV2(days), [days]);

  useEffect(() => {
    if (mode === '3d' && status3d === 'failed') setMode('2d');
  }, [status3d, mode]);

  const onRegion = (k) => {
    setRecently(k); setFocus(k);
    setTimeout(() => setRecently(null), 700);
  };
  const close = () => setFocus(null);

  const sportObj = profile && SPORTS.find(s => s.id === profile.sport);
  const sportPriority = sportObj && sportObj.priority && sportObj.priority[focus];

  const focusedTarget = focus ? TARGETS_V2[focus] : null;
  const focusedSets = focus ? (sets[focus] || 0) : 0;
  const focusedStatus = focus ? statusFromCoverage(focusedSets, focusedTarget) : null;

  const focusedExs = useMemo(() => focus ? exercisesForMuscle(focus).slice(0, 8) : [], [focus]);

  const addSmart = (exId) => {
    const ex = EXERCISES.find(e => e.id === exId);
    if (!ex) return;
    const target = bestSplitTypeFor(ex, splitsByType || {});
    if (target && setSplitsByType) {
      setSplitsByType(prev => {
        const cur = [...((prev && prev[target]) || [])];
        if (cur.includes(exId)) return prev;
        cur.push(exId);
        return { ...(prev || {}), [target]: cur };
      });
      showToast && showToast(`Added to ${DAY_TYPES[target]?.label || target}`);
    } else if (onAddExercise) {
      onAddExercise(exId);
    }
  };

  const editFocusedSplit = () => {
    for (const { ex } of focusedExs) {
      const t = bestSplitTypeFor(ex, splitsByType || {});
      if (t) {
        setSplitsActiveType && setSplitsActiveType(t);
        setTab && setTab('splits');
        close();
        return;
      }
    }
    setTab && setTab('splits');
    close();
  };

  const COV_KEYS = ['chest','lats','traps','rear_delt','biceps','triceps','shoulder','abs','quads','hams','glutes','calves'];

  return (
    <div className="tab-pane body2">
      <div className="b2-toolbar">
        {has3D && (
          <div className="b2-segs">
            <button className={mode==='3d'?'on':''} onClick={()=>setMode('3d')}>3D</button>
            <button className={mode==='2d'?'on':''} onClick={()=>setMode('2d')}>2D</button>
          </div>
        )}
        {mode === '2d' && (
          <div className="b2-segs">
            <button className={view==='front'?'on':''} onClick={()=>setView('front')}>Front</button>
            <button className={view==='back'?'on':''} onClick={()=>setView('back')}>Back</button>
          </div>
        )}
        <div className="b2-hint mono">{mode === '3d' ? 'DRAG · TAP A MUSCLE' : 'TAP A MUSCLE'}</div>
      </div>

      <div className={`b2-stage ${mode === '3d' ? 'stage-3d' : ''}`}>
        {mode === '3d' && Anatomy3D ? (
          <Anatomy3D
            sets={sets}
            targets={TARGETS_V2}
            focused={focus}
            onSelect={onRegion}
            onFallback={()=>setStatus3d('failed')}
          />
        ) : view === 'front' ? (
          <AnatomyFront sets={sets} recently={recently} onRegion={onRegion}/>
        ) : (
          <AnatomyBack sets={sets} recently={recently} onRegion={onRegion}/>
        )}
      </div>

      <div className="b2-cov">
        <div className="b2-cov-h">Weekly coverage</div>
        <div className="b2-cov-grid">
          {COV_KEYS.map(m => {
            const s = sets[m] || 0;
            const t = TARGETS_V2[m];
            const st = statusFromCoverage(s, t);
            const colorKey = m === 'biceps' ? 'bis'
                           : m === 'triceps' ? 'tris'
                           : (m === 'lats' || m === 'traps' || m === 'rear_delt' || m === 'lower_back') ? 'back'
                           : (m === 'abs' || m === 'obliques') ? 'core'
                           : m;
            return (
              <button key={m} className={`b2-cov-cell status-${st}`}
                style={{ '--bp': `var(--bp-${colorKey})` }}
                onClick={() => setFocus(m)}>
                <div className="m">{MUSCLE_LABELS_V2[m] || m}</div>
                <div className="s mono">{s} sets</div>
              </button>
            );
          })}
        </div>
      </div>

      {focus && (
        <div className="b2-drawer" onClick={close}>
          <div className={`b2-drawer-card status-${focusedStatus}`} onClick={e=>e.stopPropagation()}>
            <div className="b2-d-h">
              <div>
                <div className="b2-d-n">{MUSCLE_LABELS_V2[focus] || focus}</div>
                <div className="b2-d-s mono">
                  {focusedSets} SETS · TARGET {focusedTarget?.min}–{focusedTarget?.max}
                </div>
              </div>
              <button className="b2-d-x" onClick={close} aria-label="Close"><IconX/></button>
            </div>

            <div className="b2-d-pills">
              <span className={`b2-status-pill status-${focusedStatus}`}>
                {focusedStatus === 'optimal' ? 'In target band' :
                 focusedStatus === 'under'   ? 'Under-worked' :
                 focusedStatus === 'over'    ? 'Over the band' :
                 focusedStatus === 'unworked'? 'Not hit yet' : 'Unknown'}
              </span>
              {sportPriority && sportPriority > 1 && (
                <span className="b2-priority-pill">Priority for {sportObj.label} ×{sportPriority.toFixed(1)}</span>
              )}
            </div>

            {focusedTarget && (
              <CoverageProgress sets={focusedSets} target={focusedTarget}/>
            )}

            <div className="b2-d-list-h">Top {focusedExs.length} exercises that hit this</div>
            <div className="b2-d-list">
              {focusedExs.length === 0 && (
                <div className="empty-pill" style={{textAlign:'center', padding:14}}>No matching exercises in the library.</div>
              )}
              {focusedExs.map(({ ex, weight }) => (
                <div key={ex.id} className="b2-d-row" style={{ '--bp': `var(--bp-${ex.body || ex.type})` }}>
                  <div className="b2-d-r-body">
                    <div className="b2-d-r-n">{ex.name}</div>
                    <div className="b2-d-r-m mono">
                      {ex.sets} · {ex.gear} · {DAY_TYPES[ex.body]?.label || ex.body}
                      {weight && weight > 0 && ` · hit ${Math.round(weight*100)}%`}
                    </div>
                  </div>
                  <button className="b2-d-r-add" onClick={()=>addSmart(ex.id)} aria-label={`Add ${ex.name}`}><IconPlus/></button>
                </div>
              ))}
            </div>

            <button className="b2-d-cta" onClick={editFocusedSplit}>
              Edit relevant split →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CoverageProgress({ sets, target }) {
  const min = target.min;
  const max = target.max;
  const ceiling = Math.max(max * 1.5, sets * 1.05, max + 4);
  const minPct = (min / ceiling) * 100;
  const maxPct = (max / ceiling) * 100;
  const setsPct = Math.min(100, (sets / ceiling) * 100);
  const barFill = sets >= min && sets <= max ? '#4ED9C0' : sets > max ? '#FF8A5B' : '#6E6EFF';
  return (
    <div className="b2-cov-progress">
      <div className="b2-cp-bar">
        <div className="b2-cp-band" style={{ left: `${minPct}%`, width: `${Math.max(0, maxPct - minPct)}%` }}/>
        <div className="b2-cp-fill" style={{ width: `${setsPct}%`, background: barFill }}/>
        <div className="b2-cp-marker" style={{ left: `calc(${setsPct}% - 7px)`, background: barFill }}/>
      </div>
      <div className="b2-cp-labels mono">
        <span>0</span>
        <span style={{ marginLeft: `${minPct - 3}%` }}>{min}</span>
        <span style={{ marginLeft: `${maxPct - minPct - 6}%` }}>{max}</span>
      </div>
    </div>
  );
}
