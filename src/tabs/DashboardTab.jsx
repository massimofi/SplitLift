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
import { computeCoverageV2, TARGETS_V2 } from '../components/Anatomy2D.jsx';
import { currentSplitName } from '../lib/splits.js';
import { useAnimatedNumber } from '../lib/useAnimatedNumber.js';
import { IconX } from '../components/Icons.jsx';

// Sport Match Score — composite of priority-hit / cardio-match / balance.
// Returns { score, priorityHit, cardioMatch, balance, prioMuscles, hitMuscles }.
function sportMatchScore(profile, days, cardioDays, sport) {
  const cov = computeCoverageV2(days);
  const priority = sport.priority || {};

  // 1. Priority hit %: muscles with priority weight >= 1.2 (sport-specific)
  //    that land in the optimal coverage band.
  const prioKeys = Object.keys(priority).filter(k => priority[k] >= 1.2);
  let inBand = 0;
  const hitMuscles = [];
  for (const k of prioKeys) {
    const sets = cov[k] || 0;
    const t = TARGETS_V2[k];
    if (t && sets >= t.min && sets <= t.max) {
      inBand++;
      hitMuscles.push(k);
    }
  }
  const priorityHit = prioKeys.length > 0 ? inBand / prioKeys.length : 0.5;

  // 2. Cardio match %: scheduled vs target.
  const scheduled = totalCardioMinutes(cardioDays);
  const target = profile.cardioMin || 90;
  const cardioMatch = target > 0 ? Math.min(scheduled / target, 1) : 0;

  // 3. Balance %: penalize over-trained muscles.
  const muscleKeys = Object.keys(TARGETS_V2);
  let over = 0;
  for (const k of muscleKeys) {
    const s = cov[k] || 0;
    const t = TARGETS_V2[k];
    if (t && s > t.max * 1.3) over++;
  }
  const balance = 1 - over / muscleKeys.length;

  const score = Math.round((priorityHit * 0.5 + cardioMatch * 0.25 + balance * 0.25) * 100);
  return { score, priorityHit, cardioMatch, balance, prioKeys, hitMuscles };
}

function smsColor(score) {
  if (score >= 90) return '#00c896';
  if (score >= 70) return '#4ED9C0';
  if (score >= 40) return '#ffd93d';
  return '#ff4444';
}

// Gradient palette per widget. Returns inline CSS vars consumed by .dw.gw.
// Each widget's color leans into its data — score-driven for SMS, fixed
// hue per category for the rest. Keeps dashboard visually distinct.
function gwScore(score) {
  if (score >= 90) return { '--gw-1': '#00c896', '--gw-2': '#4ED9C0', '--gw-base': '#0d4a3a' };
  if (score >= 70) return { '--gw-1': '#4ED9C0', '--gw-2': '#19B6FF', '--gw-base': '#0d3a52' };
  if (score >= 40) return { '--gw-1': '#ffd93d', '--gw-2': '#ff8c42', '--gw-base': '#5b3a0e' };
  return { '--gw-1': '#ff4444', '--gw-2': '#ff8c42', '--gw-base': '#5b1313' };
}
const GW_QUICK   = { '--gw-1': '#5B5BFF', '--gw-2': '#9B5BFF', '--gw-base': '#1a1c5e' };
const GW_LIFT    = { '--gw-1': '#FF8C42', '--gw-2': '#FFD93D', '--gw-base': '#5b3914' };
const GW_CARDIO  = { '--gw-1': '#19B6FF', '--gw-2': '#5B5BFF', '--gw-base': '#0d3a5e' };
const GW_SPORT   = { '--gw-1': '#9B5BFF', '--gw-2': '#FF6BD6', '--gw-base': '#3d1a5b' };
const GW_UNDER   = { '--gw-1': '#FF5C8A', '--gw-2': '#7C2235', '--gw-base': '#3d0e1d' };
const GW_TIME    = { '--gw-1': '#4ED9C0', '--gw-2': '#00c896', '--gw-base': '#0e3d35' };

export function DashboardTab({ days, cardioDays, profile, setTab }) {
  const lift = useMemo(() => liftingScore(days, profile), [days, profile]);
  const cardio = useMemo(() => cardioScoreFor(cardioDays), [cardioDays]);
  const under = useMemo(() => underworkedMuscles(days), [days]);
  const sp = SPORTS.find(s => s.id === profile.sport) || SPORTS[0];
  const cov = useMemo(() => computeCoverage(days), [days]);
  const splitName = useMemo(() => currentSplitName(days), [days]);

  const liftMin = totalLiftMinutes(days);
  const cardioMin = totalCardioMinutes(cardioDays);
  const totalMin = liftMin + cardioMin;
  const trainingKcal = totalLiftKcal(days) + totalCardioKcal(cardioDays);

  // Widget order. `figure` (rotating anatomy) and `streak` (faked streak) were
  // dropped — Body tab and Dashboard's other cards already cover that ground.
  const allWidgets = ['sportscore','quick','lift','cardio','sport','underworked','time'];
  const ORDER_KEY = 'sl-dash-order';
  const [order, setOrder] = useState(() => {
    try {
      const raw = localStorage.getItem(ORDER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          // Filter out any IDs that no longer exist (e.g. dropped 'figure' /
          // 'streak') so old saved orders don't crash render.
          const cleaned = parsed.filter(x => allWidgets.includes(x));
          // Append any new widgets that weren't in the saved order.
          for (const w of allWidgets) if (!cleaned.includes(w)) cleaned.push(w);
          return cleaned;
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

  // Lift days planned this week. Used in the Dashboard hero ("You've got
  // <N> lift days planned"). Replaces the old fake streak.
  const liftDaysPlanned = days.filter(d => !d.rest).length;

  const dayTimes = DAY_NAMES.map((_, i) => ({
    name: DAY_NAMES[i],
    lift: liftMinutesForDay(days[i]),
    cardio: cardioDays[i].items.reduce((s,id) => s + (cardioFor(id)?.dur || 0), 0),
  }));
  const maxMin = Math.max(60, ...dayTimes.map(d => d.lift + d.cardio));

  // ---- Sport match score (P4) ----
  const sms = useMemo(() => sportMatchScore(profile, days, cardioDays, sp), [profile, days, cardioDays, sp]);
  const animatedSms = useAnimatedNumber(sms.score, 800);
  const [smsOpen, setSmsOpen] = useState(false);

  const widgets = {
    sportscore: () => (
      <div className="dw gw" onClick={()=>setSmsOpen(true)} style={{ cursor: 'pointer', ...gwScore(sms.score) }}>
        <div className="dw-head">
          <div className="dw-t">Sport match · {sp.label}</div>
          <div className="dw-pill mono">TAP FOR DETAIL</div>
        </div>
        <div className="sms-big">
          <div className="sms-num" style={{ color: smsColor(sms.score), borderColor: smsColor(sms.score) }}>
            {Math.round(animatedSms)}
          </div>
          <div className="sms-units mono">/ 100</div>
        </div>
        <div className="sms-bars">
          <SmsBar k="Priority" v={sms.priorityHit}/>
          <SmsBar k="Cardio"   v={sms.cardioMatch}/>
          <SmsBar k="Balance"  v={sms.balance}/>
        </div>
      </div>
    ),
    quick: () => (
      <div className="dw gw" style={GW_QUICK}>
        <div className="dw-head"><div className="dw-t">This week</div></div>
        <div className="quick-row">
          <div className="quick-tile">
            <div className="qt-v"><AnimatedInt n={days.filter(d => !d.rest).length}/></div>
            <div className="qt-k mono">LIFT DAYS</div>
          </div>
          <div className="quick-tile">
            <div className="qt-v"><AnimatedInt n={cardioMin}/><span className="qt-u">m</span></div>
            <div className="qt-k mono">CARDIO</div>
          </div>
          <div className="quick-tile">
            <div className="qt-v"><AnimatedInt n={Math.round(totalMin/60)}/><span className="qt-u">h</span></div>
            <div className="qt-k mono">TOTAL TIME</div>
          </div>
        </div>
      </div>
    ),
    lift: () => (
      <div className="dw gw" style={GW_LIFT}>
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
      <div className="dw gw" style={GW_CARDIO}>
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
      <div className="dw gw" style={GW_SPORT}>
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
      <div className="dw gw" style={GW_UNDER}>
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
    time: () => (
      <div className="dw gw" style={GW_TIME}>
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
        <div className="dh-h1"><b>{liftDaysPlanned}</b> lift {liftDaysPlanned === 1 ? 'day' : 'days'} planned.</div>
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

      {smsOpen && (
        <div className="ps-overlay" onClick={()=>setSmsOpen(false)}>
          <div className="ps-sheet" onClick={e=>e.stopPropagation()}>
            <div className="ps-head">
              <div>
                <div className="ps-t">Sport match · {sp.label}</div>
                <div className="ps-s mono">SCORE {sms.score} / 100</div>
              </div>
              <button className="ip-x" onClick={()=>setSmsOpen(false)} aria-label="Close"><IconX/></button>
            </div>
            <div className="sms-detail">
              <p>
                Your sport (<b>{sp.label}</b>) prioritizes{' '}
                <b>{sms.prioKeys.length > 0
                  ? sms.prioKeys.map(k => MUSCLE_LABELS[k] || k).join(', ')
                  : 'a balanced load'}</b>.
              </p>
              <p>
                You're hitting <b>{sms.hitMuscles.length}/{sms.prioKeys.length}</b>{' '}
                priority muscles in the optimal band, and you've scheduled{' '}
                <b>{Math.round(sms.cardioMatch * 100)}%</b> of your weekly cardio target.
              </p>
              {sms.score < 100 && (
                <p className="sms-suggest mono">
                  → To push closer to 100, top up{' '}
                  {sms.prioKeys.filter(k => !sms.hitMuscles.includes(k))
                    .map(k => MUSCLE_LABELS[k] || k)
                    .slice(0, 3)
                    .join(', ') || 'cardio sessions'}.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
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

function SmsBar({ k, v }) {
  const pct = Math.round(v * 100);
  const color = smsColor(pct);
  return (
    <div className="sms-bar">
      <div className="sms-bar-h">
        <span>{k}</span><span className="mono" style={{ color }}>{pct}%</span>
      </div>
      <div className="sms-bar-tr">
        <div className="sms-bar-fl" style={{ width: `${pct}%`, background: color }}/>
      </div>
    </div>
  );
}

function AnimatedInt({ n }) {
  const v = useAnimatedNumber(n, 600);
  return <span>{Math.round(v)}</span>;
}
