// Body tab — react-body-highlighter SVG with click-to-zoom + weak-spots tour.
// The body is the centerpiece: 60vh of stage normally, 40vh + bottom-half
// drawer when zoomed.

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { EXERCISES, SPORTS, DAY_TYPES } from '../data/exercises.js';
import {
  MUSCLE_LABELS_V2, TARGETS_V2,
  computeCoverageV2, exercisesForMuscle,
} from '../components/Anatomy2D.jsx';
import { bestSplitTypeFor } from '../lib/splits.js';
import { IconX, IconPlus } from '../components/Icons.jsx';
import { I } from '../components/Icons.jsx';
import { ExerciseGif } from '../components/ExerciseGif.jsx';
import { AnatomyBody } from '../components/AnatomyBody.jsx';
import { Target } from 'lucide-react';
import { Subheader } from '../components/Subheader.jsx';

// Coverage-status gradient palettes for the muscle coverage list cards.
const COV_GRAD = {
  unworked: { '--gw-1':'#666880', '--gw-2':'#444663', '--gw-base':'#1f2238' },
  under:    { '--gw-1':'#FF8C42', '--gw-2':'#FF4444', '--gw-base':'#5b1e0e' },
  optimal:  { '--gw-1':'#4ED9C0', '--gw-2':'#00c896', '--gw-base':'#0e3d35' },
  over:     { '--gw-1':'#FF8A5B', '--gw-2':'#FF6BD6', '--gw-base':'#5b1e2c' },
  unknown:  { '--gw-1':'#666880', '--gw-2':'#444663', '--gw-base':'#1f2238' },
};

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
  const [tourActive, setTourActive] = useState(false);
  const tourCancelRef = useRef(false);

  const sets = useMemo(() => computeCoverageV2(days), [days]);

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
    if (tourActive) return; // ignore manual clicks during tour
    setFocus(k);
    if (hintShown) dismissHint();
  };
  const close = () => {
    if (tourActive) {
      tourCancelRef.current = true;
      setTourActive(false);
    }
    setFocus(null);
  };

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

  // ---- Find my weak spots tour ----
  const startTour = () => {
    if (tourActive) return;
    // Compute the 3 worst-covered muscles (lowest sets/target.min ratio).
    const ranked = Object.keys(MUSCLE_LABELS_V2)
      .filter(k => TARGETS_V2[k])
      .map(k => ({ k, ratio: (sets[k] || 0) / Math.max(1, TARGETS_V2[k].min) }))
      .sort((a, b) => a.ratio - b.ratio)
      .slice(0, 3);
    if (ranked.length === 0) return;

    setTourActive(true);
    tourCancelRef.current = false;
    if (hintShown) dismissHint();

    let i = 0;
    const tick = () => {
      if (tourCancelRef.current) return;
      if (i >= ranked.length) {
        setTourActive(false);
        setFocus(null);
        return;
      }
      setFocus(ranked[i].k);
      i++;
      setTimeout(tick, 2200);
    };
    tick();
  };

  const COV_KEYS = ['chest','lats','traps','rear_delt','biceps','triceps','shoulder','abs','quads','hams','glutes','calves'];

  return (
    <div className={`tab-pane body2 ${focus ? 'is-zoomed' : ''}`}>
      <div className="b2-toolbar">
        <div className="fb-toggle">
          <div className="fb-pill" style={{ transform: `translateX(${view==='back' ? 100 : 0}%)` }}/>
          <button className={view==='front'?'on':''} onClick={()=>setView('front')}>Front</button>
          <button className={view==='back'?'on':''} onClick={()=>setView('back')}>Back</button>
        </div>
      </div>
      <button className={`weak-spots-btn ${tourActive ? 'active' : ''}`} onClick={startTour} disabled={tourActive}>
        <Target size={20} strokeWidth={2.4}/>
        <span>Find My Weak Spots</span>
      </button>

      <div className={`b2-stage stage-svg ${focus ? 'zoomed' : ''}`}>
        {focus && (
          <button className="b2-back" onClick={close} aria-label="Exit zoom">
            <I.arrowL/> Back
          </button>
        )}
        <AnatomyBody
          coverage={sets}
          targets={TARGETS_V2}
          view={view}
          focused={focus}
          onMuscleClick={onMuscleClick}
        />
        {hintShown && !focus && (
          <div className="b2-intro-hint" onClick={dismissHint}>
            Tap any muscle to see exercises that hit it.
          </div>
        )}
      </div>

      {!focus && (
        <div className="b2-cov">
          <Subheader>Weekly coverage</Subheader>
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
                <button key={m} className={`b2-cov-cell gw status-${st}`}
                  style={{ '--bp': `var(--bp-${colorKey})`, ...(COV_GRAD[st] || COV_GRAD.unknown) }}
                  onClick={() => setFocus(m)}>
                  <div className="m">{MUSCLE_LABELS_V2[m] || m}</div>
                  <div className="s mono">{s} sets</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {focus && (
        <div className="b2-drawer-half" onClick={(e)=>{ if (e.target === e.currentTarget) close(); }}>
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
              {tourActive && <span className="b2-tour-pill mono">TOUR</span>}
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
  const barFill = sets >= min && sets <= max ? '#00c896' : sets > max ? '#ff8a5b' : '#6E6EFF';
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
