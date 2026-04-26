// Full-screen coverage panel — opens from the "See coverage" tab in some flows.
// Uses the 2D faux-3D Anatomy2DSwivel (front+back rotation) with click-to-zoom.

import React, { useState, useEffect, useMemo } from 'react';
import { Anatomy2DSwivel, MUSCLE_LABELS_V2, TARGETS_V2, computeCoverageV2, exercisesForMuscle } from './Anatomy2D.jsx';
import { I } from './Icons.jsx';

export function CoveragePanel({ open, onClose, days, onAddExercise }) {
  const [view, setView] = useState('front');
  const [recently, setRecently] = useState(null);
  const [focused, setFocused] = useState(null);
  const sets = useMemo(() => computeCoverageV2(days), [days]);

  const onRegion = (key) => {
    setRecently(key);
    setFocused(key);
    setTimeout(() => setRecently(null), 800);
  };
  const closeFocus = () => setFocused(null);

  useEffect(() => { if (!open) { setFocused(null); setView('front'); } }, [open]);

  const focusedExercises = focused ? exercisesForMuscle(focused).slice(0, 8) : [];
  const focusedSets = focused ? (sets[focused] || 0) : 0;
  const focusedTarget = focused ? TARGETS_V2[focused] : null;

  return (
    <div className={`coverage-panel ${open?'open':''}`}>
      <div className="cov-head">
        <div>
          <div className="title">{focused ? MUSCLE_LABELS_V2[focused] : 'Coverage'}</div>
          <div className="sub">{focused ? 'Tap body to switch · zoom-out below' : 'This week · tap any muscle'}</div>
        </div>
        <button className="cov-close" onClick={onClose}><I.x/></button>
      </div>

      <div className="cov-toggles">
        <div className="cov-seg">
          <button className={view==='front'?'active':''} onClick={()=>setView('front')}>Front</button>
          <button className={view==='back'?'active':''} onClick={()=>setView('back')}>Back</button>
        </div>
        {focused && (
          <button className="cov-close" onClick={closeFocus} title="Zoom out" style={{background:'var(--green)', color:'var(--shell-bg)'}}>
            <I.zoomOut/>
          </button>
        )}
      </div>

      <div className="cov-legend">
        <span>none</span>
        <div className="legend-bar">
          <span style={{background:'#1B1F3D'}}/>
          <span style={{background:'#2A2E63'}}/>
          <span style={{background:'#5151C7'}}/>
          <span style={{background:'#8C8CFF'}}/>
          <span style={{background:'#C09BFF'}}/>
        </div>
        <span>over</span>
      </div>

      <div className="body-stage">
        <Anatomy2DSwivel sets={sets} view={view} recently={recently} focused={focused} onRegion={onRegion}/>
        {!focused && <div className="rotate-hint">tap front · back to rotate · tap a muscle to dive in</div>}
      </div>

      {focused ? (
        <div className="muscle-detail">
          <div className="md-head">
            <div>
              <h3>{MUSCLE_LABELS_V2[focused]}</h3>
              <div className="sub">Weekly load</div>
            </div>
            <button className="cov-close" onClick={closeFocus} style={{background:'var(--bg-2)', color:'var(--ink)'}}><I.x/></button>
          </div>
          <div className="md-stat-row">
            <div className="md-stat"><span className="k">This week</span><span className="v">{focusedSets} <span style={{fontSize:11,color:'var(--ink-3)',fontWeight:500}}>sets</span></span></div>
            <div className="md-stat"><span className="k">Target</span><span className="v" style={{fontSize:14,paddingTop:6}}>{focusedTarget.min}–{focusedTarget.max}</span></div>
            <div className="md-stat"><span className="k">Status</span><span className="v" style={{fontSize:14,paddingTop:6}}>
              {focusedSets < focusedTarget.min ? <span style={{color:'#E63946'}}>Under</span> :
               focusedSets > focusedTarget.max ? <span style={{color:'#8A5A14'}}>Over</span> :
               <span style={{color:'var(--green-deep)'}}>Optimal</span>}
            </span></div>
          </div>
          <div className="md-section-title">Best exercises for this</div>
          {focusedExercises.map(({ ex }) => (
            <div key={ex.id} className={`md-ex-row t-${ex.type}`}>
              <div className="nm">{ex.name}</div>
              <span className="ms">{ex.sets} · {ex.gear}</span>
              <button className="add-here" onClick={()=>onAddExercise(ex.id)} title="Add to today"><I.plus/></button>
            </div>
          ))}
          {focusedExercises.length === 0 && <div style={{color:'var(--ink-3)',fontSize:13,padding:'12px 0'}}>No specific exercises mapped yet.</div>}
        </div>
      ) : (
        <div className="cov-summary">
          <h3>Per group · weekly sets</h3>
          <div className="cov-list">
            {Object.keys(MUSCLE_LABELS_V2).slice(0,9).map(k => {
              const s = sets[k] || 0;
              const t = TARGETS_V2[k];
              const status = s < t.min ? 'under' : s > t.max ? 'over' : 'optimal';
              return (
                <div key={k} className="cov-item" onClick={()=>setFocused(k)}>
                  <span className="name">{MUSCLE_LABELS_V2[k]}</span>
                  <span className="sets mono">{s}</span>
                  <span className={`badge ${status}`}>{status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
