// Profile — settings only (units, theme, privacy, account, reset).
// Body / training inputs live on General. Reachable via the avatar tap.

import React, { useState } from 'react';
import { SPORTS } from '../data/exercises.js';

export function ProfileTab({ profile, setProfile, theme, setTheme, onLogout, onResetAll }) {
  const [units, setUnits] = useState(profile.hUnit === 'cm' ? 'metric' : 'imperial');
  const [notif, setNotif] = useState(true);
  const [share, setShare] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [coachTone, setCoachTone] = useState('balanced');
  const [resetArmed, setResetArmed] = useState(false);

  const setUnitsTo = (u) => {
    setUnits(u);
    setProfile(p => ({
      ...p,
      hUnit: u==='metric'?'cm':'ft',
      wUnit: u==='metric'?'kg':'lb',
      height: u==='metric' ? (p.hUnit==='ft' ? Math.round(p.height*30.48) : p.height) : (p.hUnit==='cm' ? Math.round(p.height/30.48*10)/10 : p.height),
      weight: u==='metric' ? (p.wUnit==='lb' ? Math.round(p.weight*0.4536) : p.weight) : (p.wUnit==='kg' ? Math.round(p.weight/0.4536) : p.weight),
    }));
  };

  const doReset = () => {
    setResetArmed(false);
    if (onResetAll) onResetAll();
    else if (onLogout) onLogout();
  };

  const sportLabel = SPORTS.find(s=>s.id===profile.sport)?.label || '';

  return (
    <div className="tab-pane prof2">
      <div className="prof2-hero">
        <div className="avatar-xl">A</div>
        <div className="prof2-name">Alex Chen</div>
        <div className="prof2-handle">@alex · {sportLabel}</div>
        <div className="prof2-stats">
          <div><span className="v">{profile.height}</span><span className="u">{profile.hUnit}</span><div className="k mono">HEIGHT</div></div>
          <div><span className="v">{profile.weight}</span><span className="u">{profile.wUnit}</span><div className="k mono">WEIGHT</div></div>
          <div><span className="v">{profile.days}</span><span className="u">/wk</span><div className="k mono">TRAINING</div></div>
        </div>
      </div>

      <div className="ps-callout">
        <span>Edit body & training inputs on the General tab.</span>
      </div>

      <Section title="Units & display">
        <Row label="Units" right={
          <Seg value={units} onChange={setUnitsTo} options={[['metric','Metric'],['imperial','Imperial']]}/>
        }/>
        <Row label="Theme" right={
          <Seg value={theme} onChange={setTheme} options={[['light','Light'],['dark','Dark']]}/>
        }/>
        <Row label="Coach tone" right={
          <Seg value={coachTone} onChange={setCoachTone} options={[['gentle','Gentle'],['balanced','Balanced'],['drill','Drill']]}/>
        }/>
      </Section>

      <Section title="Privacy">
        <Toggle label="Share progress publicly" sub="Public profile link." on={share} setOn={setShare}/>
        <Toggle label="Send notifications" sub="Daily reminders & milestones." on={notif} setOn={setNotif}/>
        <Toggle label="Anonymous usage data" sub="Help us improve." on={analytics} setOn={setAnalytics}/>
      </Section>

      <Section title="Account">
        <Row label="Email" right={<span className="prof-val">alex@splitlift.app</span>}/>
        <Row label="Password" right={<button className="link-btn">Change</button>}/>
        <Row label="Export data" right={<button className="link-btn">Download</button>}/>
        <Row label="" right={<button className="danger-btn" onClick={onLogout}>Log out</button>}/>
      </Section>

      <Section title="Danger zone">
        {!resetArmed ? (
          <Row label="Reset all data" sub="Wipes layout + signs you out." right={
            <button className="link-btn danger" onClick={()=>setResetArmed(true)}>Reset…</button>
          }/>
        ) : (
          <div className="reset-confirm">
            <div className="rc-t">Reset everything?</div>
            <div className="rc-s">This clears your saved state and signs you out. Inputs go back to defaults next time you sign in.</div>
            <div className="rc-actions">
              <button className="ip-action" onClick={()=>setResetArmed(false)}>Cancel</button>
              <button className="ip-action danger" onClick={doReset}>Reset everything</button>
            </div>
          </div>
        )}
      </Section>

      <div className="prof2-foot mono">SplitLift · v0.5.0</div>
      <div style={{height: 24}}/>
    </div>
  );
}

function Section({ title, children }) {
  return <div className="prof2-sec"><div className="ps-t">{title}</div><div className="ps-card">{children}</div></div>;
}
function Row({ icon, label, sub, right }) {
  return (
    <div className="prof2-row">
      {icon && <span className="prow-i">{icon}</span>}
      <div className="prow-text">
        <span className="prow-l">{label}</span>
        {sub && <span className="prow-s">{sub}</span>}
      </div>
      <span className="prow-r">{right}</span>
    </div>
  );
}
function Toggle({ label, sub, on, setOn }) {
  return <div className="prof2-row toggle"><div><div className="prow-l">{label}</div>{sub && <div className="prow-s">{sub}</div>}</div><button className={`switch ${on?'on':''}`} onClick={()=>setOn(!on)}/></div>;
}
function Seg({ value, onChange, options }) {
  return <div className="seg">{options.map(([k,l])=>(<button key={k} className={value===k?'on':''} onClick={()=>onChange(k)}>{l}</button>))}</div>;
}
