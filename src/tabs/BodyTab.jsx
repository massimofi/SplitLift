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
import { Card } from '../components/Card.jsx';
import { Toggle as SLToggle } from '../components/Toggle.jsx';

function statusFromCoverage(sets, target) {
  if (!target) return 'unknown';
  if (sets <= 0) return 'unworked';
  if (sets < target.min) return 'under';
  if (sets <= target.max) return 'optimal';
  return 'over';
}

// Pick a v9 coverage gradient name from sets + target. Different from the
// score-* gradients used by SMS pills: "I'm not training this muscle"
// should scream RED, not slate.
//   0 sets             → cov-zero    (bright red)
//   1-30% of target.mid → cov-low     (orange)
//   30-70%              → cov-mid     (amber)
//   70-110% (in band)   → cov-optimal (green)
//   >110%               → cov-over    (indigo→pink)
function covGradFor(sets, target) {
  if (!target) return 'cov-zero';
  if (sets <= 0) return 'cov-zero';
  if (sets > target.max) return 'cov-over';
  const mid = (target.min + target.max) / 2 || 1;
  const pct = sets / mid;
  if (pct < 0.30) return 'cov-low';
  if (pct < 0.70) return 'cov-mid';
  return 'cov-optimal';
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
        <SLToggle
          value={view}
          onChange={setView}
          size="md"
          options={[{value:'front', label:'Front'},{value:'back', label:'Back'}]}
        />
      </div>
      <Card
        variant="gradient"
        gradient="priority"
        size="md"
        interactive
        onClick={tourActive ? undefined : startTour}
        aria-disabled={tourActive}
        style={{ marginBottom: 8, opacity: tourActive ? 0.7 : 1 }}
      >
        <div className="weak-spots-card-inner">
          <Target size={22} strokeWidth={2.4}/>
          <span className="weak-spots-card-label">
            {tourActive ? 'Touring weak spots…' : 'Find My Weak Spots'}
          </span>
        </div>
      </Card>

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
          <Subheader subtitle="Sets per muscle group this week. Red = untrained, green = in target band.">Weekly coverage</Subheader>
          <div className="b2-cov-grid">
            {COV_KEYS.map(m => {
              const s = sets[m] || 0;
              const t = TARGETS_V2[m];
              const st = statusFromCoverage(s, t);
              return (
                <Card
                  key={m}
                  variant="gradient"
                  gradient={covGradFor(s, t)}
                  size="sm"
                  interactive
                  onClick={() => setFocus(m)}
                >
                  <div className="b2-cov-cell-name">{MUSCLE_LABELS_V2[m] || m}</div>
                  <div className="b2-cov-cell-sets">{s} sets</div>
                </Card>
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
