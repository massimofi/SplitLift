// Dashboard — scores, sport, under-worked muscles, weekly time.
// Widgets are draggable; order persists in localStorage.
//
// v7 rebuild: every widget is a <Card variant="gradient" gradient="...">.
// Gradient mapping is semantic: SMS uses score-based, Lift = energy,
// Cardio = cardio, Sport = priority, Underworked = warning, Time = recovery.

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
import { Card, gradFromScore } from '../components/Card.jsx';
import { Subheader } from '../components/Subheader.jsx';

// Sport Match Score — composite of priority-hit / cardio-match / balance.
function sportMatchScore(profile, days, cardioDays, sport) {
  const cov = computeCoverageV2(days);
  const priority = sport.priority || {};

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

  const scheduled = totalCardioMinutes(cardioDays);
  const target = profile.cardioMin || 90;
  const cardioMatch = target > 0 ? Math.min(scheduled / target, 1) : 0;

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

  // v10 Issue 1d: drag-to-reorder removed. Widgets render in fixed
  // semantic order. Old sl-dash-order localStorage key is still in
  // clearState() so old data is purged on reset.
  const allWidgets = ['sportscore','quick','lift','cardio','sport','underworked','time'];

  const liftDaysPlanned = days.filter(d => !d.rest).length;

  const dayTimes = DAY_NAMES.map((_, i) => ({
    name: DAY_NAMES[i],
    lift: liftMinutesForDay(days[i]),
    cardio: cardioDays[i].items.reduce((s,id) => s + (cardioFor(id)?.dur || 0), 0),
  }));
  const maxMin = Math.max(60, ...dayTimes.map(d => d.lift + d.cardio));

  const sms = useMemo(() => sportMatchScore(profile, days, cardioDays, sp), [profile, days, cardioDays, sp]);
  const animatedSms = useAnimatedNumber(sms.score, 800);
  const [smsOpen, setSmsOpen] = useState(false);

  const heroGrade = gradeOf(Math.round(lift.score*0.6 + cardio.score*0.4));

  const widgets = {
    sportscore: () => (
      <Card variant="gradient" gradient={gradFromScore(sms.score)} size="md" interactive onClick={()=>setSmsOpen(true)}>
        <div className="dw-head-row">
          <Card.Title>Sport match · {sp.label}</Card.Title>
          <span className="dw-pill-grade">TAP FOR DETAIL</span>
        </div>
        <div className="dw-sms-num-row">
          <div className="dw-sms-num">{Math.round(animatedSms)}</div>
          <div className="dw-sms-units mono">/ 100</div>
        </div>
        <div className="dw-sms-bars">
          <SmsBar k="Priority" v={sms.priorityHit}/>
          <SmsBar k="Cardio"   v={sms.cardioMatch}/>
          <SmsBar k="Balance"  v={sms.balance}/>
        </div>
      </Card>
    ),
    quick: () => (
      <Card variant="gradient" gradient="info" size="md">
        <div className="dw-head-row">
          <Card.Title>This week</Card.Title>
        </div>
        <div className="dw-quick-row">
          <QuickTile v={days.filter(d => !d.rest).length} k="LIFT DAYS"/>
          <QuickTile v={cardioMin} u="m" k="CARDIO"/>
          <QuickTile v={Math.round(totalMin/60)} u="h" k="TOTAL TIME"/>
        </div>
      </Card>
    ),
    lift: () => (
      <Card variant="gradient" gradient="strength" size="md">
        <div className="dw-head-row">
          <Card.Title>Lifting</Card.Title>
          <span className="dw-pill-grade">{gradeOf(lift.score)}</span>
        </div>
        <div className="dw-big-row">
          <ScoreRing value={lift.score} size={84} stroke={9}/>
          <div className="dw-stats">
            <DStat k="Days planned" v={`${days.filter(d=>!d.rest).length}/${profile.days||4}`}/>
            <DStat k="Sets in band" v={`${lift.inBand}/${lift.total}`}/>
            <DStat k="Lift hours" v={`${(liftMin/60).toFixed(1)}h`}/>
          </div>
        </div>
        <div className="dw-bars">
          <DBar k="Adherence" v={lift.adherence}/>
          <DBar k="Coverage"  v={lift.balance}/>
          <DBar k="Volume"    v={lift.timeScore}/>
        </div>
      </Card>
    ),
    cardio: () => (
      <Card variant="gradient" gradient="cardio" size="md">
        <div className="dw-head-row">
          <Card.Title>Cardio</Card.Title>
          <span className="dw-pill-grade">{gradeOf(cardio.score)}</span>
        </div>
        <div className="dw-big-row">
          <ScoreRing value={cardio.score} size={84} stroke={9}/>
          <div className="dw-stats">
            <DStat k="Sessions" v={`${cardio.sessions}/3`}/>
            <DStat k="Minutes"  v={`${cardio.minutes}m`}/>
            <DStat k="Variety"  v={`${cardio.types} types`}/>
          </div>
        </div>
        <div className="dw-bars">
          <DBar k="Volume"    v={cardio.minScore}/>
          <DBar k="Frequency" v={cardio.sessionScore}/>
          <DBar k="Variety"   v={cardio.varietyScore}/>
        </div>
      </Card>
    ),
    sport: () => (
      <Card variant="gradient" gradient="priority" size="md">
        <div className="dw-head-row">
          <Card.Title>Sport · {sp.label}</Card.Title>
          <span className="dw-pill-grade">{sp.daysHint}d/wk</span>
        </div>
        <div className="dw-sport-split-pill">
          <span className="k">SPLIT</span>
          <span className="v">{splitName}</span>
        </div>
        <div className="dw-sport-meta">{sp.sub}</div>
        <div className="dw-sport-prio">
          {Object.entries(sp.priority || {}).slice(0, 6).map(([m,w]) => (
            <span key={m} className="dw-sport-prio-chip">
              <span>{MUSCLE_LABELS[m] || m}</span>
              <span className="w">×{w.toFixed(1)}</span>
            </span>
          ))}
          {Object.keys(sp.priority || {}).length === 0 && <div className="dw-sport-meta">Balanced — no muscle skewed.</div>}
        </div>
      </Card>
    ),
    underworked: () => (
      <Card variant="gradient" gradient="warning" size="md">
        <div className="dw-head-row">
          <Card.Title>Under-worked</Card.Title>
          <span className="dw-pill-grade">{under.length}</span>
        </div>
        {under.length === 0 ? (
          <div className="dw-under-empty">All muscle groups in target band</div>
        ) : (
          <div className="dw-under-list">
            {under.slice(0,5).map(u => (
              <div key={u.key} className="dw-under-row">
                <div>
                  <div className="dw-under-name">{u.label}</div>
                  <div className="dw-under-meta">{u.sets} sets · need +{u.gap}</div>
                </div>
                <button className="dw-under-cta" onClick={()=>setTab('splits')}>Add →</button>
              </div>
            ))}
          </div>
        )}
      </Card>
    ),
    time: () => (
      <Card variant="gradient" gradient="recovery" size="md">
        <div className="dw-head-row">
          <Card.Title>Weekly time</Card.Title>
          <span className="dw-pill-grade">{Math.round(totalMin)}m</span>
        </div>
        <div className="dw-time-chart">
          {dayTimes.map((d, i) => {
            const lh = (d.lift / maxMin) * 100;
            const ch = (d.cardio / maxMin) * 100;
            return (
              <div key={i} className="dw-tc-col">
                <div className="dw-tc-bars">
                  <div className="dw-tc-cardio" style={{ height: `${ch}%`}}/>
                  <div className="dw-tc-lift"   style={{ height: `${lh}%`}}/>
                </div>
                <div className="dw-tc-lbl">{d.name[0]}</div>
              </div>
            );
          })}
        </div>
        <div className="dw-tc-legend">
          <span><i style={{background:'rgba(255,255,255,0.95)'}}/> Lift {liftMin}m</span>
          <span><i style={{background:'rgba(91,196,255,0.85)'}}/> Cardio {cardioMin}m</span>
          <span>{trainingKcal} kcal</span>
        </div>
      </Card>
    ),
  };

  return (
    <div className="tab-pane dash-page">
      <Subheader subtitle="Your week at a glance — sport match, lifting + cardio scores, and where to focus.">Dashboard</Subheader>
      <Card variant="subtle" size="md" style={{ marginBottom: 12 }}>
        <div className="dash-hero-top">
          <Card.Eyebrow>THIS WEEK</Card.Eyebrow>
          <span className="dash-hero-grade">{heroGrade}</span>
        </div>
        <div className="dash-hero-h"><b>{liftDaysPlanned}</b> lift {liftDaysPlanned === 1 ? 'day' : 'days'} planned.</div>
        <Card.Sub>{coachLine(lift.score, cardio.score, under.length)}</Card.Sub>
      </Card>

      {/* v10 Issue 1d: drag-handle icons + draggable reorder logic removed.
          Order is fixed (allWidgets) — widgets render in semantic priority. */}
      <div className="widget-grid">
        {allWidgets.map(id => (
          <div key={id} className="widget-wrap">
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

function ScoreRing({ value, size = 110, stroke = 10 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [animV, setAnimV] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimV(value), 80); return () => clearTimeout(t); }, [value]);
  const animDash = c * (animV / 100);
  return (
    <div className="dw-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--text-on-gradient)" strokeWidth={stroke}
          strokeLinecap="round" strokeDasharray={`${animDash} ${c-animDash}`} transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dasharray 1.1s cubic-bezier(.2,.8,.2,1)' }}/>
      </svg>
      <div className="dw-ring-num" style={{ fontSize: size*0.32 }}>{Math.round(animV)}</div>
    </div>
  );
}

function DStat({ k, v }) {
  return (
    <div className="dw-stat">
      <span className="dw-stat-k mono">{k}</span>
      <span className="dw-stat-v">{v}</span>
    </div>
  );
}

function DBar({ k, v }) {
  return (
    <div className="dw-bar">
      <div className="dw-bar-h"><span>{k}</span><span className="mono">{Math.round(v*100)}%</span></div>
      <div className="dw-bar-tr"><div className="dw-bar-fl" style={{ width:`${v*100}%` }}/></div>
    </div>
  );
}

function SmsBar({ k, v }) {
  const pct = Math.round(v * 100);
  return (
    <div className="dw-sms-bar">
      <div className="dw-sms-bar-h">
        <span>{k}</span><span className="mono">{pct}%</span>
      </div>
      <div className="dw-sms-bar-tr">
        <div className="dw-sms-bar-fl" style={{ width: `${pct}%`, background: 'var(--text-on-gradient)' }}/>
      </div>
    </div>
  );
}

function QuickTile({ v, u, k }) {
  const anim = useAnimatedNumber(v, 600);
  return (
    <div className="dw-quick-tile">
      <div className="dw-quick-v">
        {Math.round(anim)}
        {u && <span className="dw-quick-u">{u}</span>}
      </div>
      <div className="dw-quick-k">{k}</div>
    </div>
  );
}
