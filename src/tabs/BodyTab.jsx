// Body tab — react-body-highlighter SVG anatomy with click-to-focus drawer.
// We pivoted off the 3D model: stripped mesh names made per-muscle clicking
// unreliable, and the lib gives us a fitness-app silhouette out of the box.

import React, { useState, useEffect, useMemo } from 'react';
import { EXERCISES, SPORTS, DAY_TYPES } from '../data/exercises.js';
import {
  MUSCLE_LABELS_V2, TARGETS_V2,
  computeCoverageV2, exercisesForMuscle,
} from '../components/Anatomy2D.jsx';
import { bestSplitTypeFor } from '../lib/splits.js';
import { IconX, IconPlus } from '../components/Icons.jsx';
import { ExerciseGif } from '../components/ExerciseGif.jsx';
import { AnatomyBody, SLUG_BY_KEY } from '../components/AnatomyBody.jsx';

function statusFromCoverage(sets, target) {
  if (!target) return 'unknown';
  if (sets <= 0) return 'unworked';
  if (sets < target.min) return 'under';
  if (sets <= target.max) return 'optimal';
  return 'over';
}

export default function BodyTab({ days, onAddExercise, setTab, profile, splitsByType, setSplitsByType, setSplitsActiveType, showToast }) {
  const [view, setView] = useState('front');
  const [focus, setFocus] = useState(null);

  const sets = useMemo(() => computeCoverageV2(days), [days]);

  // One-time intro hint
  const [hintShown, setHintShown] = useState(() => {
    try { return !localStorage.getItem('sl-body-hint-seen'); } catch { return false; }
  });
  useEffect(() => {
    if (!hintShown) return;
    const t = setTimeout(() => dismissHint(), 4000);
    return () => clearTimeout(t);
  }, [hintShown]);
  function dismissHint() {
    setHintShown(false);
    try { localStorage.setItem('sl-body-hint-seen', '1'); } catch {}
  }

  const onMuscleClick = (k) => {
    setFocus(k);
    if (hintShown) dismissHint();
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

  // 12 most-relevant muscles for the coverage grid (granular keys).
  // hip_flex omitted — no slug in react-body-highlighter, so it can't be
  // visualized on the model.
  const COV_KEYS = ['chest','lats','traps','rear_delt','biceps','triceps','shoulder','abs','quads','hams','glutes','calves'];

  return (
    <div className="tab-pane body2">
      <div className="b2-toolbar">
        <div className="b2-segs">
          <button className={view==='front'?'on':''} onClick={()=>setView('front')}>Front</button>
          <button className={view==='back'?'on':''} onClick={()=>setView('back')}>Back</button>
        </div>
        <div className="b2-hint mono">TAP A MUSCLE</div>
      </div>

      <div className="b2-stage stage-svg">
        <AnatomyBody
          coverage={sets}
          targets={TARGETS_V2}
          view={view}
          onMuscleClick={onMuscleClick}
        />
        {hintShown && (
          <div className="b2-intro-hint" onClick={dismissHint}>
            Tap any muscle to see exercises that hit it.
          </div>
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
                  <ExerciseGif exId={ex.id} size={42}/>
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
