// SplitLift — Schedule, Dashboard, redesigned tabs
const { useState, useEffect, useRef, useMemo } = React;

// ============ SHARED: tiny dumbbell glyph (used in figures) ============
const Dumbbell = ({size=16, color='currentColor'}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round">
    <path d="M6.5 8v8M3 10v4M17.5 8v8M21 10v4M6.5 12h11"/>
  </svg>
);

// ============ SHARED: small inline icons (no emoji per Rule 8) ============
const IconLock = ({open=false}) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="4" y="11" width="16" height="10" rx="2"/>
    {open
      ? <path d="M8 11V7a4 4 0 0 1 7-1"/>
      : <path d="M8 11V7a4 4 0 0 1 8 0v4"/>}
  </svg>
);
const IconX = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M18 6L6 18M6 6l12 12"/>
  </svg>
);
const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/>
  </svg>
);
const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
    <path d="M12 5v14M5 12h14"/>
  </svg>
);

// Map a cardio session's type to an HR zone band using profile.age.
// Used by Schedule's day picker to show target bpm next to each session.
function cardioHRZone(cardio, profile) {
  if (!cardio || !profile) return null;
  const intensityMap = { zone2:'z2', easy:'z2', bike:'z2', row:'z2', tempo:'tempo', long:'tempo', hiit:'hiit' };
  const key = intensityMap[cardio.type];
  if (!key || !window.hrZonesFor) return null;
  const zones = window.hrZonesFor(profile.age);
  return zones[key];
}

// ============ SHARED HELPERS for splits-by-type model ============
// splitsByType is the source of truth: { push: [exId,...], pull: [exId,...], ... }
// days[i].exIds is derived/cached for backward-compat with everything else.
function splitsByTypeFromDays(days) {
  // Take the first occurrence of each type's exIds. If a sport has two Push days
  // with different exercises, the second loses — that's the new canonical model.
  const out = {};
  for (const d of days || []) {
    if (!d || d.rest || !d.type) continue;
    if (out[d.type]) continue;
    out[d.type] = [...(d.exIds || [])];
  }
  return out;
}

function applySplitsByTypeToDays(days, splitsByType) {
  if (!splitsByType) return days;
  return days.map(d => {
    if (!d || d.rest) return d;
    const list = splitsByType[d.type];
    if (!list) return d;
    return { ...d, exIds: [...list] };
  });
}

Object.assign(window, { splitsByTypeFromDays, applySplitsByTypeToDays });

// ================================================================
// GENERAL TAB — main stats + computed numbers (BMR / TDEE / macros / HR)
// First tab in the navbar. Drives everything downstream.
// ================================================================
function GeneralTab({ profile, setProfile, days, cardioDays, showToast }) {
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

  const sportObj = (window.SPORTS || []).find(s => s.id === profile.sport) || { label: '—', sub: '' };
  const tdee = window.tdeeFor ? window.tdeeFor(profile) : 0;
  const bmr = window.estimateBMR ? window.estimateBMR(profile) : 0;
  const macros = window.macrosFor ? window.macrosFor(profile, tdee) : { protein: 0, fat: 0, carbs: 0 };
  const hr = window.hrZonesFor ? window.hrZonesFor(profile.age) : { max: 0, z2: [0,0], hiit: [0,0] };

  // Quick week totals so General feels alive
  const liftDays = (days || []).filter(d => d && !d.rest).length;
  const cardioMin = window.totalCardioMinutes ? window.totalCardioMinutes(cardioDays || []) : 0;

  return (
    <div className="tab-pane gen-page">
      {/* Greeting hero */}
      <div className="gen-hero">
        <div className="gh-kicker mono">YOUR PROFILE</div>
        <div className="gh-h">Hi, {sportObj.label.toLowerCase()} athlete.</div>
        <div className="gh-sub">{liftDays} lift / wk · {cardioMin}m cardio planned</div>
      </div>

      {/* Inputs grid */}
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
          <div className="gt-label mono">DAYS / WEEK</div>
          <div className="gt-value">{profile.days}<span className="gt-unit">/wk</span></div>
          <Stepper onMinus={()=>adjust('days', -1, {min:1, max:7})} onPlus={()=>adjust('days', +1, {min:1, max:7})}/>
        </div>

        <div className="gen-tile">
          <div className="gt-label mono">CARDIO</div>
          <div className="gt-value">{profile.cardioMin || 90}<span className="gt-unit">m/wk</span></div>
          <Stepper onMinus={()=>adjust('cardioMin', -10, {min:0, max:600})} onPlus={()=>adjust('cardioMin', +10, {min:0, max:600})}/>
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

      {/* Computed */}
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
          onPick={(id) => { setProfile(p => ({ ...p, sport: id })); setSportOpen(false); showToast(`Sport: ${(window.SPORTS.find(s=>s.id===id))?.label}`); }}
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
            <div className="ps-s mono">{(window.SPORTS || []).length} OPTIONS</div>
          </div>
          <button className="ip-x" onClick={onClose} aria-label="Close"><IconX/></button>
        </div>
        <div className="sx-list">
          {(window.SPORTS || []).map(s => (
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

// ================================================================
// SCHEDULE TAB — left palette of split + cardio chips, big day boxes.
// Drag a chip onto a day, or tap a day to open the picker sheet.
// ================================================================
function ScheduleTab({ days, setDays, cardioDays, setCardioDays, locked, setLocked, profile, showToast, onJumpToSplits, splitsByType, setSplitsByType }) {
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [pickFor, setPickFor] = useState(null);

  // Drag state — single handler for split + cardio chips
  const [drag, setDrag] = useState(null);
  const [hoverIdx, setHoverIdx] = useState(null);

  const startDrag = (e, payload) => {
    const isTouch = e.touches !== undefined;
    const px = isTouch ? e.touches[0].clientX : e.clientX;
    const py = isTouch ? e.touches[0].clientY : e.clientY;
    if (!isTouch) e.preventDefault();
    setDrag({ ...payload, x: px, y: py });
  };

  const setDayType = (idx, typeId) => {
    if (locked[idx]) { showToast('Locked — unlock first'); return; }
    setDays(prev => prev.map((d, i) => i === idx ? makeDayForType(typeId, profile, splitsByType) : d));
    showToast(`${window.DAY_NAMES[idx]}: ${window.DAY_TYPES[typeId]?.label}`);
  };

  const addCardioToDay = (idx, cid) => {
    if (locked[idx]) { showToast('Locked — unlock first'); return; }
    setCardioDays(prev => {
      const next = prev.map(d => ({ items: [...d.items] }));
      next[idx].items.push(cid);
      return next;
    });
    const c = window.cardioFor(cid);
    showToast(`${window.DAY_NAMES[idx]}: + ${c?.name || 'cardio'}`);
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e) => {
      const isTouch = e.touches !== undefined;
      const px = isTouch ? e.touches[0].clientX : e.clientX;
      const py = isTouch ? e.touches[0].clientY : e.clientY;
      const el = document.elementFromPoint(px, py);
      const slot = el && el.closest && el.closest('[data-sched-day]');
      const idx = slot ? parseInt(slot.getAttribute('data-sched-day'), 10) : null;
      setDrag(d => d ? { ...d, x: px, y: py } : null);
      setHoverIdx(idx);
      if (isTouch) e.preventDefault();
    };
    const up = () => {
      if (drag && hoverIdx !== null) {
        if (drag.kind === 'split') setDayType(hoverIdx, drag.id);
        else if (drag.kind === 'cardio') addCardioToDay(hoverIdx, drag.id);
      }
      setDrag(null); setHoverIdx(null);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
    };
  }, [drag, hoverIdx, locked, profile, splitsByType]);

  const removeCardio = (dayIdx, itemIdx) => {
    if (locked[dayIdx]) { showToast('Locked — unlock first'); return; }
    setCardioDays(prev => {
      const next = prev.map(d => ({ items: [...d.items] }));
      next[dayIdx].items.splice(itemIdx, 1);
      return next;
    });
  };

  const toggleLockAt = (idx) => {
    setLocked(prev => prev.map((v, j) => j === idx ? !v : v));
    showToast(locked[idx] ? `${window.DAY_NAMES[idx]} unlocked` : `${window.DAY_NAMES[idx]} locked`);
  };

  const clearDay = (idx) => {
    if (locked[idx]) { showToast('Locked — unlock first'); return; }
    setDays(prev => prev.map((d, i) => i === idx ? makeDayForType('rest', profile, splitsByType) : d));
    setCardioDays(prev => prev.map((d, i) => i === idx ? { items: [] } : d));
    setPickFor(null);
    showToast(`${window.DAY_NAMES[idx]} cleared`);
  };

  const todayIdx = (() => { const j = new Date().getDay(); return j === 0 ? 6 : j - 1; })();
  const splitChips  = ['push','pull','legs','upper','lower','full','rest'];
  const cardioChips = (window.CARDIO_LIBRARY || []).slice(0, 6); // first 6 to keep palette short

  return (
    <div className="tab-pane sched-page">
      <div className="sched-bar">
        <div className="sched-h1">Your week</div>
        <button className="presets-btn" onClick={()=>setPresetsOpen(true)}>Presets</button>
      </div>

      <div className="sched-layout">
        {/* Left palette — sticky, drag-source for splits + cardios */}
        <div className="sched-palette">
          <div className="sp-h mono">SPLIT</div>
          {splitChips.map(p => {
            const dt = window.DAY_TYPES[p];
            if (!dt) return null;
            return (
              <button key={p} className="sp-chip"
                style={{ '--bp': `var(--bp-${p})` }}
                onMouseDown={(e)=>startDrag(e, { kind:'split', id:p })}
                onTouchStart={(e)=>startDrag(e, { kind:'split', id:p })}
                onClick={()=>onJumpToSplits && onJumpToSplits(p)}>
                {dt.label}
              </button>
            );
          })}
          <div className="sp-h mono">CARDIO</div>
          {cardioChips.map(c => {
            const tcol = window.CARDIO_TYPES[c.type]?.color;
            return (
              <button key={c.id} className="sp-chip cardio"
                style={{ '--bp': tcol || 'var(--ink-3)' }}
                onMouseDown={(e)=>startDrag(e, { kind:'cardio', id:c.id })}
                onTouchStart={(e)=>startDrag(e, { kind:'cardio', id:c.id })}>
                <span className="sp-c-name">{window.CARDIO_TYPES[c.type]?.label || c.name}</span>
                <span className="sp-c-meta mono">{c.dur}m</span>
              </button>
            );
          })}
        </div>

        {/* Right column — big day boxes, drop targets + tap to open picker */}
        <div className="sched-rows">
          {window.DAY_NAMES.map((dn, i) => {
            const day = days[i] || { type: 'rest', rest: true };
            const t = day.type || 'rest';
            const dt = window.DAY_TYPES[t] || window.DAY_TYPES.custom;
            const cItems = (cardioDays && cardioDays[i] && cardioDays[i].items) || [];
            const isToday = todayIdx === i;
            const isLocked = locked[i];
            const isRest = t === 'rest';
            const isHover = hoverIdx === i;

            return (
              <button key={i} data-sched-day={i}
                className={`sched-row ${isToday?'today':''} ${isLocked?'locked':''} ${isRest?'is-rest':''} ${isHover?'is-hover':''}`}
                style={{ '--bp': `var(--bp-${t})` }}
                onClick={() => setPickFor(i)}>
                <div className="sr-day">
                  <div className="sr-d mono">{dn.toUpperCase()}</div>
                  {isToday && <span className="sr-today-tag mono">TODAY</span>}
                </div>
                <div className="sr-mid">
                  <div className="sr-type">{dt.label}</div>
                  {cItems.length > 0 ? (
                    <div className="sr-cardios">
                      {cItems.slice(0, 3).map((cid, k) => {
                        const c = window.cardioFor(cid);
                        const col = c && window.CARDIO_TYPES[c.type]?.color;
                        return (
                          <span key={k} className="sr-c-pill" style={{ background: col || 'var(--ink-3)' }}>
                            {c?.dur || 0}m
                          </span>
                        );
                      })}
                      {cItems.length > 3 && <span className="sr-c-pill more mono">+{cItems.length - 3}</span>}
                    </div>
                  ) : (
                    <div className="sr-sub">{dt.sub}</div>
                  )}
                </div>
                <div className="sr-right">
                  {isLocked && <span className="sr-lock"><IconLock/></span>}
                  <span className="sr-chev" aria-hidden="true">›</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating drag ghost */}
      {drag && (
        <div className="drag-ghost" style={{ left: drag.x - 50, top: drag.y - 22,
              '--bp': drag.kind === 'split'
                ? `var(--bp-${drag.id})`
                : (window.CARDIO_TYPES[window.cardioFor(drag.id)?.type]?.color || 'var(--ink-3)') }}>
          {drag.kind === 'split'
            ? window.DAY_TYPES[drag.id]?.label
            : window.cardioFor(drag.id)?.name}
        </div>
      )}

      {pickFor !== null && (
        <DayPickerSheet
          dayIdx={pickFor}
          dayType={(days[pickFor] && days[pickFor].type) || 'rest'}
          cardios={(cardioDays[pickFor] && cardioDays[pickFor].items) || []}
          isLocked={locked[pickFor]}
          profile={profile}
          onClose={() => setPickFor(null)}
          onSetType={(t) => setDayType(pickFor, t)}
          onAddCardio={(cid) => addCardioToDay(pickFor, cid)}
          onRemoveCardio={(idx) => removeCardio(pickFor, idx)}
          onClear={() => clearDay(pickFor)}
          onToggleLock={() => toggleLockAt(pickFor)}
          onEditExercises={() => {
            const t = (days[pickFor] && days[pickFor].type) || 'rest';
            if (t !== 'rest' && t !== 'sport' && t !== 'cardio') {
              setPickFor(null);
              onJumpToSplits && onJumpToSplits(t);
            }
          }}
        />
      )}

      {presetsOpen && (
        <PresetsSheet
          profile={profile}
          locked={locked}
          days={days}
          setDays={setDays}
          splitsByType={splitsByType}
          setSplitsByType={setSplitsByType}
          showToast={showToast}
          onClose={()=>setPresetsOpen(false)}
        />
      )}

      <div style={{ height: 28 }}/>
    </div>
  );
}

// One sheet to edit a day: lift type chips + cardio adds + lock + clear + cardios on this day.
function DayPickerSheet({ dayIdx, dayType, cardios, isLocked, profile, onClose, onSetType, onAddCardio, onRemoveCardio, onClear, onToggleLock, onEditExercises }) {
  const [whyOpen, setWhyOpen] = useState(false);
  const splitTypes = ['push','pull','legs','upper','lower','full','rest'];
  const cardioLib = window.CARDIO_LIBRARY || [];
  const dt = window.DAY_TYPES[dayType] || window.DAY_TYPES.custom;
  const canEditExercises = dayType && dayType !== 'rest' && dayType !== 'sport' && dayType !== 'cardio';
  const targetMin = profile?.cardioMin || 90;
  const perDay = Math.round(targetMin / 7);

  return (
    <div className="ps-overlay" onClick={onClose}>
      <div className="ps-sheet" onClick={e=>e.stopPropagation()}>
        <div className="ps-head">
          <div>
            <div className="ps-t">{window.DAY_NAMES[dayIdx]}</div>
            <div className="ps-s mono">CURRENT · {dt.label.toUpperCase()}</div>
          </div>
          <button className="ip-x" onClick={onClose} aria-label="Close"><IconX/></button>
        </div>

        <div className="ip-actions">
          <button className={`ip-action ${isLocked?'locked':''}`} onClick={onToggleLock}>
            <IconLock open={isLocked}/>{isLocked ? 'Unlock' : 'Lock'}
          </button>
          <button className="ip-action danger" onClick={onClear} disabled={isLocked}
                  style={isLocked ? { opacity: 0.4, cursor:'not-allowed' } : null}>
            <IconTrash/>Clear
          </button>
        </div>

        <div className="ps-section">Lift type</div>
        <div className="dp-grid">
          {splitTypes.map(t => {
            const dt2 = window.DAY_TYPES[t] || window.DAY_TYPES.custom;
            const isOn = dayType === t;
            return (
              <button key={t}
                className={`dp-chip ${isOn ? 'on' : ''}`}
                style={{ '--bp': `var(--bp-${t})` }}
                onClick={() => onSetType(t)}
                disabled={isLocked}>
                {dt2.label}
              </button>
            );
          })}
        </div>

        {canEditExercises && (
          <button className="dp-edit-btn" onClick={onEditExercises}>
            Edit {dt.label} exercises →
          </button>
        )}

        <div className="ps-section-row">
          <div className="ps-section">Add cardio</div>
          <button className="ps-why" onClick={()=>setWhyOpen(o=>!o)}>{whyOpen ? 'Hide why' : 'Why this much?'}</button>
        </div>
        {whyOpen && (
          <div className="ps-why-body">
            Your weekly target is <b>{targetMin} min</b> (set on General). Spread across 7 days
            that's about <b>{perDay} min/day</b>. CDC suggests 150 min/wk moderate or 75 min/wk vigorous —
            you can adjust the target on the General tab.
          </div>
        )}
        <div className="dp-cardio-list">
          {cardioLib.map(c => {
            const tcol = window.CARDIO_TYPES[c.type]?.color;
            const hr = cardioHRZone(c, profile);
            return (
              <button key={c.id} className="dp-cardio"
                style={{ '--bp': tcol || 'var(--ink-3)' }}
                onClick={() => onAddCardio(c.id)}
                disabled={isLocked}>
                <div className="dp-c-body">
                  <div className="dp-c-name">{c.name}</div>
                  <div className="dp-c-meta mono">
                    {c.dur}m{c.dist > 0 ? ` · ${c.dist}${c.unit}` : ''}
                    {hr && <span className="dp-c-hr"> · {hr[0]}–{hr[1]}bpm</span>}
                  </div>
                </div>
                <span className="dp-c-add"><IconPlus/></span>
              </button>
            );
          })}
        </div>

        {cardios.length > 0 && (
          <>
            <div className="ps-section">Currently scheduled</div>
            <div className="da-cardios">
              {cardios.map((cid, ii) => {
                const c = window.cardioFor(cid); if (!c) return null;
                const tcol = window.CARDIO_TYPES[c.type]?.color;
                const hr = cardioHRZone(c, profile);
                return (
                  <div key={ii} className="da-cardio-row" style={{ '--bp': tcol }}>
                    <div className="dac-body">
                      <div className="dac-n">{c.name}</div>
                      <div className="dac-m mono">
                        {c.dur}m{c.dist > 0 ? ` · ${c.dist}${c.unit}` : ''}
                        {hr && <span> · {hr[0]}–{hr[1]}bpm</span>}
                      </div>
                    </div>
                    <button className="dac-x" onClick={() => onRemoveCardio(ii)} aria-label="Remove"><IconX/></button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Presets bottom sheet — auto-build + suggested + all templates.
// Lives behind the Presets button on Schedule. Not on the main surface.
function PresetsSheet({ profile, locked, days, setDays, splitsByType, setSplitsByType, showToast, onClose }) {
  const ranked = useMemo(
    () => (window.rankTemplatesForSport
      ? window.rankTemplatesForSport({ sport: profile.sport, days: profile.days, limit: 3 })
      : []),
    [profile.sport, profile.days]
  );
  const sportLabel = window.SPORTS.find(s => s.id === profile.sport)?.label || 'your sport';

  // Whenever a preset rebuilds days, also sync splitsByType so the new types
  // get a saved exercise list (existing types are preserved).
  const syncSplits = (newDays) => {
    if (!setSplitsByType) return;
    const fresh = window.splitsByTypeFromDays(newDays);
    setSplitsByType(prev => ({ ...(prev || {}), ...fresh }));
  };

  const applyTemplate = (id) => {
    const tpl = (window.SPLIT_TEMPLATES || []).find(t => t.id === id);
    if (!tpl) return;
    const newDays = days.map((d, i) => locked[i] ? d : makeDayForType(tpl.days[i], profile, splitsByType));
    setDays(newDays);
    syncSplits(newDays);
    showToast(`Applied: ${tpl.name}`);
    onClose();
  };

  const autoBuild = () => {
    const plan = window.planForSport({ ...profile });
    const newDays = plan.map((p, i) => locked[i] ? days[i] : p);
    setDays(newDays);
    syncSplits(newDays);
    showToast('Auto-built for your sport');
    onClose();
  };

  return (
    <div className="ps-overlay" onClick={onClose}>
      <div className="ps-sheet" onClick={e=>e.stopPropagation()}>
        <div className="ps-head">
          <div>
            <div className="ps-t">Presets</div>
            <div className="ps-s mono">{sportLabel.toUpperCase()} · {profile.days}/WK</div>
          </div>
          <button className="ip-x" onClick={onClose} aria-label="Close presets"><IconX/></button>
        </div>

        <button className="btn-mesh ps-auto" onClick={autoBuild}>Auto-build for my sport</button>

        {ranked.length > 0 && (
          <>
            <div className="ps-section">Suggested for {sportLabel}</div>
            <div className="tpl-rec-row">
              {ranked.map(({ tpl, liftDays }, i) => (
                <button key={tpl.id} className={`tpl-rec ${i===0?'top':''}`} onClick={()=>applyTemplate(tpl.id)}>
                  <div className="rec-rank">{i===0 ? 'BEST FIT' : `#${i+1}`}</div>
                  <div className="rec-name">{tpl.name}</div>
                  <div className="rec-meta">{liftDays} lift / {7-liftDays} off</div>
                  <div className="rec-mini">
                    {tpl.days.map((d, j) => (
                      <span key={j} className="tpl-cell" style={{ background:`var(--bp-${d})` }}/>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="ps-section">All templates</div>
        <div className="ps-list">
          {(window.SPLIT_TEMPLATES || []).map(t => (
            <button key={t.id} className="ps-row" onClick={()=>applyTemplate(t.id)}>
              <div className="ps-row-body">
                <div className="ps-row-n">{t.name}</div>
                <div className="ps-row-s">{t.sub}</div>
              </div>
              <div className="tpl-mini">
                {t.days.map((d, i) => (
                  <span key={i} className="tpl-cell" style={{ background:`var(--bp-${d})` }}/>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ================================================================
// SPLITS TAB — edit one day-type at a time. Source of truth = splitsByType.
// Editing here propagates to every day in the week with that type.
// ================================================================
function SplitsTab({ days, splitsByType, setSplitsByType, activeType, setActiveType, profile, showToast }) {
  const [addOpen, setAddOpen] = useState(false);

  // Day-types currently in the user's week (lift days only — skip rest/sport/cardio).
  const availableTypes = useMemo(() => {
    const seen = [];
    for (const d of days) {
      if (!d || d.rest) continue;
      if (d.type === 'sport' || d.type === 'cardio' || d.type === 'rest') continue;
      if (!seen.includes(d.type)) seen.push(d.type);
    }
    return seen;
  }, [days]);

  // If the active type is no longer in the week, jump to the first one.
  useEffect(() => {
    if (availableTypes.length === 0) return;
    if (!availableTypes.includes(activeType)) setActiveType(availableTypes[0]);
  }, [availableTypes, activeType, setActiveType]);

  const exIds = (splitsByType && splitsByType[activeType]) || [];
  const exObjs = exIds.map(id => window.EXERCISES.find(e => e.id === id)).filter(Boolean);
  const totalSets = exObjs.reduce((s, ex) => s + window.setsForExercise(ex), 0);
  const dt = window.DAY_TYPES[activeType] || window.DAY_TYPES.custom;
  const daysCount = days.filter(d => d && !d.rest && d.type === activeType).length;

  const removeAt = (i) => {
    setSplitsByType(prev => {
      const cur = [...((prev && prev[activeType]) || [])];
      cur.splice(i, 1);
      return { ...(prev || {}), [activeType]: cur };
    });
  };

  const addEx = (exId) => {
    setSplitsByType(prev => {
      const cur = [...((prev && prev[activeType]) || [])];
      if (cur.includes(exId)) return prev;
      cur.push(exId);
      return { ...(prev || {}), [activeType]: cur };
    });
    showToast(`Added to ${dt.label}`);
  };

  if (availableTypes.length === 0) {
    return (
      <div className="tab-pane splits-page">
        <div className="empty-pane">
          <div className="emp-t">No lift days yet</div>
          <div className="emp-s">Open Schedule and drop a Push / Pull / Legs chip onto a day.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-pane splits-page">
      {/* Day-type selector — only types currently in the schedule */}
      <div className="st-types">
        {availableTypes.map(t => {
          const isActive = t === activeType;
          const dt2 = window.DAY_TYPES[t] || window.DAY_TYPES.custom;
          return (
            <button key={t} className={`st-chip ${isActive ? 'on' : ''}`}
              style={{ '--bp': `var(--bp-${t})` }}
              onClick={() => setActiveType(t)}>
              {dt2.label}
            </button>
          );
        })}
      </div>

      {/* Active type meta strip */}
      <div className="st-head" style={{ '--bp': `var(--bp-${activeType})` }}>
        <div className="st-h-l">
          <div className="st-h-t">{dt.label} day</div>
          <div className="st-h-s mono">{exObjs.length} EX · {totalSets} SETS · {daysCount}× / WK</div>
        </div>
      </div>

      {/* Exercise list — full-bleed muscle color, ≥44px row, one-tap delete */}
      <div className="st-list">
        {exObjs.length === 0 ? (
          <div className="empty-pane">
            <div className="emp-t">No exercises on {dt.label} yet</div>
            <div className="emp-s">Tap the button below to add one.</div>
          </div>
        ) : (
          exObjs.map((ex, i) => (
            <div key={`${ex.id}-${i}`} className="st-ex" style={{ '--bp': `var(--bp-${ex.body || ex.type})` }}>
              <div className="st-ex-body">
                <div className="st-ex-n">{ex.name}</div>
                <div className="st-ex-m mono">{ex.sets} · {ex.gear}</div>
              </div>
              <button className="st-ex-x" onClick={() => removeAt(i)} aria-label={`Remove ${ex.name}`}><IconX/></button>
            </div>
          ))
        )}
      </div>

      <button className="st-add" onClick={() => setAddOpen(true)}>
        <IconPlus/> Add to {dt.label}
      </button>

      {addOpen && (
        <SplitExSheet
          dayType={activeType}
          existing={exIds}
          onAdd={addEx}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  );
}

// Lightweight bottom sheet — pick exercises filtered by a day-type's allowed muscles.
function SplitExSheet({ dayType, existing, onAdd, onClose }) {
  const [q, setQ] = useState('');
  const list = useMemo(() => {
    const cands = (window.exercisesForDayType ? window.exercisesForDayType(dayType) : []) || [];
    const ql = q.trim().toLowerCase();
    return ql ? cands.filter(ex => ex.name.toLowerCase().includes(ql)) : cands;
  }, [dayType, q]);
  const dt = window.DAY_TYPES[dayType] || window.DAY_TYPES.custom;
  return (
    <div className="ps-overlay" onClick={onClose}>
      <div className="ps-sheet" onClick={e=>e.stopPropagation()}>
        <div className="ps-head">
          <div>
            <div className="ps-t">Add to {dt.label}</div>
            <div className="ps-s mono">{list.length} MATCHING</div>
          </div>
          <button className="ip-x" onClick={onClose} aria-label="Close"><IconX/></button>
        </div>
        <input className="sx-search" placeholder="Search exercises…" value={q} onChange={e=>setQ(e.target.value)}/>
        <div className="sx-list">
          {list.length === 0 && <div className="empty-pane"><div className="emp-t">No matches.</div></div>}
          {list.map(ex => {
            const inUse = existing.includes(ex.id);
            return (
              <button key={ex.id} className={`sx-row ${inUse ? 'in' : ''}`}
                style={{ '--bp': `var(--bp-${ex.body || ex.type})` }}
                onClick={() => !inUse && onAdd(ex.id)}
                disabled={inUse}>
                <div className="sx-body">
                  <div className="sx-n">{ex.name}</div>
                  <div className="sx-m mono">{ex.sets} · {ex.gear}</div>
                </div>
                <span className="sx-add">{inUse ? <IconX/> : <IconPlus/>}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Build a day object for a given type. If a saved split-list exists for this type,
// reuse it (so Push-day-1 and Push-day-2 share the same exercises). Otherwise
// fall back to a sport-priority pick.
function makeDayForType(typeId, profile, splitsByType) {
  if (typeId === 'rest') return { type:'rest', focus:'Rest', exIds:[], rest:true, restNote:'Recovery is where adaptation happens.' };
  if (typeId === 'sport') return { type:'sport', focus:'Sport', exIds:[], rest:true, restNote:`${window.SPORTS.find(s=>s.id===profile.sport)?.label || 'Sport'} practice — coverage handled on the field.` };
  // Prefer the user's saved per-type list
  if (splitsByType && splitsByType[typeId] && splitsByType[typeId].length > 0) {
    return { type: typeId, focus: window.DAY_TYPES[typeId]?.label || typeId, exIds: [...splitsByType[typeId]] };
  }
  // Fallback: pick top-N matching this type weighted by sport priority
  const sp = window.SPORTS.find(s => s.id === profile.sport) || window.SPORTS[0];
  const priority = sp.priority || {};
  const score = (ex) => {
    let s = 0;
    for (const [m, w] of Object.entries(ex.hits)) s += (priority[m]||1) * w;
    return s;
  };
  const candidates = window.exercisesForDayType(typeId).filter(e => e.type !== 'cardio');
  const ranked = candidates.map(e => ({e, s: score(e)})).sort((a,b)=>b.s-a.s);
  const picked = []; const seenBody = new Set();
  for (const {e} of ranked) {
    if (seenBody.has(e.body)) continue;
    picked.push(e.id); seenBody.add(e.body);
    if (picked.length >= 4) break;
  }
  if (picked.length < 4) for (const {e} of ranked) {
    if (picked.includes(e.id)) continue;
    picked.push(e.id); if (picked.length>=4) break;
  }
  return { type: typeId, focus: window.DAY_TYPES[typeId]?.label || typeId, exIds: picked };
}

// Build a short label for the user's current split:
// match against known templates by day-type sequence; else list the distinct lift types.
function currentSplitName(days) {
  const dayTypes = (days || []).map(d => (d && (d.rest ? 'rest' : d.type)) || 'rest').join(',');
  for (const t of (window.SPLIT_TEMPLATES || [])) {
    if (t.id === 'custom') continue;
    if (t.days.join(',') === dayTypes) return t.name;
  }
  const seen = [];
  for (const d of days || []) {
    if (!d || d.rest || !d.type) continue;
    if (d.type === 'sport' || d.type === 'cardio') continue;
    if (!seen.includes(d.type)) seen.push(d.type);
  }
  if (seen.length === 0) return 'Custom';
  return seen.map(t => (window.DAY_TYPES[t]?.label || t)).join(' / ');
}

// Slow-rotating Anatomy3D figure for the Dashboard. Tap to pause.
function DashAnatomy({ sets }) {
  const [paused, setPaused] = useState(false);
  const [angle, setAngle] = useState(0);

  useEffect(() => {
    if (paused) return;
    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = now - last; last = now;
      setAngle(a => (a + (dt / 1000) * 22) % 360); // ~16s per rotation
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
        <div className="body-face front">
          {window.AnatomyFront ? <window.AnatomyFront sets={sets}/> : null}
        </div>
        <div className="body-face back">
          {window.AnatomyBack ? <window.AnatomyBack sets={sets}/> : null}
        </div>
      </div>
      {paused && <div className="da-hint mono">PAUSED · TAP TO RESUME</div>}
    </div>
  );
}

// ================================================================
// DASHBOARD TAB — fully redesigned
// ================================================================
function DashboardPage({ days, cardioDays, profile, setTab }) {
  const lift = useMemo(() => window.liftingScore(days, profile), [days, profile]);
  const cardio = useMemo(() => window.cardioScoreFor(cardioDays), [cardioDays]);
  const under = useMemo(() => window.underworkedMuscles(days), [days]);
  const sp = window.SPORTS.find(s => s.id === profile.sport) || window.SPORTS[0];
  const cov = useMemo(() => window.computeCoverage(days), [days]);
  const covV2 = useMemo(
    () => (window.computeCoverageV2 ? window.computeCoverageV2(days) : {}),
    [days]
  );
  const splitName = useMemo(() => currentSplitName(days), [days]);

  const liftMin = window.totalLiftMinutes(days);
  const cardioMin = window.totalCardioMinutes(cardioDays);
  const totalMin = liftMin + cardioMin;
  const trainingKcal = window.totalLiftKcal(days) + window.totalCardioKcal(cardioDays);

  // ---- Moveable widgets: drag-reorder + persisted in localStorage ----
  // Body figure intentionally lives near the bottom — it's a teaser for the Body tab,
  // not the centre of the dashboard. Will become a 3D model in Batch 6.
  const allWidgets = ['lift','cardio','sport','underworked','time','streak','figure'];
  const ORDER_KEY = 'sl-dash-order';
  const [order, setOrder] = useState(() => {
    try {
      const raw = window.localStorage.getItem(ORDER_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.every(x => allWidgets.includes(x))) {
          const merged = [...parsed];
          for (const w of allWidgets) if (!merged.includes(w)) merged.push(w);
          return merged;
        }
      }
    } catch (e) { /* Safari private mode etc. */ }
    return allWidgets;
  });
  useEffect(() => {
    try { window.localStorage.setItem(ORDER_KEY, JSON.stringify(order)); } catch (e) {}
  }, [order]);
  const [dragId, setDragId] = useState(null);
  const [hoverId, setHoverId] = useState(null);

  const onWStart = (id, e) => {
    setDragId(id);
  };
  const onWOver = (id, e) => {
    e.preventDefault();
    if (dragId && id !== dragId) setHoverId(id);
  };
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

  // ---- streak (faked from days planned) ----
  const streak = days.filter(d => !d.rest).length * 2 + 1; // pretend

  // ---- weekly time chart ----
  const dayTimes = window.DAY_NAMES.map((_, i) => ({
    name: window.DAY_NAMES[i],
    lift: window.liftMinutesForDay(days[i]),
    cardio: cardioDays[i].items.reduce((s,id)=>s+(window.cardioFor(id)?.dur||0), 0),
  }));
  const maxMin = Math.max(60, ...dayTimes.map(d => d.lift + d.cardio));

  // figure: slow-rotating Anatomy3D with tap-to-pause
  const FigureWidget = () => (
    <DashAnatomy sets={covV2}/>
  );

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
                <span className="lbl">{window.MUSCLE_LABELS[m] || m}</span>
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
        <FigureWidget/>
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

function ScoreRing({ value, size=110, stroke=10, color }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  const dash = c * pct;
  const [animV, setAnimV] = useState(0);
  useEffect(() => { const t = setTimeout(()=>setAnimV(value), 80); return ()=>clearTimeout(t); }, [value]);
  const animDash = c * (animV/100);
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

// ============== BODY HEATMAP (front silhouette w/ muscle tints) ==============
function BodyHeatmap({ cov, sport }) {
  const muscleSets = cov;
  const tint = (m) => {
    const sets = muscleSets[m] || 0;
    const t = window.TARGETS[m];
    if (!t) return 0.15;
    if (sets >= t.min && sets <= t.max) return 0.85;
    if (sets > t.max) return 1.0;
    return Math.max(0.15, sets / t.min * 0.5);
  };
  const c = (m) => `color-mix(in oklab, var(--bp-${m}) ${tint(m)*100}%, var(--bg-2))`;
  return (
    <div className="bh-row">
      <svg viewBox="0 0 120 200" width="100%" height="180">
        {/* head */}
        <ellipse cx="60" cy="20" rx="13" ry="15" fill="var(--bg-2)" stroke="var(--hair)"/>
        {/* shoulders */}
        <path d="M30 50 Q60 38 90 50 L88 65 Q60 58 32 65 Z" fill={c('shoulder')} stroke="var(--hair)"/>
        {/* chest */}
        <path d="M35 62 Q60 70 85 62 L82 92 Q60 100 38 92 Z" fill={c('chest')} stroke="var(--hair)"/>
        {/* arms */}
        <path d="M22 55 Q18 90 26 110 L34 108 Q30 80 32 60 Z" fill={c('bis')} stroke="var(--hair)"/>
        <path d="M98 55 Q102 90 94 110 L86 108 Q90 80 88 60 Z" fill={c('tris')} stroke="var(--hair)"/>
        {/* core */}
        <path d="M44 92 Q60 96 76 92 L74 124 Q60 128 46 124 Z" fill={c('core')} stroke="var(--hair)"/>
        {/* quads */}
        <path d="M40 124 Q60 130 80 124 L74 174 Q62 178 60 178 Q58 178 46 174 Z" fill={c('quads')} stroke="var(--hair)"/>
        {/* calves */}
        <path d="M44 174 Q52 175 56 175 L54 195 Q49 196 44 195 Z" fill={c('calves')} stroke="var(--hair)"/>
        <path d="M64 174 Q68 175 76 175 L74 195 Q69 196 64 195 Z" fill={c('calves')} stroke="var(--hair)"/>
      </svg>
      <div className="bh-legend">
        <div className="bh-l-h">Coverage</div>
        {['chest','back','shoulder','bis','tris','quads','hams','glutes','core','calves'].map(m => {
          const sets = muscleSets[m] || 0;
          const t = window.TARGETS[m];
          const status = window.statusFor(sets, t || {min:0,max:0});
          return (
            <div key={m} className="bh-li">
              <span className="bh-d" style={{background:`var(--bp-${m})`}}/>
              <span className="bh-n">{window.MUSCLE_LABELS[m] || m}</span>
              <span className={`bh-s status-${status}`}>{sets}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================
// PROFILE V2 — settings only (units, display, privacy, account, reset).
// Inputs / body math live on the General tab; this is the "gear cog" page.
// ============================================
function ProfileV2({ profile, setProfile, theme, setTheme, onLogout }) {
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
    try {
      window.localStorage.removeItem('sl-dash-order');
    } catch (e) {}
    setResetArmed(false);
    onLogout && onLogout();
  };

  const sportLabel = window.SPORTS.find(s=>s.id===profile.sport)?.label || '';

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
            <div className="rc-s">This clears your dashboard layout and signs you out. Inputs go back to defaults next time you sign in.</div>
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
function NumStepper({ value, unit, onChange, min=0, max=999 }) {
  return (
    <div className="numstep">
      <button onClick={()=>onChange(Math.max(min, Number(value)-1))}>−</button>
      <span className="ns-v">{value}<span className="ns-u">{unit}</span></span>
      <button onClick={()=>onChange(Math.min(max, Number(value)+1))}>+</button>
    </div>
  );
}

// ================================================================
// CARDIO V2 — weekly splits with miles, time, intervals breakdown
// ================================================================
function CardioPageV2({ cardioDays, setCardioDays, onOpenCardioSheet }) {
  const totalMin = window.totalCardioMinutes(cardioDays);
  const totalMi = window.totalCardioMiles(cardioDays);
  const totalKcal = window.totalCardioKcal(cardioDays);

  // intervals = HIIT-style sessions
  const intervals = cardioDays.reduce((s, d) => s + d.items.filter(id => window.cardioFor(id)?.type === 'hiit').length, 0);
  const z2Min = cardioDays.reduce((s, d) => s + d.items.reduce((m,id)=>{
    const c = window.cardioFor(id); return m + (c && (c.type==='zone2'||c.type==='easy') ? c.dur : 0);
  }, 0), 0);
  const tempoMin = cardioDays.reduce((s, d) => s + d.items.reduce((m,id)=>{
    const c = window.cardioFor(id); return m + (c && (c.type==='tempo'||c.type==='long') ? c.dur : 0);
  }, 0), 0);

  const sessions = cardioDays.filter(d => d.items.length > 0).length;

  // type breakdown
  const byType = {};
  cardioDays.forEach(d => d.items.forEach(id => {
    const c = window.cardioFor(id); if (!c) return;
    byType[c.type] = (byType[c.type]||0) + c.dur;
  }));
  const totalTypeMin = Object.values(byType).reduce((a,b)=>a+b, 0) || 1;

  const removeItem = (di, ii) => {
    setCardioDays(prev => {
      const next = prev.map(d => ({ items: [...d.items] }));
      next[di].items.splice(ii, 1);
      return next;
    });
  };

  return (
    <div className="tab-pane cardio2">
      {/* Hero stats grid */}
      <div className="c2-hero">
        <div className="c2-stat big">
          <div className="c2-k mono">WEEKLY MILES</div>
          <div className="c2-v">{totalMi}<span className="u">mi</span></div>
        </div>
        <div className="c2-stat">
          <div className="c2-k mono">TIME</div>
          <div className="c2-v">{Math.floor(totalMin/60)}<span className="u">h</span> {totalMin%60}<span className="u">m</span></div>
        </div>
        <div className="c2-stat">
          <div className="c2-k mono">INTERVALS</div>
          <div className="c2-v">{intervals}<span className="u">×</span></div>
        </div>
        <div className="c2-stat">
          <div className="c2-k mono">KCAL</div>
          <div className="c2-v">{totalKcal}</div>
        </div>
      </div>

      {/* Type breakdown — horizontal stacked bar */}
      <div className="c2-card">
        <div className="c2-card-h"><div className="c2-card-t">Time by zone</div><div className="c2-card-s mono">{Math.round(totalMin)}m total</div></div>
        <div className="c2-stack">
          {Object.entries(byType).map(([t, m]) => {
            const c = window.CARDIO_TYPES[t];
            const pct = (m / totalTypeMin) * 100;
            return (
              <div key={t} className="c2-seg" style={{ width: `${pct}%`, background: c.color }} title={`${c.label} ${m}m`}>
                {pct > 12 && <span className="c2-seg-l">{c.label} · {m}m</span>}
              </div>
            );
          })}
          {totalMin === 0 && <div className="c2-seg empty">No cardio yet</div>}
        </div>
        <div className="c2-quick">
          <span><b>{z2Min}m</b> zone-2/easy</span>
          <span>·</span>
          <span><b>{tempoMin}m</b> tempo/long</span>
          <span>·</span>
          <span><b>{intervals}</b> HIIT</span>
        </div>
      </div>

      {/* Week strip */}
      <div className="c2-week-h">Your week</div>
      <div className="c2-week">
        {cardioDays.map((d, i) => {
          const dayMin = d.items.reduce((s,id)=>s+(window.cardioFor(id)?.dur||0), 0);
          const dayMi = d.items.reduce((s,id)=>{ const c = window.cardioFor(id); return s + (c?.unit==='mi' ? c.dist : 0); }, 0);
          return (
            <div key={i} className="c2-day">
              <div className="c2-day-h">
                <div>
                  <div className="c2-day-n mono">{window.DAY_NAMES[i]}</div>
                  <div className="c2-day-meta">{dayMin>0 ? `${dayMin}m · ${Math.round(dayMi*10)/10}mi` : 'Rest'}</div>
                </div>
                <button className="add-mini-btn" style={{margin:0, width:'auto', padding:'10px 14px'}} onClick={()=>onOpenCardioSheet(i)}>+ Add</button>
              </div>
              {d.items.length > 0 && (
                <div className="c2-items">
                  {d.items.map((id, ii) => {
                    const c = window.cardioFor(id); if (!c) return null;
                    const t = window.CARDIO_TYPES[c.type];
                    return (
                      <div key={ii} className="c2-item" style={{ '--bp': t.color }}>
                        <div className="c2-i-body">
                          <div className="c2-i-n">{c.name}</div>
                          <div className="c2-i-m mono">{c.dur}m{c.dist>0?` · ${c.dist}${c.unit}`:''} · {t.label}</div>
                        </div>
                        <button className="c2-i-x" onClick={()=>removeItem(i, ii)} aria-label="Remove"><IconX/></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div style={{ height: 24 }}/>
    </div>
  );
}

// ============================================
// BODY V2 — 3D model with click-to-zoom; falls back to 2D anatomy SVG.
// Detail drawer shows status, target band, sport priority, exercises.
// ============================================

// Best matching split-type for a given exercise — used by the "Add to X" smart button.
function bestSplitTypeFor(ex, splitsByType) {
  if (!ex || !splitsByType) return null;
  const candidates = ({
    push:  ['push','upper','full','chest'],
    pull:  ['pull','upper','full','back'],
    legs:  ['legs','lower','full','quads','hams','glutes'],
    shoul: ['push','upper','shoulder'],
    core:  ['core','full'],
    cardio:[],
  })[ex.type] || [ex.type];
  for (const t of candidates) if (splitsByType[t] !== undefined) return t;
  return null;
}

function BodyTabV2({ days, onAddExercise, setTab, profile, splitsByType, setSplitsByType, setSplitsActiveType, showToast }) {
  const has3D = !!window.Anatomy3DCanvas;
  const [mode, setMode] = useState(has3D ? '3d' : '2d');
  const [view, setView] = useState('front'); // 2D only
  const [focus, setFocus] = useState(null);
  const [recently, setRecently] = useState(null);
  const [status3d, setStatus3d] = useState('loading');

  const sets = useMemo(
    () => window.computeCoverageV2 ? window.computeCoverageV2(days) : {},
    [days]
  );

  // Auto-fall-back to 2D if the 3D model fails to load.
  useEffect(() => {
    if (mode === '3d' && status3d === 'failed') setMode('2d');
  }, [status3d, mode]);

  const onRegion = (k) => {
    setRecently(k); setFocus(k);
    setTimeout(() => setRecently(null), 700);
  };
  const close = () => setFocus(null);

  const sportObj = profile && (window.SPORTS || []).find(s => s.id === profile.sport);
  const sportPriority = sportObj && sportObj.priority && sportObj.priority[focus];

  const focusedTarget = focus ? (window.TARGETS_V2 || {})[focus] : null;
  const focusedSets = focus ? (sets[focus] || 0) : 0;
  const focusedStatus = focus
    ? (window.statusFromCoverage ? window.statusFromCoverage(focusedSets, focusedTarget) : 'unknown')
    : null;

  // Top exercises that hit the focused muscle (granular).
  const focusedExs = useMemo(() => {
    if (!focus || !window.exercisesForMuscle) return [];
    return window.exercisesForMuscle(focus).slice(0, 8);
  }, [focus]);

  const addSmart = (exId) => {
    const ex = (window.EXERCISES || []).find(e => e.id === exId);
    if (!ex) return;
    const target = bestSplitTypeFor(ex, splitsByType || {});
    if (target && setSplitsByType) {
      setSplitsByType(prev => {
        const cur = [...((prev && prev[target]) || [])];
        if (cur.includes(exId)) return prev;
        cur.push(exId);
        return { ...(prev || {}), [target]: cur };
      });
      showToast && showToast(`Added to ${window.DAY_TYPES[target]?.label || target}`);
    } else if (onAddExercise) {
      onAddExercise(exId);
    }
  };

  const editFocusedSplit = () => {
    // Pick the first split-type already in use that one of the focused muscle's
    // top exercises maps to.
    for (const { ex } of focusedExs) {
      const t = bestSplitTypeFor(ex, splitsByType || {});
      if (t) {
        setSplitsActiveType && setSplitsActiveType(t);
        setTab && setTab('splits');
        close();
        return;
      }
    }
    setTab && setTab('splits');
    close();
  };

  // 12 most-relevant muscles for the coverage grid (granular keys).
  const COV_KEYS = ['chest','lats','traps','rear_delt','biceps','triceps','shoulder','abs','quads','hams','glutes','calves'];

  return (
    <div className="tab-pane body2">
      <div className="b2-toolbar">
        {has3D && (
          <div className="b2-segs">
            <button className={mode==='3d'?'on':''} onClick={()=>setMode('3d')}>3D</button>
            <button className={mode==='2d'?'on':''} onClick={()=>setMode('2d')}>2D</button>
          </div>
        )}
        {mode === '2d' && (
          <div className="b2-segs">
            <button className={view==='front'?'on':''} onClick={()=>setView('front')}>Front</button>
            <button className={view==='back'?'on':''} onClick={()=>setView('back')}>Back</button>
          </div>
        )}
        <div className="b2-hint mono">{mode === '3d' ? 'DRAG · TAP A MUSCLE' : 'TAP A MUSCLE'}</div>
      </div>

      <div className={`b2-stage ${mode === '3d' ? 'stage-3d' : ''}`}>
        {mode === '3d' && has3D ? (
          <window.Anatomy3DCanvas
            sets={sets}
            focused={focus}
            onSelect={onRegion}
            onStatus={setStatus3d}
          />
        ) : view === 'front' ? (
          <window.AnatomyFront sets={sets} recently={recently} onRegion={onRegion}/>
        ) : (
          <window.AnatomyBack sets={sets} recently={recently} onRegion={onRegion}/>
        )}
      </div>

      <div className="b2-cov">
        <div className="b2-cov-h">Weekly coverage</div>
        <div className="b2-cov-grid">
          {COV_KEYS.map(m => {
            const s = sets[m] || 0;
            const t = (window.TARGETS_V2 || {})[m];
            const st = window.statusFromCoverage ? window.statusFromCoverage(s, t) : 'unknown';
            return (
              <button key={m} className={`b2-cov-cell status-${st}`}
                style={{ '--bp': `var(--bp-${m === 'biceps' ? 'bis' : m === 'triceps' ? 'tris' : m === 'lats' || m === 'traps' || m === 'rear_delt' || m === 'lower_back' ? 'back' : m === 'abs' || m === 'obliques' ? 'core' : m})` }}
                onClick={() => setFocus(m)}>
                <div className="m">{(window.MUSCLE_LABELS_V2 || {})[m] || m}</div>
                <div className="s mono">{s} sets</div>
              </button>
            );
          })}
        </div>
      </div>

      {focus && (
        <div className="b2-drawer" onClick={close}>
          <div className={`b2-drawer-card status-${focusedStatus}`} onClick={e=>e.stopPropagation()}>
            <div className="b2-d-h">
              <div>
                <div className="b2-d-n">{(window.MUSCLE_LABELS_V2 || {})[focus] || focus}</div>
                <div className="b2-d-s mono">
                  {focusedSets} SETS · TARGET {focusedTarget?.min}–{focusedTarget?.max}
                </div>
              </div>
              <button className="b2-d-x" onClick={close} aria-label="Close"><IconX/></button>
            </div>

            <div className="b2-d-pills">
              <span className={`b2-status-pill status-${focusedStatus}`}>
                {focusedStatus === 'optimal' ? 'In target band' :
                 focusedStatus === 'under'   ? 'Under-worked' :
                 focusedStatus === 'over'    ? 'Over the band' :
                 focusedStatus === 'unworked'? 'Not hit yet' : 'Unknown'}
              </span>
              {sportPriority && sportPriority > 1 && (
                <span className="b2-priority-pill">Priority for {sportObj.label} ×{sportPriority.toFixed(1)}</span>
              )}
            </div>

            {focusedTarget && (
              <CoverageProgress sets={focusedSets} target={focusedTarget}/>
            )}

            <div className="b2-d-list-h">Top {focusedExs.length} exercises that hit this</div>
            <div className="b2-d-list">
              {focusedExs.length === 0 && (
                <div className="empty-pill" style={{textAlign:'center', padding:14}}>No matching exercises in the library.</div>
              )}
              {focusedExs.map(({ ex, weight }) => (
                <div key={ex.id} className="b2-d-row" style={{ '--bp': `var(--bp-${ex.body || ex.type})` }}>
                  <div className="b2-d-r-body">
                    <div className="b2-d-r-n">{ex.name}</div>
                    <div className="b2-d-r-m mono">
                      {ex.sets} · {ex.gear} · {window.DAY_TYPES[ex.body]?.label || ex.body}
                      {weight && weight > 0 && ` · hit ${Math.round(weight*100)}%`}
                    </div>
                  </div>
                  <button className="b2-d-r-add" onClick={()=>addSmart(ex.id)} aria-label={`Add ${ex.name}`}><IconPlus/></button>
                </div>
              ))}
            </div>

            <button className="b2-d-cta" onClick={editFocusedSplit}>
              Edit relevant split →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Visual progress bar showing where current sets fall in the [min, max] band.
function CoverageProgress({ sets, target }) {
  const min = target.min;
  const max = target.max;
  const ceiling = Math.max(max * 1.5, sets * 1.05, max + 4);
  const minPct = (min / ceiling) * 100;
  const maxPct = (max / ceiling) * 100;
  const setsPct = Math.min(100, (sets / ceiling) * 100);
  const barFill = sets >= min && sets <= max ? '#4ED9C0' : sets > max ? '#FF8A5B' : '#6E6EFF';
  return (
    <div className="b2-cov-progress">
      <div className="b2-cp-bar">
        <div className="b2-cp-band" style={{ left: `${minPct}%`, width: `${Math.max(0, maxPct - minPct)}%` }}/>
        <div className="b2-cp-fill" style={{ width: `${setsPct}%`, background: barFill }}/>
        <div className="b2-cp-marker" style={{ left: `calc(${setsPct}% - 7px)`, background: barFill }}/>
      </div>
      <div className="b2-cp-labels mono">
        <span>0</span>
        <span style={{ marginLeft: `${minPct - 3}%` }}>{min}</span>
        <span style={{ marginLeft: `${maxPct - minPct - 6}%` }}>{max}</span>
      </div>
    </div>
  );
}

Object.assign(window, {
  ScheduleTab, DashboardPage, ProfileV2, CardioPageV2, BodyTabV2, makeDayForType,
  SplitsTab, SplitExSheet, PresetsSheet,
  GeneralTab, DayPickerSheet, SportSheet,
});
