// Profile — settings only (units, theme, privacy, account, reset).
// Body / training inputs live on General. Reachable via the avatar tap.
//
// v8: rows are surface Cards, sections use <Subheader>, Reset is a
// prominent gradient="danger" card.

import React, { useState } from 'react';
import { SPORTS, ageFromBirthday, birthdayFromAge } from '../data/exercises.js';
import { RotateCcw } from 'lucide-react';
import { Card } from '../components/Card.jsx';
import { Subheader } from '../components/Subheader.jsx';
import { Toggle as SLToggle } from '../components/Toggle.jsx';

const TODAY_STR = new Date().toISOString().slice(0, 10);

// Convert any stored height to a {cm:Number, in:Number} pair regardless of
// what unit it's currently stored as. WHY: pre-v9 imperial used decimal
// feet (e.g. 5.9 ft); v9+ uses whole inches (e.g. 71 in). This bridges
// both during the migration window.
function heightInBoth(height, hUnit) {
  if (hUnit === 'cm') {
    const cm = Math.round(Number(height) || 0);
    return { cm, inches: Math.round(cm / 2.54) };
  }
  // hUnit could be 'in' (v9+) or 'ft' (legacy decimal feet) — normalize.
  const raw = Number(height) || 0;
  const inches = hUnit === 'in' ? Math.round(raw) : Math.round(raw * 12);
  return { cm: Math.round(inches * 2.54), inches };
}

export function ProfileTab({ profile, setProfile, theme, setTheme, onLogout, onResetAll }) {
  const [units, setUnits] = useState(profile.hUnit === 'cm' ? 'metric' : 'imperial');
  const [notif, setNotif] = useState(true);
  const [share, setShare] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [coachTone, setCoachTone] = useState('balanced');
  const [resetArmed, setResetArmed] = useState(false);

  const setUnitsTo = (u) => {
    setUnits(u);
    setProfile(p => {
      const both = heightInBoth(p.height, p.hUnit);
      return {
        ...p,
        hUnit: u === 'metric' ? 'cm' : 'in',
        wUnit: u === 'metric' ? 'kg' : 'lb',
        height: u === 'metric' ? both.cm : both.inches,
        weight: u === 'metric'
          ? (p.wUnit === 'lb' ? Math.round(p.weight * 0.4536) : p.weight)
          : (p.wUnit === 'kg' ? Math.round(p.weight / 0.4536) : p.weight),
      };
    });
  };

  const doReset = () => {
    setResetArmed(false);
    if (onResetAll) onResetAll();
    else if (onLogout) onLogout();
  };

  const sportLabel = SPORTS.find(s=>s.id===profile.sport)?.label || '';
  const birthday = profile.birthday || birthdayFromAge(profile.age || 22);
  const age = ageFromBirthday(birthday) || 22;
  const setBirthday = (bday) => setProfile(p => ({ ...p, birthday: bday, age: ageFromBirthday(bday) || p.age }));

  // Height handling — accepts cm or inches. Always normalize to current
  // hUnit when writing back to profile.
  const isMetric = profile.hUnit === 'cm';
  const heightDisplay = isMetric
    ? Math.round(Number(profile.height) || 0)
    // imperial: support legacy 'ft' (decimal feet) by converting to inches
    : (profile.hUnit === 'ft' ? Math.round((Number(profile.height) || 0) * 12) : Math.round(Number(profile.height) || 0));
  const heightUnitLabel = isMetric ? 'cm' : 'in';
  const setHeight = (n) => {
    const num = Math.max(0, Math.min(300, Number(n) || 0));
    setProfile(p => ({ ...p, height: num, hUnit: isMetric ? 'cm' : 'in' }));
  };

  return (
    <div className="tab-pane prof2">
      {/* Hero — gradient personal card */}
      <Card variant="gradient" gradient="personal" size="lg" className="prof-hero-card">
        <div className="prof-avatar-xl">A</div>
        <div className="prof-hero-name">Alex Chen</div>
        <div className="prof-hero-handle">@alex · {sportLabel}</div>
        <div className="prof-hero-stats">
          <ProfStat v={heightDisplay} u={heightUnitLabel} k="HEIGHT"/>
          <ProfStat v={profile.weight} u={profile.wUnit} k="WEIGHT"/>
          <ProfStat v={profile.days}    u="/wk"          k="TRAINING"/>
        </div>
      </Card>

      <Card variant="subtle" size="sm" className="prof-callout">
        Edit body & training inputs on the General tab.
      </Card>

      <Subheader>You</Subheader>
      <div className="prof-stack">
        <SettingsRow
          label="Birthday"
          right={
            <input className="bday-input compact" type="date"
              value={birthday} max={TODAY_STR} min="1900-01-01"
              onChange={(e)=>setBirthday(e.target.value)}/>
          }
        />
        <SettingsRow
          label="Age"
          sub="Auto-derived from birthday"
          right={<span className="prof-val">{age} yrs</span>}
        />
        <SettingsRow
          label="Height"
          sub={isMetric ? 'centimeters' : 'inches'}
          right={
            <input
              className="prof-num-input"
              type="number"
              inputMode="numeric"
              min={isMetric ? 80 : 30}
              max={isMetric ? 240 : 96}
              step={1}
              value={heightDisplay}
              onChange={(e) => setHeight(e.target.value)}
              aria-label={`Height in ${heightUnitLabel}`}
            />
          }
        />
      </div>

      <Subheader>Units &amp; display</Subheader>
      <div className="prof-stack">
        <SettingsRow label="Units" right={
          <SLToggle value={units} onChange={setUnitsTo} size="sm"
            options={[{value:'metric', label:'Metric'},{value:'imperial', label:'Imperial'}]}/>
        }/>
        <SettingsRow label="Theme" right={
          <SLToggle value={theme} onChange={setTheme} size="sm"
            options={[{value:'light', label:'Light'},{value:'dark', label:'Dark'}]}/>
        }/>
        <SettingsRow label="Coach tone" right={
          <SLToggle value={coachTone} onChange={setCoachTone} size="sm"
            options={[{value:'gentle',label:'Gentle'},{value:'balanced',label:'Balanced'},{value:'drill',label:'Drill'}]}/>
        }/>
      </div>

      <Subheader>Privacy</Subheader>
      <div className="prof-stack">
        <SwitchRow label="Share progress publicly" sub="Public profile link." on={share} setOn={setShare}/>
        <SwitchRow label="Send notifications"     sub="Daily reminders & milestones." on={notif} setOn={setNotif}/>
        <SwitchRow label="Anonymous usage data"   sub="Help us improve." on={analytics} setOn={setAnalytics}/>
      </div>

      <Subheader>Account</Subheader>
      <div className="prof-stack">
        <SettingsRow label="Email"       right={<span className="prof-val">alex@splitlift.app</span>}/>
        <SettingsRow label="Password"    right={<button className="link-btn">Change</button>}/>
        <SettingsRow label="Export data" right={<button className="link-btn">Download</button>}/>
        <SettingsRow label="Sign out"    right={<button className="link-btn danger" onClick={onLogout}>Log out</button>}/>
      </div>

      <Subheader>Danger zone</Subheader>
      {!resetArmed ? (
        <Card
          variant="gradient"
          gradient="danger"
          size="lg"
          interactive
          onClick={()=>setResetArmed(true)}
          className="prof-reset-card"
        >
          <div className="prof-reset-row">
            <RotateCcw size={22} strokeWidth={2.4}/>
            <span>Reset everything &amp; start over</span>
          </div>
          <Card.Sub className="prof-reset-sub">
            Wipes your profile, splits, and schedule. Returns to onboarding.
          </Card.Sub>
        </Card>
      ) : (
        <Card variant="surface" size="lg" className="prof-reset-confirm">
          <Card.Title>Reset everything?</Card.Title>
          <Card.Sub>This clears your saved state and signs you out. Inputs go back to defaults next time you sign in.</Card.Sub>
          <div className="prof-reset-actions">
            <button className="ip-action" onClick={()=>setResetArmed(false)}>Cancel</button>
            <button className="ip-action danger" onClick={doReset}>Reset everything</button>
          </div>
        </Card>
      )}

      <div className="prof2-foot mono">SplitLift · v0.8.0</div>
      <div style={{height: 24}}/>
    </div>
  );
}

function ProfStat({ v, u, k }) {
  return (
    <div className="prof-hero-stat">
      <span className="v">{v}</span>
      <span className="u">{u}</span>
      <div className="k mono">{k}</div>
    </div>
  );
}

function SettingsRow({ label, sub, right }) {
  return (
    <Card variant="surface" size="row">
      <div className="sl-card-row">
        <div className="sl-card-row-body">
          <span className="settings-row-l">{label}</span>
          {sub && <span className="settings-row-s">{sub}</span>}
        </div>
        <div className="sl-card-row-right">{right}</div>
      </div>
    </Card>
  );
}

function SwitchRow({ label, sub, on, setOn }) {
  return (
    <Card variant="surface" size="row">
      <div className="sl-card-row">
        <div className="sl-card-row-body">
          <span className="settings-row-l">{label}</span>
          {sub && <span className="settings-row-s">{sub}</span>}
        </div>
        <div className="sl-card-row-right">
          <button className={`switch ${on?'on':''}`} onClick={()=>setOn(!on)} aria-pressed={on}/>
        </div>
      </div>
    </Card>
  );
}
