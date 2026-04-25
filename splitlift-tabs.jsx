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
// SCHEDULE TAB — only the week. Drag splits + cardios onto days.
// Templates / quick-actions live behind the "Presets" sheet.
// ================================================================
function ScheduleTab({ days, setDays, cardioDays, setCardioDays, locked, setLocked, profile, showToast, onJumpToSplits, splitsByType, setSplitsByType }) {
  const dayTypes = days.map(d => d.type || (d.rest ? 'rest' : 'custom'));
  const splitChips = ['push','pull','legs','upper','lower','full','rest'];
  const cardioChips = (window.CARDIO_LIBRARY || []);

  const [presetsOpen, setPresetsOpen] = useState(false);
  const [pickFor, setPickFor] = useState(null);

  // Drag — single handler for both split and cardio chips.
  // payload: { kind: 'split'|'cardio', id }
  const [drag, setDrag] = useState(null);
  const [hoverIdx, setHoverIdx] = useState(null);

  const startDrag = (e, payload) => {
    const isTouch = e.touches !== undefined;
    const px = isTouch ? e.touches[0].clientX : e.clientX;
    const py = isTouch ? e.touches[0].clientY : e.clientY;
    if (!isTouch) e.preventDefault();
    setDrag({ ...payload, x: px, y: py });
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
        if (locked[hoverIdx]) {
          showToast('Locked — unlock first');
        } else if (drag.kind === 'split') {
          setDays(prev => prev.map((d, i) => i === hoverIdx ? makeDayForType(drag.id, profile, splitsByType) : d));
          showToast(`${window.DAY_NAMES[hoverIdx]}: ${window.DAY_TYPES[drag.id]?.label}`);
        } else if (drag.kind === 'cardio') {
          setCardioDays(prev => {
            const next = prev.map(d => ({ items: [...d.items] }));
            next[hoverIdx].items.push(drag.id);
            return next;
          });
          const c = window.cardioFor(drag.id);
          showToast(`${window.DAY_NAMES[hoverIdx]}: + ${c?.name || 'cardio'}`);
        }
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
  }, [drag, hoverIdx, locked, profile, setDays, setCardioDays, showToast]);

  const toggleLockAt = (idx) => {
    setLocked(prev => prev.map((v,j) => j===idx ? !v : v));
    showToast(locked[idx] ? `${window.DAY_NAMES[idx]} unlocked` : `${window.DAY_NAMES[idx]} locked`);
  };

  const clearDay = (idx) => {
    if (locked[idx]) { showToast('Locked — unlock first'); return; }
    setDays(prev => prev.map((d,i)=> i===idx ? makeDayForType('rest', profile, splitsByType) : d));
    setCardioDays(prev => prev.map((d,i)=> i===idx ? { items: [] } : d));
    setPickFor(null);
    showToast(`${window.DAY_NAMES[idx]} cleared`);
  };

  const removeCardio = (dayIdx, itemIdx) => {
    if (locked[dayIdx]) { showToast('Locked — unlock first'); return; }
    setCardioDays(prev => {
      const next = prev.map(d => ({ items: [...d.items] }));
      next[dayIdx].items.splice(itemIdx, 1);
      return next;
    });
  };

  const todayIdx = (() => { const j = new Date().getDay(); return j === 0 ? 6 : j - 1; })();

  return (
    <div className="tab-pane sched-page">
      {/* Tiny header — title left, Presets right */}
      <div className="sched-bar">
        <div className="sched-h1">Your week</div>
        <button className="presets-btn" onClick={()=>setPresetsOpen(true)}>Presets</button>
      </div>

      {/* The week */}
      <div className="sched-week">
        {window.DAY_NAMES.map((dn, i) => {
          const t = dayTypes[i];
          const dt = window.DAY_TYPES[t] || window.DAY_TYPES.custom;
          const cItems = (cardioDays && cardioDays[i] && cardioDays[i].items) || [];
          return (
            <div key={i} data-sched-day={i}
              className={`sched-cell ${hoverIdx===i?'hover':''} ${locked[i]?'locked':''} ${todayIdx===i?'is-today':''}`}
              style={{ '--bp': `var(--bp-${t})` }}
              onClick={()=>setPickFor(i)}>
              <div className="dn mono">{dn}</div>
              <div className="dt">{dt.label}</div>
              {cItems.length > 0 && (
                <div className="cd-dots">
                  {cItems.slice(0, 4).map((cid, k) => {
                    const c = window.cardioFor(cid);
                    const col = c && window.CARDIO_TYPES[c.type]?.color;
                    return <span key={k} className="cd-dot" style={{ background: col || 'var(--ink-3)' }}/>;
                  })}
                  {cItems.length > 4 && <span className="cd-dot more mono">+{cItems.length - 4}</span>}
                </div>
              )}
              {locked[i] && <span className="lock-mark"><IconLock/></span>}
            </div>
          );
        })}
      </div>

      {/* Drag palette: splits, then cardios */}
      <div className="pal-h mono">SPLITS · drag onto a day</div>
      <div className="pal-row">
        {splitChips.map(p => {
          const dt = window.DAY_TYPES[p];
          if (!dt) return null;
          return (
            <button key={p} className="pal-pill split"
              style={{ '--bp': `var(--bp-${p})` }}
              onMouseDown={(e)=>startDrag(e, { kind:'split', id:p })}
              onTouchStart={(e)=>startDrag(e, { kind:'split', id:p })}
              onClick={()=>onJumpToSplits && onJumpToSplits(p)}>
              {dt.label}
            </button>
          );
        })}
      </div>

      <div className="pal-h mono">CARDIO · drag onto a day</div>
      <div className="pal-row">
        {cardioChips.map(c => {
          const t = window.CARDIO_TYPES[c.type];
          return (
            <button key={c.id} className="pal-pill cardio"
              style={{ '--bp': t?.color || 'var(--ink-3)' }}
              onMouseDown={(e)=>startDrag(e, { kind:'cardio', id:c.id })}
              onTouchStart={(e)=>startDrag(e, { kind:'cardio', id:c.id })}>
              <span className="cp-name">{c.name}</span>
              <span className="cp-meta mono">{c.dur}m</span>
            </button>
          );
        })}
      </div>

      {/* Tap-day inline action sheet — Lock / Clear / current cardios */}
      {pickFor !== null && (
        <div className="day-actions">
          <div className="da-head">
            <div><b>{window.DAY_NAMES[pickFor]}</b> · {window.DAY_TYPES[dayTypes[pickFor]]?.label}</div>
            <button className="ip-x" onClick={()=>setPickFor(null)} aria-label="Close"><IconX/></button>
          </div>
          <div className="da-actions">
            <button className={`ip-action ${locked[pickFor]?'locked':''}`} onClick={()=>toggleLockAt(pickFor)}>
              <IconLock open={locked[pickFor]}/>
              {locked[pickFor] ? 'Unlock' : 'Lock'}
            </button>
            <button className="ip-action danger" onClick={()=>clearDay(pickFor)} disabled={locked[pickFor]}
                    style={locked[pickFor] ? { opacity: 0.4, cursor: 'not-allowed' } : null}>
              <IconTrash/>
              Clear day
            </button>
          </div>
          {(cardioDays[pickFor]?.items.length || 0) > 0 && (
            <div className="da-cardios">
              <div className="ip-divider">Cardio on this day</div>
              {cardioDays[pickFor].items.map((cid, ii) => {
                const c = window.cardioFor(cid); if (!c) return null;
                const t = window.CARDIO_TYPES[c.type];
                return (
                  <div key={ii} className="da-cardio-row" style={{ '--bp': t?.color }}>
                    <div className="dac-body">
                      <div className="dac-n">{c.name}</div>
                      <div className="dac-m mono">{c.dur}m{c.dist>0?` · ${c.dist}${c.unit}`:''}</div>
                    </div>
                    <button className="dac-x" onClick={()=>removeCardio(pickFor, ii)} aria-label="Remove"><IconX/></button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Presets sheet — opens on demand only */}
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

      {/* Floating drag ghost */}
      {drag && (
        <div className="drag-ghost" style={{ left: drag.x - 60, top: drag.y - 22,
              '--bp': drag.kind === 'split'
                ? `var(--bp-${drag.id})`
                : (window.CARDIO_TYPES[window.cardioFor(drag.id)?.type]?.color || 'var(--ink-3)') }}>
          {drag.kind === 'split'
            ? window.DAY_TYPES[drag.id]?.label
            : window.cardioFor(drag.id)?.name}
        </div>
      )}

      <div style={{ height: 28 }}/>
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

// ================================================================
// DASHBOARD TAB — fully redesigned
// ================================================================
function DashboardPage({ days, cardioDays, profile, setTab }) {
  const lift = useMemo(() => window.liftingScore(days, profile), [days, profile]);
  const cardio = useMemo(() => window.cardioScoreFor(cardioDays), [cardioDays]);
  const under = useMemo(() => window.underworkedMuscles(days), [days]);
  const sp = window.SPORTS.find(s => s.id === profile.sport) || window.SPORTS[0];
  const cov = useMemo(() => window.computeCoverage(days), [days]);

  const liftMin = window.totalLiftMinutes(days);
  const cardioMin = window.totalCardioMinutes(cardioDays);
  const totalMin = liftMin + cardioMin;
  const trainingKcal = window.totalLiftKcal(days) + window.totalCardioKcal(cardioDays);

  // ---- Moveable widgets: a simple drag-reorder list of widget IDs ----
  const allWidgets = ['lift','cardio','sport','underworked','figure','time','streak'];
  const [order, setOrder] = useState(allWidgets);
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

  // figure: heatmap of muscles
  const FigureWidget = () => (
    <BodyHeatmap cov={cov} sport={sp}/>
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
          <div className="empty-pill">All muscle groups in target band ✓</div>
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
// PROFILE V2 — privacy / units / account, no pulse
// ============================================
function ProfileV2({ profile, setProfile, theme, setTheme, onLogout }) {
  const [units, setUnits] = useState(profile.hUnit === 'cm' ? 'metric' : 'imperial');
  const [notif, setNotif] = useState(true);
  const [share, setShare] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [coachTone, setCoachTone] = useState('balanced');

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

  return (
    <div className="tab-pane prof2">
      <div className="prof2-hero">
        <div className="avatar-xl">A</div>
        <div className="prof2-name">Alex Chen</div>
        <div className="prof2-handle">@alex · {window.SPORTS.find(s=>s.id===profile.sport)?.label || ''}</div>
        <div className="prof2-stats">
          <div><span className="v">{profile.height}</span><span className="u">{profile.hUnit}</span><div className="k mono">HEIGHT</div></div>
          <div><span className="v">{profile.weight}</span><span className="u">{profile.wUnit}</span><div className="k mono">WEIGHT</div></div>
          <div><span className="v">{profile.days}</span><span className="u">/wk</span><div className="k mono">TRAINING</div></div>
        </div>
      </div>

      <Section title="Body & training">
        <Row icon="📏" label="Height" right={
          <NumStepper value={profile.height} unit={profile.hUnit}
            onChange={v=>setProfile(p=>({...p, height: v}))}/>
        }/>
        <Row icon="⚖️" label="Weight" right={
          <NumStepper value={profile.weight} unit={profile.wUnit}
            onChange={v=>setProfile(p=>({...p, weight: v}))}/>
        }/>
        <Row icon="📅" label="Training days / wk" right={
          <NumStepper value={profile.days} unit="" min={1} max={7}
            onChange={v=>setProfile(p=>({...p, days: v}))}/>
        }/>
        <Row icon="🏃" label="Sport" right={
          <select className="select" value={profile.sport} onChange={e=>setProfile(p=>({...p, sport: e.target.value}))}>
            {window.SPORTS.map(s=>(<option key={s.id} value={s.id}>{s.label}</option>))}
          </select>
        }/>
      </Section>

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
        <Row icon="✉️" label="Email" right={<span className="prof-val">alex@splitlift.app</span>}/>
        <Row icon="🔑" label="Password" right={<button className="link-btn">Change</button>}/>
        <Row icon="📤" label="Export data" right={<button className="link-btn">Download</button>}/>
        <Row icon="🚪" label="" right={<button className="danger-btn" onClick={onLogout}>Log out</button>}/>
      </Section>

      <div className="prof2-foot mono">SplitLift · v0.4.0</div>
      <div style={{height: 24}}/>
    </div>
  );
}
function Section({ title, children }) {
  return <div className="prof2-sec"><div className="ps-t">{title}</div><div className="ps-card">{children}</div></div>;
}
function Row({ icon, label, right }) {
  return <div className="prof2-row">{icon && <span className="prow-i">{icon}</span>}<span className="prow-l">{label}</span><span className="prow-r">{right}</span></div>;
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
                        <button className="c2-i-x" onClick={()=>removeItem(i, ii)}>✕</button>
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
// BODY V2 — bigger figure, region zoom, exercises list
// ============================================
function BodyTabV2({ days, onAddExercise, setTab }) {
  const [view, setView] = useState('front');
  const [focus, setFocus] = useState(null);
  const [recently, setRecently] = useState(null);
  const sets = useMemo(() => window.computeCoverageV2 ? window.computeCoverageV2(days) : window.computeCoverage(days), [days]);

  const onRegion = (k) => {
    setRecently(k); setFocus(k);
    setTimeout(()=>setRecently(null), 700);
  };
  const close = () => setFocus(null);

  const focusedExs = focus ? (window.exercisesForMuscle ? window.exercisesForMuscle(focus) : window.EXERCISES.filter(e=>e.hits[focus])).slice(0, 8) : [];

  return (
    <div className="tab-pane body2">
      <div className="b2-toolbar">
        <div className="b2-segs">
          <button className={view==='front'?'on':''} onClick={()=>setView('front')}>Front</button>
          <button className={view==='back'?'on':''} onClick={()=>setView('back')}>Back</button>
        </div>
        <div className="b2-hint mono">TAP A MUSCLE</div>
      </div>

      <div className="b2-stage">
        {view === 'front'
          ? <window.AnatomyFront sets={sets} recently={recently} onRegion={onRegion}/>
          : <window.AnatomyBack sets={sets} recently={recently} onRegion={onRegion}/>}
      </div>

      {/* Coverage list (always visible) */}
      <div className="b2-cov">
        <div className="b2-cov-h">Weekly coverage</div>
        <div className="b2-cov-grid">
          {['chest','back','shoulder','bis','tris','quads','hams','glutes','core','calves'].map(m => {
            const s = sets[m] || 0;
            const t = window.TARGETS[m];
            const st = window.statusFor(s, t || {min:0,max:0});
            return (
              <button key={m} className={`b2-cov-cell status-${st}`} style={{ '--bp': `var(--bp-${m})` }} onClick={()=>setFocus(m)}>
                <div className="m">{window.MUSCLE_LABELS[m] || m}</div>
                <div className="s mono">{s} sets</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Focused muscle drawer */}
      {focus && (
        <div className="b2-drawer" onClick={close}>
          <div className="b2-drawer-card" style={{ '--bp': `var(--bp-${focus})` }} onClick={e=>e.stopPropagation()}>
            <div className="b2-d-h">
              <div>
                <div className="b2-d-n">{window.MUSCLE_LABELS[focus] || focus}</div>
                <div className="b2-d-s mono">{sets[focus]||0} sets · target {window.TARGETS[focus]?.min}–{window.TARGETS[focus]?.max}</div>
              </div>
              <button className="b2-d-x" onClick={close}>✕</button>
            </div>
            <div className="b2-d-list-h">Best exercises for this</div>
            <div className="b2-d-list">
              {focusedExs.map(({ex} = {ex: undefined}, i) => {
                const e = ex || focusedExs[i];
                return (
                  <div key={e.id} className="b2-d-row" style={{ '--bp': `var(--bp-${e.body})` }}>
                    <div className="b2-d-r-body">
                      <div className="b2-d-r-n">{e.name}</div>
                      <div className="b2-d-r-m mono">{e.sets} · {e.gear} · {window.DAY_TYPES[e.body]?.label || e.body}</div>
                    </div>
                    <button className="b2-d-r-add" onClick={()=>{onAddExercise(e.id); close();}}>＋</button>
                  </div>
                );
              })}
            </div>
            <button className="b2-d-cta" onClick={()=>{ setTab('splits'); close(); }}>Edit splits →</button>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, {
  ScheduleTab, DashboardPage, ProfileV2, CardioPageV2, BodyTabV2, makeDayForType,
  SplitsTab, SplitExSheet, PresetsSheet,
});
