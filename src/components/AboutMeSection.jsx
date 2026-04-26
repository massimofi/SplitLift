// "About me" section — sport picker, gender, computed numbers (age, BMR/
// TDEE, macros, HR zones). v11.5 Issue 4 moved this out of GeneralTab.

import React, { useState } from 'react';
import {
  SPORTS, tdeeFor, estimateBMR, macrosFor, hrZonesFor, ageFromBirthday,
} from '../data/exercises.js';
import { IconX, IconPlus } from './Icons.jsx';
import { Subheader } from './Subheader.jsx';
import { Card } from './Card.jsx';

export function AboutMeSection({ profile, setProfile, showToast }) {
  const [sportOpen, setSportOpen] = useState(false);

  const sportObj = SPORTS.find(s => s.id === profile.sport) || { label: '—', sub: '' };
  const age = (profile.birthday && ageFromBirthday(profile.birthday)) || profile.age || 22;
  const tdee = tdeeFor(profile);
  const bmr = estimateBMR(profile);
  const macros = macrosFor(profile, tdee);
  const hr = hrZonesFor(age);

  return (
    <>
      <Subheader subtitle="Sport, gender, and the inputs that drive your plan.">About me</Subheader>
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

        <Card variant="gradient" gradient="personal" size="md" className="span-2">
          <Card.Eyebrow>GENDER (FOR BMR)</Card.Eyebrow>
          <div className="gen-seg-four">
            {[['m','Male'],['f','Female'],['nb','Non-binary'],['ud','Prefer not to say']].map(([k,l]) => (
              <button key={k} className={profile.sex===k?'on':''} onClick={()=>setProfile(p=>({...p, sex:k}))} type="button">{l}</button>
            ))}
          </div>
        </Card>
      </div>

      <Subheader gradient subtitle="Auto-calculated — Mifflin-St Jeor for BMR, Tanaka for HR.">Your numbers</Subheader>
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
          onPick={(id) => {
            setProfile(p => ({ ...p, sport: id }));
            setSportOpen(false);
            showToast && showToast(`Sport: ${SPORTS.find(s=>s.id===id)?.label}`);
          }}
          onClose={() => setSportOpen(false)}
        />
      )}
    </>
  );
}

function SportSheet({ current, onPick, onClose }) {
  return (
    <div className="ps-overlay" onClick={onClose} style={{ zIndex: 250, position: 'fixed', inset: 0 }}>
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
