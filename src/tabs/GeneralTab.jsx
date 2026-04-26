// First tab in the navbar — main inputs + computed numbers (BMR/TDEE/macros/HR).
//
// v7 rebuild: every tile is a <Card variant="gradient">. Gradient mapping:
// Sport=priority, Birthday/sex=personal, Height=info, Weight=cardio,
// BMR/TDEE=energy, Macros=recovery, HR=danger.

import React, { useState, Suspense, lazy } from 'react';
import { SPORTS, tdeeFor, estimateBMR, macrosFor, hrZonesFor, totalCardioMinutes, ageFromBirthday } from '../data/exercises.js';
import { IconX, IconPlus } from '../components/Icons.jsx';
import { LogWeightSheet } from '../components/LogWeightSheet.jsx';
import { useAnimatedNumber } from '../lib/useAnimatedNumber.js';
import { Subheader } from '../components/Subheader.jsx';
import { Card } from '../components/Card.jsx';

const WeightChart = lazy(() => import('../components/WeightChart.jsx'));

const TODAY_ISO = () => new Date().toISOString().slice(0, 10);
const KG_TO_LB = 2.20462;

export function GeneralTab({ profile, setProfile, days, cardioDays, showToast }) {
  const [sportOpen, setSportOpen] = useState(false);
  const [logOpen, setLogOpen] = useState(false);
  const weightLog = profile.weightLog || [];

  const logWeight = ({ date, kg, unit }) => {
    setProfile(p => {
      const existing = (p.weightLog || []).filter(w => w.date !== date);
      const next = [...existing, { date, kg }].sort((a, b) => a.date.localeCompare(b.date));
      const latest = next[next.length - 1];
      const displayWeight = (p.wUnit === 'lb')
        ? Math.round(latest.kg * KG_TO_LB)
        : Math.round(latest.kg * 10) / 10;
      return { ...p, weightLog: next, weight: displayWeight, wUnit: unit || p.wUnit };
    });
    setLogOpen(false);
    showToast && showToast(`Logged ${kg} kg`);
  };

  const animWeight = useAnimatedNumber(Number(profile.weight) || 0, 600);

  const adjust = (key, delta, opts = {}) => {
    const min = opts.min ?? 0;
    const max = opts.max ?? 999;
    setProfile(p => ({ ...p, [key]: Math.max(min, Math.min(max, Number(p[key] || 0) + delta)) }));
  };
  const setUnit = (kind, unit) => {
    setProfile(p => {
      const n = { ...p };
      if (kind === 'w') {
        if (unit === 'kg' && p.wUnit === 'lb') n.weight = Math.round(p.weight * 0.4536);
        if (unit === 'lb' && p.wUnit === 'kg') n.weight = Math.round(p.weight / 0.4536);
        n.wUnit = unit;
      }
      // Height handling moved to Profile/Settings tab (v9 Issue 4).
      return n;
    });
  };

  const sportObj = SPORTS.find(s => s.id === profile.sport) || { label: '—', sub: '' };
  const age = (profile.birthday && ageFromBirthday(profile.birthday)) || profile.age || 22;
  const tdee = tdeeFor(profile);
  const bmr = estimateBMR(profile);
  const macros = macrosFor(profile, tdee);
  const hr = hrZonesFor(age);

  const liftDays = (days || []).filter(d => d && !d.rest).length;
  const cardioMin = totalCardioMinutes(cardioDays || []);

  return (
    <div className="tab-pane gen-page">
      <div className="gen-hero">
        <div className="gh-kicker mono">YOUR PROFILE</div>
        <div className="gh-h">Hi, {sportObj.label.toLowerCase()} athlete.</div>
        <div className="gh-sub">{liftDays} lift / wk · {cardioMin}m cardio planned</div>
      </div>

      <Subheader>Inputs</Subheader>
      <div className="gen-grid">
        <Card variant="gradient" gradient="priority" size="md" interactive
              className="span-2" onClick={() => setSportOpen(true)}>
          <Card.Eyebrow>SPORT</Card.Eyebrow>
          <div className="gen-row">
            <Card.Value>{sportObj.label}</Card.Value>
            <span className="gen-chev" aria-hidden="true">›</span>
          </div>
          <Card.Sub>{sportObj.sub || 'Tap to change'}</Card.Sub>
        </Card>

        {/* Height tile moved to Profile/Settings in v9 (Issue 4). */}
        <Card variant="gradient" gradient="cardio" size="md" className="span-2">
          <div className="gen-row">
            <Card.Eyebrow>WEIGHT</Card.Eyebrow>
            <UnitToggle value={profile.wUnit} onChange={u=>setUnit('w', u)} options={[['kg','KG'],['lb','LB']]}/>
          </div>
          <div className="gen-weight-card-row">
            <Card.Value unit={profile.wUnit}>{animWeight.toFixed(profile.wUnit === 'kg' ? 1 : 0)}</Card.Value>
            <button className="gen-weight-log-btn" onClick={()=>setLogOpen(true)} type="button">
              <IconPlus/> Log weigh-in
            </button>
          </div>
          <div className="gen-weight-chart-host">
            <Suspense fallback={<div style={{padding:8,opacity:0.7}}>Loading chart…</div>}>
              <WeightChart data={weightLog} unit={profile.wUnit}/>
            </Suspense>
          </div>
        </Card>

        <Card variant="gradient" gradient="personal" size="md" className="span-2">
          <Card.Eyebrow>GENDER (FOR BMR)</Card.Eyebrow>
          <div className="gen-seg-four">
            {[['m','Male'],['f','Female'],['nb','Non-binary'],['ud','Prefer not to say']].map(([k,l]) => (
              <button key={k} className={profile.sex===k?'on':''} onClick={()=>setProfile(p=>({...p, sex:k}))} type="button">{l}</button>
            ))}
          </div>
        </Card>
      </div>

      <Subheader gradient>Your numbers</Subheader>
      <div className="gen-grid">
        <Card variant="gradient" gradient="personal" size="md">
          <Card.Eyebrow>AGE</Card.Eyebrow>
          <Card.Value unit="yrs">{age}</Card.Value>
          <Card.Sub>From birthday on Profile</Card.Sub>
        </Card>
        <Card variant="gradient" gradient="energy" size="md">
          <Card.Eyebrow>CALORIES / DAY</Card.Eyebrow>
          <Card.Value unit="kcal">{tdee || '—'}</Card.Value>
          <Card.Sub>BMR {bmr} · {profile.days || 4}d/wk</Card.Sub>
        </Card>
        <Card variant="gradient" gradient="recovery" size="md">
          <Card.Eyebrow>PROTEIN</Card.Eyebrow>
          <Card.Value unit="g">{macros.protein || '—'}</Card.Value>
          <Card.Sub>1.8 g / kg body</Card.Sub>
        </Card>
        <Card variant="gradient" gradient="recovery" size="md">
          <Card.Eyebrow>FAT</Card.Eyebrow>
          <Card.Value unit="g">{macros.fat || '—'}</Card.Value>
          <Card.Sub>25% of TDEE</Card.Sub>
        </Card>
        <Card variant="gradient" gradient="recovery" size="md">
          <Card.Eyebrow>CARBS</Card.Eyebrow>
          <Card.Value unit="g">{macros.carbs || '—'}</Card.Value>
          <Card.Sub>remainder</Card.Sub>
        </Card>
        <Card variant="gradient" gradient="danger" size="md">
          <Card.Eyebrow>MAX HR</Card.Eyebrow>
          <Card.Value unit="bpm">{hr.max || '—'}</Card.Value>
          <Card.Sub>208 − 0.7 × age</Card.Sub>
        </Card>
        <Card variant="gradient" gradient="danger" size="md" className="span-2">
          <Card.Eyebrow>Z2 ZONE</Card.Eyebrow>
          <Card.Value unit={`–${hr.z2?.[1] || '—'} bpm`}>{hr.z2?.[0] || '—'}</Card.Value>
          <Card.Sub>60–70% of max · easy aerobic</Card.Sub>
        </Card>
      </div>

      {sportOpen && (
        <SportSheet
          current={profile.sport}
          onPick={(id) => { setProfile(p => ({ ...p, sport: id })); setSportOpen(false); showToast(`Sport: ${SPORTS.find(s=>s.id===id)?.label}`); }}
          onClose={() => setSportOpen(false)}
        />
      )}

      {logOpen && (
        <LogWeightSheet
          defaultUnit={profile.wUnit}
          defaultWeight={profile.weight}
          onSubmit={logWeight}
          onClose={() => setLogOpen(false)}
        />
      )}

      <div style={{ height: 24 }}/>
    </div>
  );
}

function Stepper({ onMinus, onPlus }) {
  return (
    <div className="gen-step">
      <button className="gen-step-btn" onClick={(e)=>{ e.stopPropagation(); onMinus(); }} aria-label="Decrease" type="button">−</button>
      <button className="gen-step-btn" onClick={(e)=>{ e.stopPropagation(); onPlus(); }} aria-label="Increase" type="button">+</button>
    </div>
  );
}

function UnitToggle({ value, onChange, options }) {
  return (
    <div className="gen-unit-toggle" onClick={e=>e.stopPropagation()}>
      {options.map(([k, l]) => (
        <button key={k} className={value===k?'on':''} onClick={()=>onChange(k)} type="button">{l}</button>
      ))}
    </div>
  );
}

function SportSheet({ current, onPick, onClose }) {
  return (
    <div className="ps-overlay" onClick={onClose}>
      <div className="ps-sheet" onClick={e=>e.stopPropagation()}>
        <div className="ps-head">
          <div>
            <div className="ps-t">Pick a sport</div>
            <div className="ps-s mono">{SPORTS.length} OPTIONS</div>
          </div>
          <button className="ip-x" onClick={onClose} aria-label="Close"><IconX/></button>
        </div>
        <div className="sx-list">
          {SPORTS.map(s => (
            <button key={s.id} className={`sx-row ${current === s.id ? 'in' : ''}`}
              style={{ '--bp': 'var(--accent)' }}
              onClick={() => onPick(s.id)}
              disabled={current === s.id}>
              <div className="sx-body">
                <div className="sx-n">{s.label}</div>
                <div className="sx-m mono">{s.sub}</div>
              </div>
              <span className="sx-add">{current === s.id ? <IconX/> : <IconPlus/>}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
