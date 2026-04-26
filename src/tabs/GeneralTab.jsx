// First tab in the navbar — main inputs + computed numbers (BMR/TDEE/macros/HR).
// Drives everything downstream.

import React, { useState } from 'react';
import { SPORTS, tdeeFor, estimateBMR, macrosFor, hrZonesFor, totalCardioMinutes } from '../data/exercises.js';
import { IconX, IconPlus } from '../components/Icons.jsx';

export function GeneralTab({ profile, setProfile, days, cardioDays, showToast }) {
  const [sportOpen, setSportOpen] = useState(false);

  const adjust = (key, delta, opts = {}) => {
    const min = opts.min ?? 0;
    const max = opts.max ?? 999;
    setProfile(p => ({ ...p, [key]: Math.max(min, Math.min(max, Number(p[key] || 0) + delta)) }));
  };
  const setUnit = (kind, unit) => {
    setProfile(p => {
      const n = { ...p };
      if (kind === 'h') {
        if (unit === 'cm' && p.hUnit === 'ft') n.height = Math.round(p.height * 30.48);
        if (unit === 'ft' && p.hUnit === 'cm') n.height = Math.round((p.height / 30.48) * 10) / 10;
        n.hUnit = unit;
      } else if (kind === 'w') {
        if (unit === 'kg' && p.wUnit === 'lb') n.weight = Math.round(p.weight * 0.4536);
        if (unit === 'lb' && p.wUnit === 'kg') n.weight = Math.round(p.weight / 0.4536);
        n.wUnit = unit;
      }
      return n;
    });
  };

  const sportObj = SPORTS.find(s => s.id === profile.sport) || { label: '—', sub: '' };
  const tdee = tdeeFor(profile);
  const bmr = estimateBMR(profile);
  const macros = macrosFor(profile, tdee);
  const hr = hrZonesFor(profile.age);

  const liftDays = (days || []).filter(d => d && !d.rest).length;
  const cardioMin = totalCardioMinutes(cardioDays || []);

  return (
    <div className="tab-pane gen-page">
      <div className="gen-hero">
        <div className="gh-kicker mono">YOUR PROFILE</div>
        <div className="gh-h">Hi, {sportObj.label.toLowerCase()} athlete.</div>
        <div className="gh-sub">{liftDays} lift / wk · {cardioMin}m cardio planned</div>
      </div>

      <div className="gen-section-h">Inputs</div>
      <div className="gen-grid">
        <button className="gen-tile span-2 sport" onClick={() => setSportOpen(true)}>
          <div className="gt-label mono">SPORT</div>
          <div className="gt-row">
            <div className="gt-value">{sportObj.label}</div>
            <span className="gt-chev" aria-hidden="true">›</span>
          </div>
          <div className="gt-sub">{sportObj.sub || 'Tap to change'}</div>
        </button>

        <div className="gen-tile">
          <div className="gt-label mono">AGE</div>
          <div className="gt-value">{profile.age || 22}<span className="gt-unit">yrs</span></div>
          <Stepper onMinus={()=>adjust('age', -1, {min:14, max:90})} onPlus={()=>adjust('age', +1, {min:14, max:90})}/>
        </div>

        <div className="gen-tile">
          <div className="gt-row">
            <div className="gt-label mono">HEIGHT</div>
            <UnitToggle value={profile.hUnit} onChange={u=>setUnit('h', u)} options={[['cm','CM'],['ft','FT']]}/>
          </div>
          <div className="gt-value">{profile.height}<span className="gt-unit">{profile.hUnit}</span></div>
          <Stepper onMinus={()=>adjust('height', profile.hUnit==='cm'?-1:-0.1, {min:80, max:240})}
                   onPlus={()=>adjust('height', profile.hUnit==='cm'?+1:+0.1, {min:80, max:240})}/>
        </div>

        <div className="gen-tile">
          <div className="gt-row">
            <div className="gt-label mono">WEIGHT</div>
            <UnitToggle value={profile.wUnit} onChange={u=>setUnit('w', u)} options={[['kg','KG'],['lb','LB']]}/>
          </div>
          <div className="gt-value">{profile.weight}<span className="gt-unit">{profile.wUnit}</span></div>
          <Stepper onMinus={()=>adjust('weight', -1, {min:30, max:300})} onPlus={()=>adjust('weight', +1, {min:30, max:300})}/>
        </div>

        <div className="gen-tile span-2 sex">
          <div className="gt-label mono">GENDER (FOR BMR)</div>
          <div className="gt-seg four">
            {[['m','Male'],['f','Female'],['nb','Non-binary'],['ud','Prefer not to say']].map(([k,l]) => (
              <button key={k} className={profile.sex===k?'on':''} onClick={()=>setProfile(p=>({...p, sex:k}))}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="gen-section-h">Your numbers</div>
      <div className="gen-grid computed">
        <div className="gen-tile read">
          <div className="gt-label mono">CALORIES / DAY</div>
          <div className="gt-value">{tdee || '—'}<span className="gt-unit">kcal</span></div>
          <div className="gt-sub">BMR {bmr} · {profile.days || 4}d/wk active</div>
        </div>
        <div className="gen-tile read">
          <div className="gt-label mono">PROTEIN</div>
          <div className="gt-value">{macros.protein || '—'}<span className="gt-unit">g</span></div>
          <div className="gt-sub">1.8 g / kg body</div>
        </div>
        <div className="gen-tile read">
          <div className="gt-label mono">FAT</div>
          <div className="gt-value">{macros.fat || '—'}<span className="gt-unit">g</span></div>
          <div className="gt-sub">25% of TDEE</div>
        </div>
        <div className="gen-tile read">
          <div className="gt-label mono">CARBS</div>
          <div className="gt-value">{macros.carbs || '—'}<span className="gt-unit">g</span></div>
          <div className="gt-sub">remainder</div>
        </div>
        <div className="gen-tile read">
          <div className="gt-label mono">MAX HR</div>
          <div className="gt-value">{hr.max || '—'}<span className="gt-unit">bpm</span></div>
          <div className="gt-sub">Tanaka · 208 − 0.7 × age</div>
        </div>
        <div className="gen-tile read">
          <div className="gt-label mono">Z2 ZONE</div>
          <div className="gt-value">{hr.z2?.[0] || '—'}<span className="gt-unit">–{hr.z2?.[1] || '—'}</span></div>
          <div className="gt-sub">60–70% of max · easy aerobic</div>
        </div>
      </div>

      {sportOpen && (
        <SportSheet
          current={profile.sport}
          onPick={(id) => { setProfile(p => ({ ...p, sport: id })); setSportOpen(false); showToast(`Sport: ${SPORTS.find(s=>s.id===id)?.label}`); }}
          onClose={() => setSportOpen(false)}
        />
      )}

      <div style={{ height: 24 }}/>
    </div>
  );
}

function Stepper({ onMinus, onPlus }) {
  return (
    <div className="gt-step">
      <button className="gt-step-btn" onClick={(e)=>{ e.stopPropagation(); onMinus(); }} aria-label="Decrease">−</button>
      <button className="gt-step-btn" onClick={(e)=>{ e.stopPropagation(); onPlus(); }} aria-label="Increase">+</button>
    </div>
  );
}

function UnitToggle({ value, onChange, options }) {
  return (
    <div className="gt-unit-toggle" onClick={e=>e.stopPropagation()}>
      {options.map(([k, l]) => (
        <button key={k} className={value===k?'on':''} onClick={()=>onChange(k)}>{l}</button>
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
