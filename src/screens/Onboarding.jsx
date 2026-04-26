// 4-step onboarding: Sport -> You -> Training -> Pick template.
// Done returns { profile, initialDays, initialTab:'dashboard' } so the user
// lands on Dashboard with their chosen split already populated.

import React, { useState, useEffect, useMemo } from 'react';
import { SPORTS, INITIAL_DAYS, ageFromBirthday, birthdayFromAge } from '../data/exercises.js';
import { SPLIT_TEMPLATES, rankTemplatesForSport } from '../data/templates.js';
import { makeDayForType } from '../lib/splits.js';
import { StatusBar } from '../lib/StatusBar.jsx';
import { I } from '../components/Icons.jsx';
import { SportIcon } from '../components/SportIcons.jsx';

const TODAY_STR = new Date().toISOString().slice(0, 10);
const DEFAULT_BDAY = birthdayFromAge(22);

export function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [sport, setSport] = useState('soccer');
  const [hUnit, setHUnit] = useState('cm');
  const [wUnit, setWUnit] = useState('kg');
  // Number inputs use string state so the user can clear / retype freely
  // without leading-zero artifacts. We parse on submit.
  const [heightStr, setHeightStr] = useState('');
  const [weightStr, setWeightStr] = useState('');
  const [birthday, setBirthday] = useState(DEFAULT_BDAY);
  const [sex, setSex] = useState('m');
  const [days, setDays] = useState(4);
  const [cardioMinStr, setCardioMinStr] = useState('');
  const [pickedTpl, setPickedTpl] = useState(null);

  // Defaults applied at finish if the user leaves a field blank.
  // v11.5 Issue 1: imperial height = decimal feet (e.g. 5.9). Float-parse.
  const height = (() => {
    if (hUnit === 'cm') return parseInt(heightStr, 10) || 178;
    const f = parseFloat(heightStr);
    return Number.isFinite(f) && f > 0 ? f : 5.9;  // ~178 cm
  })();
  const weight    = parseInt(weightStr, 10) || (wUnit === 'kg' ? 74  : 165);
  const age       = ageFromBirthday(birthday) || 22;
  const cardioMin = parseInt(cardioMinStr, 10) || 90;
  const total = 4;
  const labelByStep = ['Sport', 'You', 'Training', 'Plan'];

  const ranked = useMemo(
    () => rankTemplatesForSport({ sport, days, limit: 3 }),
    [sport, days]
  );

  useEffect(() => {
    if (step === 3 && !pickedTpl && ranked[0]) setPickedTpl(ranked[0].tpl.id);
  }, [step, pickedTpl, ranked]);

  const finish = () => {
    const profile = { sport, days, height, hUnit, weight, wUnit, birthday, age, sex, cardioMin };
    const tpl = SPLIT_TEMPLATES.find(t => t.id === pickedTpl);
    let initialDays = INITIAL_DAYS;
    if (tpl) {
      initialDays = tpl.days.map(t => makeDayForType(t, profile, null));
    }
    onDone({ profile, initialDays, initialTab: 'dashboard' });
  };

  const next = () => step < total - 1 ? setStep(step+1) : finish();
  const back = () => step > 0 && setStep(step-1);

  return (
    <div className="screen">
      <StatusBar/>
      <div className="screen-body onboard">
        <button className="back-btn" onClick={back} style={{ visibility: step===0?'hidden':'visible' }}><I.arrowL/></button>
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${((step+1)/total)*100}%` }}/></div>
        <div className="step-eyebrow mono">Step {step+1} of {total} · {labelByStep[step]}</div>

        {step === 0 && (<>
          <h2 className="step-q">What sport do you train for?</h2>
          <p className="step-help">Drives muscle priorities. Editable later.</p>
          <div className="sport-grid">
            {SPORTS.map(s => (
              <button key={s.id} className={`sport-card ${sport===s.id?'active':''}`} onClick={()=>setSport(s.id)}>
                <span className="sport-card-icon"><SportIcon id={s.id} size={26}/></span>
                <div className="t">{s.label}</div><div className="s">{s.sub}</div>
              </button>
            ))}
          </div>
        </>)}

        {step === 1 && (<>
          <h2 className="step-q">A bit about you.</h2>
          <p className="step-help">Powers your calorie & heart-rate math.</p>

          <div style={{ marginBottom: 18 }}>
            <div className="stat-input-row"><span className="label">Height</span>
              <div className="unit-toggle">
                <button className={hUnit==='cm'?'active':''} onClick={()=>setHUnit('cm')}>CM</button>
                <button className={hUnit==='ft'?'active':''} onClick={()=>setHUnit('ft')}>FT</button>
              </div>
            </div>
            <div className="big-number-input">
              <input
                className="num"
                type="number"
                inputMode="decimal"
                step={hUnit === 'cm' ? '1' : '0.1'}
                value={heightStr}
                placeholder={hUnit === 'cm' ? '178' : '5.9'}
                onChange={(e)=>setHeightStr(e.target.value)}
              />
              <span className="unit">{hUnit}</span>
            </div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div className="stat-input-row"><span className="label">Weight</span>
              <div className="unit-toggle">
                <button className={wUnit==='kg'?'active':''} onClick={()=>setWUnit('kg')}>KG</button>
                <button className={wUnit==='lb'?'active':''} onClick={()=>setWUnit('lb')}>LB</button>
              </div>
            </div>
            <div className="big-number-input"><input className="num" type="number" inputMode="numeric"
              value={weightStr} placeholder={wUnit === 'kg' ? '74' : '165'}
              onChange={(e)=>setWeightStr(e.target.value)}/><span className="unit">{wUnit}</span></div>
          </div>

          <div style={{ marginBottom: 18 }}>
            <div className="stat-input-row"><span className="label">Birthday</span></div>
            <input className="bday-input" type="date"
              value={birthday || ''}
              max={TODAY_STR} min="1900-01-01"
              onChange={(e)=>setBirthday(e.target.value)}/>
            <div className="bday-derived">
              <span className="bd-k mono">AGE</span>
              <span className="bd-v">{age} yrs</span>
            </div>
          </div>

          <div>
            <div className="stat-input-row"><span className="label">Gender</span></div>
            <div className="gender-grid">
              {[['m','Male'],['f','Female'],['nb','Non-binary'],['ud','Prefer not to say']].map(([k,l]) => (
                <button key={k} className={`gender-pill ${sex===k?'on':''}`} onClick={()=>setSex(k)}>{l}</button>
              ))}
            </div>
          </div>
        </>)}

        {step === 2 && (<>
          <h2 className="step-q">How much can you train?</h2>
          <p className="step-help">Lift days populate the schedule. Cardio is per-week.</p>

          <div style={{ marginBottom: 24 }}>
            <div className="stat-input-row"><span className="label">Lift days / week</span></div>
            <div className="pill-row">{[2,3,4,5,6].map(n => (
              <div key={n} className={`day-pill ${days===n?'active':''}`} onClick={()=>setDays(n)}>{n}</div>
            ))}</div>
          </div>

          <div>
            <div className="stat-input-row"><span className="label">Cardio target / week</span></div>
            <div className="big-number-input"><input className="num" type="number" inputMode="numeric"
              value={cardioMinStr} placeholder="90"
              onChange={(e)=>setCardioMinStr(e.target.value)}/><span className="unit">min</span></div>
          </div>
        </>)}

        {step === 3 && (<>
          <h2 className="step-q">Pick a starting split.</h2>
          <p className="step-help">Best fits for {SPORTS.find(s=>s.id===sport)?.label || 'your sport'} at {days} d/wk. Editable any time.</p>

          <div className="onb-templates">
            {ranked.map(({ tpl, liftDays }, i) => (
              <button key={tpl.id} className={`onb-tpl ${pickedTpl===tpl.id ? 'on' : ''}`} onClick={()=>setPickedTpl(tpl.id)}>
                <div className="onb-tpl-rank mono">{i === 0 ? 'BEST FIT' : `#${i+1}`}</div>
                <div className="onb-tpl-name">{tpl.name}</div>
                <div className="onb-tpl-sub">{tpl.sub}</div>
                <div className="onb-tpl-meta mono">{liftDays} LIFT · {7-liftDays} OFF</div>
                <div className="onb-tpl-mini">
                  {tpl.days.map((d, j) => (
                    <span key={j} className="tpl-cell" style={{ background:`var(--bp-${d})` }}/>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </>)}

        <div className="onboard-foot">
          <button className="btn green mesh" onClick={next} disabled={step===3 && !pickedTpl}>
            {step === total-1 ? 'Build my week' : 'Continue'} <I.arrowR/>
          </button>
        </div>
      </div>
    </div>
  );
}
