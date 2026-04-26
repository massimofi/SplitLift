// Schedule tab — left palette of split + cardio chips, big day boxes.
// Drag a chip onto a day, or tap a day to open the picker sheet.

import React, { useState, useEffect, useMemo } from 'react';
import {
  DAY_NAMES, DAY_TYPES, CARDIO_LIBRARY, CARDIO_TYPES, SPORTS, EXERCISES,
  cardioFor, cardioHRZone,
} from '../data/exercises.js';
import { Sparkles } from 'lucide-react';
import { SPLIT_TEMPLATES, planForSport, rankTemplatesForSport } from '../data/templates.js';
import { makeDayForType, splitsByTypeFromDays } from '../lib/splits.js';
import { IconLock, IconX, IconTrash, IconPlus } from '../components/Icons.jsx';
import { Card } from '../components/Card.jsx';
import { Subheader } from '../components/Subheader.jsx';
import { Chip } from '../components/Chip.jsx';

// Map any day-type id to one of the Card gradient names defined in tokens.css.
// All exotic per-muscle types fold back into the closest broad category.
function gradForDayType(t) {
  switch (t) {
    case 'push': case 'chest':                                 return 'push';
    case 'pull': case 'back':                                  return 'pull';
    case 'legs': case 'quads': case 'hams': case 'glutes': case 'calves': return 'legs';
    case 'shoul': case 'shoulder':                             return 'shoul';
    case 'arms': case 'bis': case 'tris':                      return 'personal';
    case 'core':                                               return 'success';
    case 'cardio':                                             return 'cardio-day';
    case 'sport':                                              return 'sport';
    case 'upper':                                              return 'upper';
    case 'lower':                                              return 'lower';
    case 'full':                                               return 'full';
    case 'rest':                                               return 'rest';
    default:                                                   return 'custom';
  }
}

export function ScheduleTab({ days, setDays, cardioDays, setCardioDays, locked, setLocked, profile, setProfile, showToast, onJumpToSplits, splitsByType, setSplitsByType }) {
  const [presetsOpen, setPresetsOpen] = useState(false);
  const [pickFor, setPickFor] = useState(null);
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
    showToast(`${DAY_NAMES[idx]}: ${DAY_TYPES[typeId]?.label}`);
  };

  const addCardioToDay = (idx, cid) => {
    if (locked[idx]) { showToast('Locked — unlock first'); return; }
    setCardioDays(prev => {
      const next = prev.map(d => ({ items: [...d.items] }));
      next[idx].items.push(cid);
      return next;
    });
    const c = cardioFor(cid);
    showToast(`${DAY_NAMES[idx]}: + ${c?.name || 'cardio'}`);
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
    showToast(locked[idx] ? `${DAY_NAMES[idx]} unlocked` : `${DAY_NAMES[idx]} locked`);
  };

  const clearDay = (idx) => {
    if (locked[idx]) { showToast('Locked — unlock first'); return; }
    setDays(prev => prev.map((d, i) => i === idx ? makeDayForType('rest', profile, splitsByType) : d));
    setCardioDays(prev => prev.map((d, i) => i === idx ? { items: [] } : d));
    setPickFor(null);
    showToast(`${DAY_NAMES[idx]} cleared`);
  };

  const todayIdx = (() => { const j = new Date().getDay(); return j === 0 ? 6 : j - 1; })();

  // v9 Issue 8: palette shows ONLY the user's actual splits + the sport's
  // recommended cardio. Rest is always included (needed to clear days).
  const userSplitTypes = useMemo(() => {
    // Pull from splitsByType keys; also include any types currently on the
    // schedule (in case someone set a day-type via picker without first
    // editing splitsByType for it). Rest is always last.
    const fromSplits = Object.keys(splitsByType || {}).filter(k => splitsByType[k] && splitsByType[k].length > 0);
    const fromDays = (days || []).map(d => d?.type).filter(t => t && t !== 'rest' && t !== 'sport' && t !== 'cardio');
    const merged = [...new Set([...fromSplits, ...fromDays])];
    return [...merged, 'rest'];
  }, [splitsByType, days]);

  const sport = SPORTS.find(s => s.id === profile?.sport);
  const cardioProfile = sport?.cardioProfile;
  const cardioChips = useMemo(() => {
    if (cardioProfile) {
      const recIds = [...(cardioProfile.primary || []), ...(cardioProfile.secondary || [])];
      const list = recIds.map(id => CARDIO_LIBRARY.find(c => c.id === id)).filter(Boolean);
      // Pad with a couple of generic cardios if sport list is short
      if (list.length < 4) {
        for (const c of CARDIO_LIBRARY) {
          if (list.length >= 5) break;
          if (!list.find(x => x.id === c.id)) list.push(c);
        }
      }
      return list.slice(0, 6);
    }
    return CARDIO_LIBRARY.slice(0, 6);
  }, [cardioProfile]);

  return (
    <div className="tab-pane sched-page">
      <div className="sched-bar">
        <Subheader subtitle="Drag a split or cardio onto a day. Tap a day to edit it in detail.">Your week</Subheader>
        <button className="presets-btn" onClick={()=>setPresetsOpen(true)}>Presets</button>
      </div>

      <div className="sched-layout">
        <div className="sched-palette">
          <div className="sched-palette-head">SPLIT</div>
          {userSplitTypes.map(p => {
            const dt = DAY_TYPES[p];
            if (!dt) return null;
            return (
              <Chip
                key={p}
                gradient={gradForDayType(p)}
                size="md"
                role="button"
                tabIndex={0}
                onMouseDown={(e)=>startDrag(e, { kind:'split', id:p })}
                onTouchStart={(e)=>startDrag(e, { kind:'split', id:p })}
                onClick={()=>onJumpToSplits && onJumpToSplits(p)}
                style={{ cursor: 'grab', justifyContent: 'center' }}
              >
                {dt.label}
              </Chip>
            );
          })}
          <div className="sched-palette-head">CARDIO</div>
          {cardioChips.map(c => (
            <Chip
              key={c.id}
              gradient="cardio-day"
              size="md"
              role="button"
              tabIndex={0}
              onMouseDown={(e)=>startDrag(e, { kind:'cardio', id:c.id })}
              onTouchStart={(e)=>startDrag(e, { kind:'cardio', id:c.id })}
              style={{ cursor: 'grab', justifyContent: 'space-between', width: '100%' }}
            >
              <span>{CARDIO_TYPES[c.type]?.label || c.name}</span>
              <span className="mono" style={{ opacity: 0.85, fontSize: '0.85em' }}>{c.dur}m</span>
            </Chip>
          ))}
        </div>

        <div className="sched-rows">
          {DAY_NAMES.map((dn, i) => {
            const day = days[i] || { type: 'rest', rest: true };
            const t = day.type || 'rest';
            const dt = DAY_TYPES[t] || DAY_TYPES.custom;
            const cItems = (cardioDays && cardioDays[i] && cardioDays[i].items) || [];
            const isToday = todayIdx === i;
            const isLocked = locked[i];
            const isRest = t === 'rest';
            const isHover = hoverIdx === i;

            // Exercise preview — first 4 names, e.g. "Bench · DB Press · OHP · Tris"
            const exIds = (day.exIds && day.exIds.length) ? day.exIds : ((splitsByType && splitsByType[t]) || []);
            const exNames = exIds
              .slice(0, 4)
              .map(id => EXERCISES.find(e => e.id === id)?.name)
              .filter(Boolean);
            const exTrail = exIds.length > 4 ? ` +${exIds.length - 4}` : '';

            return (
              <Card
                key={i}
                variant="gradient"
                gradient={isRest ? 'muted' : gradForDayType(t)}
                size={isRest ? 'row' : 'md'}
                interactive
                glow={isToday}
                onClick={() => setPickFor(i)}
                className={`sched-day-card ${isHover ? 'is-drop-hover' : ''} ${isLocked ? 'is-locked' : ''}`}
                data-sched-day={i}
              >
                <div className="sched-day-head">
                  <div className="sched-day-l">
                    <div className="sched-day-name mono">{dn.toUpperCase()}</div>
                    {isToday && <span className="sched-today-tag mono">TODAY</span>}
                  </div>
                  <div className="sched-day-r">
                    {isLocked && <span className="sched-day-lock"><IconLock/></span>}
                    <span className="sched-day-type-pill">{dt.label}</span>
                  </div>
                </div>
                {!isRest ? (
                  <>
                    {exNames.length > 0 ? (
                      <div className="sched-day-preview">
                        {exNames.join(' · ')}{exTrail}
                      </div>
                    ) : (
                      <div className="sched-day-preview is-empty">+ Drag a split here</div>
                    )}
                    {cItems.length > 0 && (
                      <div className="sched-day-cardios">
                        {cItems.slice(0, 4).map((cid, k) => {
                          const c = cardioFor(cid);
                          if (!c) return null;
                          return (
                            <span key={k} className="sched-day-cardio-pill">
                              {CARDIO_TYPES[c.type]?.label || c.name} · {c.dur}m
                            </span>
                          );
                        })}
                        {cItems.length > 4 && <span className="sched-day-cardio-pill">+{cItems.length - 4}</span>}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="sched-day-rest-line">+ Drop a split or cardio</div>
                )}
              </Card>
            );
          })}
        </div>
      </div>

      {drag && (
        <div className="drag-ghost" style={{ left: drag.x - 50, top: drag.y - 22,
              '--bp': drag.kind === 'split'
                ? `var(--bp-${drag.id})`
                : (CARDIO_TYPES[cardioFor(drag.id)?.type]?.color || 'var(--ink-3)') }}>
          {drag.kind === 'split'
            ? DAY_TYPES[drag.id]?.label
            : cardioFor(drag.id)?.name}
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
          setProfile={setProfile}
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

function DayPickerSheet({ dayIdx, dayType, cardios, isLocked, profile, onClose, onSetType, onAddCardio, onRemoveCardio, onClear, onToggleLock, onEditExercises }) {
  const [whyOpen, setWhyOpen] = useState(false);
  const [rationaleOpen, setRationaleOpen] = useState(false);
  const splitTypes = ['push','pull','legs','upper','lower','full','rest'];
  const dt = DAY_TYPES[dayType] || DAY_TYPES.custom;
  const canEditExercises = dayType && dayType !== 'rest' && dayType !== 'sport' && dayType !== 'cardio';
  const targetMin = profile?.cardioMin || 90;
  const perDay = Math.round(targetMin / 7);

  // Sport-specific cardio recommendations
  const sport = SPORTS.find(s => s.id === profile?.sport);
  const cardioProfile = sport?.cardioProfile;
  const primaryIds   = new Set(cardioProfile?.primary   || []);
  const secondaryIds = new Set(cardioProfile?.secondary || []);
  const recIds = [...primaryIds, ...secondaryIds];
  const recCardios = recIds.map(id => CARDIO_LIBRARY.find(c => c.id === id)).filter(Boolean);
  const otherCardios = CARDIO_LIBRARY.filter(c => !primaryIds.has(c.id) && !secondaryIds.has(c.id));
  const matchPill = (id) => primaryIds.has(id) ? 'primary' : (secondaryIds.has(id) ? 'secondary' : null);

  // Render a cardio chip button (used in both recommended + other lists)
  const renderCardio = (c) => {
    const tcol = CARDIO_TYPES[c.type]?.color;
    const hr = cardioHRZone(c, profile);
    const match = matchPill(c.id);
    return (
      <button key={c.id} className="dp-cardio"
        style={{ '--bp': tcol || 'var(--ink-3)' }}
        onClick={() => onAddCardio(c.id)}
        disabled={isLocked}>
        <div className="dp-c-body">
          <div className="dp-c-name-row">
            <span className="dp-c-name">{c.name}</span>
            {match && <span className={`dp-c-match ${match}`}>{match === 'primary' ? 'PRIMARY' : 'SECONDARY'}</span>}
          </div>
          <div className="dp-c-meta mono">
            {c.dur}m{c.dist > 0 ? ` · ${c.dist}${c.unit}` : ''}
            {hr && <span className="dp-c-hr"> · {hr[0]}–{hr[1]}bpm</span>}
          </div>
        </div>
        <span className="dp-c-add"><IconPlus/></span>
      </button>
    );
  };

  return (
    <div className="ps-overlay" onClick={onClose}>
      <div className="ps-sheet" onClick={e=>e.stopPropagation()}>
        <div className="ps-head">
          <div>
            <div className="ps-t">{DAY_NAMES[dayIdx]}</div>
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
            const dt2 = DAY_TYPES[t] || DAY_TYPES.custom;
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
        {cardioProfile && recCardios.length > 0 && (
          <>
            <div className="ps-section-row">
              <div className="ps-section">
                <Sparkles size={12} style={{ verticalAlign: 'middle', marginRight: 4, color: 'var(--accent)' }}/>
                Recommended for {sport.label}
              </div>
              <button className="ps-why" onClick={()=>setRationaleOpen(o => !o)}>
                {rationaleOpen ? 'Hide why' : 'Why?'}
              </button>
            </div>
            {rationaleOpen && (
              <div className="ps-why-body">{cardioProfile.rationale}</div>
            )}
            <div className="dp-cardio-list">
              {recCardios.map(renderCardio)}
            </div>
            <div className="ps-section">All cardio</div>
          </>
        )}
        <div className="dp-cardio-list">
          {(cardioProfile ? otherCardios : CARDIO_LIBRARY).map(renderCardio)}
        </div>

        {cardios.length > 0 && (
          <>
            <div className="ps-section">Currently scheduled</div>
            <div className="da-cardios">
              {cardios.map((cid, ii) => {
                const c = cardioFor(cid); if (!c) return null;
                const tcol = CARDIO_TYPES[c.type]?.color;
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

function PresetsSheet({ profile, setProfile, locked, days, setDays, splitsByType, setSplitsByType, showToast, onClose }) {
  const ranked = useMemo(
    () => rankTemplatesForSport({ sport: profile.sport, days: profile.days, limit: 3 }),
    [profile.sport, profile.days]
  );
  const sportLabel = SPORTS.find(s => s.id === profile.sport)?.label || 'your sport';
  const customPresets = profile.customPresets || [];

  // Build a unified list: built-ins + user customs (customs surface first
  // so they're visible).
  const allTemplates = useMemo(() => {
    const customs = customPresets.map(c => ({
      id: c.id,
      name: c.name,
      sub: c.sub || 'Your custom preset',
      days: c.days,
      isCustom: true,
      sourcePresetId: c.sourcePresetId,
    }));
    const builtins = SPLIT_TEMPLATES.map(t => ({ ...t, isCustom: false }));
    return [...customs, ...builtins];
  }, [customPresets]);

  const syncSplits = (newDays) => {
    if (!setSplitsByType) return;
    const fresh = splitsByTypeFromDays(newDays);
    setSplitsByType(prev => ({ ...(prev || {}), ...fresh }));
  };

  const applyTemplate = (id) => {
    const tpl = allTemplates.find(t => t.id === id);
    if (!tpl) return;
    const newDays = days.map((d, i) => locked[i] ? d : makeDayForType(tpl.days[i], profile, splitsByType));
    setDays(newDays);
    syncSplits(newDays);
    showToast(`Applied: ${tpl.name}`);
    onClose();
  };

  const autoBuild = () => {
    const plan = planForSport({ ...profile });
    const newDays = plan.map((p, i) => locked[i] ? days[i] : p);
    setDays(newDays);
    syncSplits(newDays);
    showToast('Auto-built for your sport');
    onClose();
  };

  // v10 Issue 6: simpler — tap a card → detail view → Use / Duplicate /
  // Delete. No "..." menu cluttering the list.
  const [detail, setDetail] = useState(null);  // template object being viewed
  const [dupOpen, setDupOpen] = useState(null);
  const [dupName, setDupName] = useState('');

  // Day-count helper for the new compact sport tag.
  const liftCountFor = (tpl) => tpl.days.filter(d => d && d !== 'rest').length;

  // Built-ins shown separately from user customs — see render below.
  const builtIns = SPLIT_TEMPLATES.map(t => ({ ...t, isCustom: false }));
  const customs = customPresets.map(c => ({
    id: c.id,
    name: c.name,
    sub: c.sub || 'Your custom preset',
    days: c.days,
    isCustom: true,
    sourcePresetId: c.sourcePresetId,
  }));

  const openDuplicate = (tpl) => {
    setDupName(`${tpl.name} (copy)`);
    setDupOpen(tpl);
  };
  const saveCustom = () => {
    if (!dupOpen) return;
    const id = `custom_${Math.random().toString(36).slice(2, 9)}`;
    const newPreset = {
      id,
      name: dupName.trim() || 'Custom preset',
      sub: 'Your custom preset',
      sourcePresetId: dupOpen.id,
      createdAt: Date.now(),
      days: [...dupOpen.days],
      splitsByType: { ...(splitsByType || {}) },
    };
    setProfile && setProfile(p => ({
      ...p,
      customPresets: [...(p.customPresets || []), newPreset],
    }));
    showToast(`Saved: ${newPreset.name}`);
    setDupOpen(null);
    setDetail(null);
  };
  const deleteCustom = (id) => {
    setProfile && setProfile(p => ({
      ...p,
      customPresets: (p.customPresets || []).filter(c => c.id !== id),
    }));
    setDetail(null);
    showToast('Deleted');
  };

  // Compact card subcomponent — bigger fonts, fewer fields.
  const PresetCard = ({ tpl }) => {
    const lifts = liftCountFor(tpl);
    return (
      <button className="ps-card" onClick={() => setDetail(tpl)}>
        <div className="ps-card-head">
          <div className="ps-card-tag mono">{lifts}-DAY</div>
          <div className="tpl-mini">
            {tpl.days.map((d, i) => (
              <span key={i} className="tpl-cell" style={{ background:`var(--bp-${d})` }}/>
            ))}
          </div>
        </div>
        <div className="ps-card-name">{tpl.name}</div>
        <div className="ps-card-sub">{tpl.sub}</div>
      </button>
    );
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
                <button key={tpl.id} className={`tpl-rec ${i===0?'top':''}`} onClick={()=>setDetail(tpl)}>
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

        {customs.length > 0 && (
          <>
            <div className="ps-section">Your custom presets</div>
            <div className="ps-card-list">
              {customs.map(t => <PresetCard key={t.id} tpl={t}/>)}
            </div>
          </>
        )}

        <div className="ps-section">All templates</div>
        <div className="ps-card-list">
          {builtIns.map(t => <PresetCard key={t.id} tpl={t}/>)}
        </div>
      </div>

      {/* Detail view — opened by tapping any preset card. Use / Duplicate /
          Delete (delete only for customs). */}
      {detail && (
        <div
          className="ps-overlay"
          style={{ zIndex: 250, position: 'fixed', inset: 0 }}
          onClick={() => setDetail(null)}
        >
          <div className="ps-sheet ps-sheet-narrow" onClick={e => e.stopPropagation()}>
            <div className="ps-head">
              <div>
                <div className="ps-t">{detail.name}</div>
                <div className="ps-s mono">
                  {liftCountFor(detail)} LIFT · {7 - liftCountFor(detail)} OFF
                  {detail.isCustom ? ' · CUSTOM' : ''}
                </div>
              </div>
              <button className="ip-x" onClick={() => setDetail(null)} aria-label="Close"><IconX/></button>
            </div>
            <p className="ps-detail-sub">{detail.sub}</p>
            <div className="ps-detail-grid">
              {detail.days.map((d, i) => (
                <div key={i} className="ps-detail-day">
                  <div className="ps-detail-dn mono">{['MON','TUE','WED','THU','FRI','SAT','SUN'][i]}</div>
                  <div className="ps-detail-pill" style={{ background:`var(--bp-${d})` }}>
                    {(DAY_TYPES[d]?.label || d).toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
            <div className="ps-detail-actions">
              <button className="ip-action primary" onClick={() => applyTemplate(detail.id)}>Use this</button>
              <button className="ip-action" onClick={() => openDuplicate(detail)}>Duplicate</button>
              {detail.isCustom && (
                <button className="ip-action danger" onClick={() => deleteCustom(detail.id)}>Delete</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Duplicate-and-modify modal — uses position:fixed so it sits above
          the bottom nav (the parent .ps-overlay only covers .screen-body
          via position:absolute, leaving the bottom nav as a click target). */}
      {dupOpen && (
        <div
          className="ps-overlay"
          style={{ zIndex: 250, position: 'fixed', inset: 0 }}
          onClick={() => setDupOpen(null)}
        >
          <div className="ps-sheet ps-sheet-narrow" onClick={e => e.stopPropagation()}>
            <div className="ps-head">
              <div>
                <div className="ps-t">Create custom preset</div>
                <div className="ps-s mono">FROM · {dupOpen.name.toUpperCase()}</div>
              </div>
              <button className="ip-x" onClick={() => setDupOpen(null)} aria-label="Cancel"><IconX/></button>
            </div>
            <div style={{ padding: '4px 0 16px' }}>
              <label className="ps-dup-label">Preset name</label>
              <input
                className="ps-dup-input"
                type="text"
                value={dupName}
                onChange={(e) => setDupName(e.target.value)}
                placeholder="My PPL"
                maxLength={40}
                autoFocus
              />
              <div className="ps-dup-preview">
                {dupOpen.days.map((d, i) => (
                  <span key={i} className="tpl-cell" style={{ background:`var(--bp-${d})`, width: 18, height: 18 }}/>
                ))}
              </div>
              <p className="ps-dup-help">
                Saved to your custom presets. Apply any time. Edit by re-duplicating, or delete from the menu.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="ip-action" onClick={() => setDupOpen(null)}>Cancel</button>
              <button className="ip-action primary" onClick={saveCustom} disabled={!dupName.trim()}>
                Save preset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
