// Dashboard — scores, sport, under-worked muscles, weekly time, streak, body teaser.
// Widgets are draggable; order persists in localStorage.

import React, { useState, useEffect, useMemo } from 'react';
import {
  SPORTS, MUSCLE_LABELS, DAY_NAMES,
  liftingScore, cardioScoreFor, underworkedMuscles,
  computeCoverage, totalLiftMinutes, totalCardioMinutes,
  totalLiftKcal, totalCardioKcal,
  liftMinutesForDay, cardioFor,
} from '../data/exercises.js';
import { computeCoverageV2, AnatomyFront, AnatomyBack } from '../components/Anatomy2D.jsx';
import { currentSplitName } from '../lib/splits.js';

export function DashboardTab({ days, cardioDays, profile, setTab }) {
  const lift = useMemo(() => liftingScore(days, profile), [days, profile]);
  const cardio = useMemo(() => cardioScoreFor(cardioDays), [cardioDays]);
  const under = useMemo(() => underworkedMuscles(days), [days]);
  const sp = SPORTS.find(s => s.id === profile.sport) || SPORTS[0];
  const cov = useMemo(() => computeCoverage(days), [days]);
  const covV2 = useMemo(() => computeCoverageV2(days), [days]);
  const splitName = useMemo(() => currentSplitName(days), [days]);

  const liftMin = totalLiftMinutes(days);
  const cardioMin = totalCardioMinutes(cardioDays);
  const totalMin = liftMin + cardioMin;
  const trainingKcal = totalLiftKcal(days) + totalCardioKcal(cardioDays);

  const allWidgets = ['lift','cardio','sport','underworked','time','streak','figure'];
  const ORDER_KEY = 'sl-dash-order';
  const [order, setOrder] = useState(() => {
    try {
      const raw = localStorage.getItem(ORDER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every(x => allWidgets.includes(x))) {
          const merged = [...parsed];
          for (const w of allWidgets) if (!merged.includes(w)) merged.push(w);
          return merged;
        }
      }
    } catch (e) {}
    return allWidgets;
  });
  useEffect(() => {
    try { localStorage.setItem(ORDER_KEY, JSON.stringify(order)); } catch (e) {}
  }, [order]);
  const [dragId, setDragId] = useState(null);
  const [hoverId, setHoverId] = useState(null);

  const onWStart = (id) => setDragId(id);
  const onWOver = (id, e) => { e.preventDefault(); if (dragId && id !== dragId) setHoverId(id); };
  const onWDrop = (id) => {
    if (!dragId || dragId === id) { setDragId(null); setHoverId(null); return; }
    setOrder(prev => {
      const next = prev.filter(x => x !== dragId);
      const idx = next.indexOf(id);
      next.splice(idx, 0, dragId);
      return next;
    });
    setDragId(null); setHoverId(null);
  };

  const streak = days.filter(d => !d.rest).length * 2 + 1;

  const dayTimes = DAY_NAMES.map((_, i) => ({
    name: DAY_NAMES[i],
    lift: liftMinutesForDay(days[i]),
    cardio: cardioDays[i].items.reduce((s,id) => s + (cardioFor(id)?.dur || 0), 0),
  }));
  const maxMin = Math.max(60, ...dayTimes.map(d => d.lift + d.cardio));

  const widgets = {
    lift: () => (
      <div className="dw">
        <div className="dw-head"><div className="dw-t">Lifting</div><div className="dw-grade" data-grade={gradeOf(lift.score)}>{gradeOf(lift.score)}</div></div>
        <div className="dw-big">
          <ScoreRing value={lift.score} size={84} stroke={9} color="var(--accent)"/>
          <div className="dw-stats">
            <Stat k="Days planned" v={`${days.filter(d=>!d.rest).length}/${profile.days||4}`}/>
            <Stat k="Sets in band" v={`${lift.inBand}/${lift.total}`}/>
            <Stat k="Lift hours" v={`${(liftMin/60).toFixed(1)}h`}/>
          </div>
        </div>
        <div className="dw-bars">
          <Bar k="Adherence" v={lift.adherence}/>
          <Bar k="Coverage" v={lift.balance}/>
          <Bar k="Volume" v={lift.timeScore}/>
        </div>
      </div>
    ),
    cardio: () => (
      <div className="dw">
        <div className="dw-head"><div className="dw-t">Cardio</div><div className="dw-grade" data-grade={gradeOf(cardio.score)}>{gradeOf(cardio.score)}</div></div>
        <div className="dw-big">
          <ScoreRing value={cardio.score} size={84} stroke={9} color="#19B6FF"/>
          <div className="dw-stats">
            <Stat k="Sessions" v={`${cardio.sessions}/3`}/>
            <Stat k="Minutes" v={`${cardio.minutes}m`}/>
            <Stat k="Variety" v={`${cardio.types} types`}/>
          </div>
        </div>
        <div className="dw-bars">
          <Bar k="Volume" v={cardio.minScore} c="#19B6FF"/>
          <Bar k="Frequency" v={cardio.sessionScore} c="#19B6FF"/>
          <Bar k="Variety" v={cardio.varietyScore} c="#19B6FF"/>
        </div>
      </div>
    ),
    sport: () => (
      <div className="dw">
        <div className="dw-head"><div className="dw-t">Sport · {sp.label}</div><div className="dw-pill mono">{sp.daysHint}d/wk</div></div>
        <div className="sport-card-body">
          <div className="split-pill" style={{ '--bp': 'var(--accent)' }}>
            <span className="sp-k mono">SPLIT</span>
            <span className="sp-v">{splitName}</span>
          </div>
          <div className="sport-meta">{sp.sub}</div>
          <div className="sport-prio">
            {Object.entries(sp.priority || {}).slice(0, 6).map(([m,w]) => (
              <div key={m} className="sp-pill" style={{ '--bp': `var(--bp-${m})` }}>
                <span className="lbl">{MUSCLE_LABELS[m] || m}</span>
                <span className="weight mono">×{w.toFixed(1)}</span>
              </div>
            ))}
            {Object.keys(sp.priority || {}).length === 0 && <div className="sport-meta">Balanced — no muscle skewed.</div>}
          </div>
        </div>
      </div>
    ),
    underworked: () => (
      <div className="dw">
        <div className="dw-head"><div className="dw-t">Under-worked</div><div className="dw-pill mono">{under.length}</div></div>
        {under.length === 0 ? (
          <div className="empty-pill">All muscle groups in target band</div>
        ) : (
          <div className="under-list">
            {under.slice(0,5).map(u => (
              <div key={u.key} className="under-row" style={{ '--bp': `var(--bp-${u.key})` }}>
                <div className="ur-l">
                  <div className="ur-name">{u.label}</div>
                  <div className="ur-meta mono">{u.sets} sets · need +{u.gap}</div>
                </div>
                <button className="ur-cta" onClick={()=>setTab('splits')}>Add →</button>
              </div>
            ))}
          </div>
        )}
      </div>
    ),
    figure: () => (
      <div className="dw">
        <div className="dw-head"><div className="dw-t">Body coverage</div><button className="dw-pill" onClick={()=>setTab('body')}>Open ›</button></div>
        <DashAnatomy sets={covV2}/>
      </div>
    ),
    time: () => (
      <div className="dw">
        <div className="dw-head"><div className="dw-t">Weekly time</div><div className="dw-pill mono">{Math.round(totalMin)}m</div></div>
        <div className="time-chart">
          {dayTimes.map((d, i) => {
            const lh = (d.lift / maxMin) * 100;
            const ch = (d.cardio / maxMin) * 100;
            return (
              <div key={i} className="tc-col">
                <div className="tc-bars">
                  <div className="tc-cardio" style={{ height: `${ch}%`}} title={`${d.cardio}m cardio`}/>
                  <div className="tc-lift"   style={{ height: `${lh}%`}} title={`${d.lift}m lift`}/>
                </div>
                <div className="tc-lbl mono">{d.name[0]}</div>
              </div>
            );
          })}
        </div>
        <div className="tc-legend">
          <span><i style={{background:'var(--accent)'}}/> Lift {liftMin}m</span>
          <span><i style={{background:'#19B6FF'}}/> Cardio {cardioMin}m</span>
          <span><i style={{background:'#FF8A5B'}}/> {trainingKcal} kcal</span>
        </div>
      </div>
    ),
    streak: () => (
      <div className="dw">
        <div className="dw-head"><div className="dw-t">Streak</div><div className="dw-pill mono">{streak} days</div></div>
        <div className="streak-row">
          {Array.from({length: 14}).map((_, i) => {
            const on = i >= 14 - streak;
            return <div key={i} className={`streak-dot ${on?'on':''}`}/>;
          })}
        </div>
        <div className="streak-meta">2 weeks back · longest run: {streak + 4} days</div>
      </div>
    ),
  };

  return (
    <div className="tab-pane dash-page">
      <div className="dash-hero">
        <div className="dh-top">
          <div className="dh-kicker mono">THIS WEEK</div>
          <div className="dh-grade" data-grade={gradeOf(Math.round(lift.score*0.6 + cardio.score*0.4))}>
            {gradeOf(Math.round(lift.score*0.6 + cardio.score*0.4))}
          </div>
        </div>
        <div className="dh-h1">You're <b>{streak} days</b> in.</div>
        <div className="dh-sub">{coachLine(lift.score, cardio.score, under.length)}</div>
      </div>

      <div className="widget-grid">
        {order.map(id => (
          <div key={id}
            className={`widget-wrap ${dragId===id?'is-dragging':''} ${hoverId===id?'is-hover':''}`}
            draggable
            onDragStart={(e)=>onWStart(id, e)}
            onDragOver={(e)=>onWOver(id, e)}
            onDrop={()=>onWDrop(id)}
            onDragEnd={()=>{setDragId(null); setHoverId(null);}}
          >
            <button className="w-grip" title="Drag to reorder"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><circle cx="9" cy="6" r="0.6"/><circle cx="15" cy="6" r="0.6"/><circle cx="9" cy="12" r="0.6"/><circle cx="15" cy="12" r="0.6"/><circle cx="9" cy="18" r="0.6"/><circle cx="15" cy="18" r="0.6"/></svg></button>
            {widgets[id]()}
          </div>
        ))}
      </div>

      <div style={{ height: 32 }}/>
    </div>
  );
}

function DashAnatomy({ sets }) {
  const [paused, setPaused] = useState(false);
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    if (paused) return;
    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = now - last; last = now;
      setAngle(a => (a + (dt / 1000) * 22) % 360);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused]);

  return (
    <div className="dash-anatomy" onClick={() => setPaused(p => !p)}>
      <div className="anatomy-3d" style={{
        transform: `rotateY(${angle}deg)`,
        transformStyle: 'preserve-3d',
      }}>
        <div className="body-face front"><AnatomyFront sets={sets}/></div>
        <div className="body-face back"><AnatomyBack sets={sets}/></div>
      </div>
      {paused && <div className="da-hint mono">PAUSED · TAP TO RESUME</div>}
    </div>
  );
}

function gradeOf(s) {
  if (s >= 85) return 'A';
  if (s >= 75) return 'B';
  if (s >= 60) return 'C';
  if (s >= 45) return 'D';
  return 'F';
}

function coachLine(lift, cardio, underN) {
  if (lift > 80 && cardio > 80) return 'Locked-in week. Keep this rhythm.';
  if (underN > 3) return `${underN} muscle groups under-worked — add a balance day.`;
  if (lift < 50) return 'Plan more lift days — adherence is the biggest lever.';
  if (cardio < 40) return 'Add 1–2 short cardio sessions for heart-rate adaptations.';
  return 'Solid plan, small gaps to plug. Tweak below.';
}

function ScoreRing({ value, size = 110, stroke = 10, color }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [animV, setAnimV] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimV(value), 80); return () => clearTimeout(t); }, [value]);
  const animDash = c * (animV / 100);
  const stroke1 = color || 'var(--accent)';
  return (
    <div className="ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="color-mix(in oklab, var(--ink) 8%, transparent)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={stroke1} strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={`${animDash} ${c-animDash}`} transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dasharray 1.1s cubic-bezier(.2,.8,.2,1)' }}/>
      </svg>
      <div className="ring-num" style={{ fontSize: size*0.32 }}>{Math.round(animV)}</div>
    </div>
  );
}

function Stat({ k, v }) {
  return <div className="ds"><div className="ds-k mono">{k}</div><div className="ds-v">{v}</div></div>;
}

function Bar({ k, v, c }) {
  return (
    <div className="db">
      <div className="db-h"><span>{k}</span><span className="mono">{Math.round(v*100)}%</span></div>
      <div className="db-tr"><div className="db-fl" style={{ width:`${v*100}%`, background: c || 'var(--accent)' }}/></div>
    </div>
  );
}
