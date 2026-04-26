// Schedule tab — left palette of split + cardio chips, big day boxes.
// Drag a chip onto a day, or tap a day to open the picker sheet.

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
// PresetsSheet is now also imported by SplitsTab; kept import here in
// case Schedule wants a Presets button later (currently it does not).
// import { PresetsSheet } from '../components/PresetsSheet.jsx';

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
  // Presets moved to Splits tab in v11.5 Issue 3 — no presetsOpen here.
  const [pickFor, setPickFor] = useState(null);
  const [drag, setDrag] = useState(null);
  const [hoverIdx, setHoverIdx] = useState(null);
  // v10 Issue 2: tap-to-select fallback for the floating chip bar.
  // selected = { kind: 'split'|'cardio'|'rest', id } or null.
  const [selected, setSelected] = useState(null);
  // v11.5 Issue 3: long-press timer + which chip is armed (for visual feedback).
  const longPressRef = useRef(null);
  const pointerOriginRef = useRef(null);
  const [armedChip, setArmedChip] = useState(null);  // { kind, id } or null
  const LONG_PRESS_MS = 350;
  const MOVE_CANCEL_PX = 8;

  const startDrag = (e, payload) => {
    const isTouch = e.touches !== undefined;
    const px = isTouch ? e.touches[0].clientX : e.clientX;
    const py = isTouch ? e.touches[0].clientY : e.clientY;
    if (!isTouch) e.preventDefault();
    setDrag({ ...payload, x: px, y: py });
  };

  // Begin a long-press: after LONG_PRESS_MS without movement-cancel, fire
  // a haptic-feel drag arm. The existing drag/drop flow takes over from
  // there. Tap-without-hold dismisses cleanly so toggleSelect (onClick)
  // can run as the fallback path.
  const startLongPress = (e, payload) => {
    cancelLongPress();
    const isTouch = e.touches !== undefined;
    const px = isTouch ? e.touches[0].clientX : e.clientX;
    const py = isTouch ? e.touches[0].clientY : e.clientY;
    pointerOriginRef.current = { x: px, y: py };
    longPressRef.current = setTimeout(() => {
      // Haptic on supported devices (Android Chrome, some PWA on iOS).
      try { navigator.vibrate && navigator.vibrate(10); } catch {}
      setArmedChip(payload);
      setDrag({ ...payload, x: px, y: py });
      longPressRef.current = null;
    }, LONG_PRESS_MS);
  };
  const cancelLongPress = () => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
    pointerOriginRef.current = null;
  };
  const onChipMove = (e) => {
    if (!longPressRef.current || !pointerOriginRef.current) return;
    const isTouch = e.touches !== undefined;
    const px = isTouch ? e.touches[0].clientX : e.clientX;
    const py = isTouch ? e.touches[0].clientY : e.clientY;
    const dx = px - pointerOriginRef.current.x;
    const dy = py - pointerOriginRef.current.y;
    if (dx*dx + dy*dy > MOVE_CANCEL_PX * MOVE_CANCEL_PX) cancelLongPress();
  };

  // Clear armed state once drag ends.
  useEffect(() => { if (!drag) setArmedChip(null); }, [drag]);

  const setDayType = (idx, typeId) => {
    if (locked[idx]) { showToast('Locked — unlock first'); return; }
    setDays(prev => prev.map((d, i) => i === idx ? makeDayForType(typeId, profile, splitsByType) : d));
    showToast(`${DAY_NAMES[idx]}: ${DAY_TYPES[typeId]?.label}`);
  };

  // Apply the currently-selected chip (tap-to-select fallback) to a day.
  // Returns true if the day was modified (so the click handler skips its
  // default behavior of opening the picker sheet).
  const applySelection = (idx) => {
    if (!selected) return false;
    if (selected.kind === 'split' || selected.kind === 'rest') {
      setDayType(idx, selected.id);
    } else if (selected.kind === 'cardio') {
      addCardioToDay(idx, selected.id);
    }
    setSelected(null);
    return true;
  };

  // Dismiss the selected-chip glow when tapping anywhere not a chip/day.
  useEffect(() => {
    if (!selected) return;
    const onDoc = (e) => {
      if (e.target.closest('.sched-chip-bar') || e.target.closest('.sched-day-card')) return;
      setSelected(null);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, [selected]);

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
        if (drag.kind === 'split' || drag.kind === 'rest') setDayType(hoverIdx, drag.id);
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

  // Helpers for the floating chip bar (v10 Issue 2).
  const isSelected = (kind, id) =>
    selected && selected.kind === kind && selected.id === id;
  const toggleSelect = (kind, id) => {
    setSelected(s => (s && s.kind === kind && s.id === id) ? null : { kind, id });
  };
  // Splits visible in the chip bar — user splits + 'rest' always last, never
  // 'rest' duplicated. The list comes from userSplitTypes which includes 'rest'.
  const splitChipIds = userSplitTypes;

  return (
    <div className="tab-pane sched-page">
      <div className="sched-bar">
        <Subheader subtitle="Long-press a chip, drag onto a day. Or tap a chip then a day.">Your week</Subheader>
      </div>

      {/* v10 Issue 2: single column of full-width day cards (no left palette). */}
      <div className="sched-rows-only">
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

            // v11.5 Issue 3: vertical exercise list with muscle color dots.
            // Pull live from splitsByType[t] so edits in Splits propagate.
            const exIds = (splitsByType && splitsByType[t]) ? splitsByType[t]
                          : (day.exIds || []);
            const exObjsList = exIds
              .slice(0, 6)
              .map(id => EXERCISES.find(e => e.id === id))
              .filter(Boolean);
            const exTrailCount = exIds.length > 6 ? exIds.length - 6 : 0;

            return (
              <Card
                key={i}
                variant="gradient"
                gradient={isRest ? 'muted' : gradForDayType(t)}
                size={isRest ? 'row' : 'md'}
                interactive
                glow={isToday || (selected && !locked[i])}
                onClick={() => {
                  // v10 Issue 2: if a chip is selected, applying it to the
                  // day takes priority over opening the picker.
                  if (applySelection(i)) return;
                  setPickFor(i);
                }}
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
                    {exObjsList.length > 0 ? (
                      <ul className="sched-day-exlist" aria-label="Exercises">
                        {exObjsList.map(ex => (
                          <li key={ex.id} className="sched-day-exline">
                            <span
                              className="sched-day-exdot"
                              style={{ background: `var(--bp-${ex.body || 'arms'})` }}
                              aria-hidden="true"
                            />
                            <span className="sched-day-exname">{ex.name}</span>
                          </li>
                        ))}
                        {exTrailCount > 0 && (
                          <li className="sched-day-exline is-more">
                            +{exTrailCount} more
                          </li>
                        )}
                      </ul>
                    ) : (
                      <div className="sched-day-preview is-empty">+ Long-press a split chip below</div>
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

      {/* v10 Issue 2: floating chip bar — fixed above bottom nav.
          Tap a chip to "select" it (glowing border), then tap a day to
          apply. Long-press / mouse-down also starts a drag (legacy path). */}
      <div className="sched-chip-bar" onClick={(e)=>e.stopPropagation()}>
        <div className="sched-chip-bar-inner">
          {splitChipIds.map(p => {
            const dt = DAY_TYPES[p];
            if (!dt) return null;
            const sel = isSelected(p === 'rest' ? 'rest' : 'split', p);
            return (
              <Chip
                key={`s-${p}`}
                gradient={gradForDayType(p)}
                size="md"
                role="button"
                tabIndex={0}
                className={`sched-chip ${sel ? 'is-selected' : ''} ${armedChip && armedChip.id === p ? 'is-armed' : ''}`}
                onMouseDown={(e)=>startLongPress(e, { kind: p === 'rest' ? 'rest' : 'split', id:p })}
                onTouchStart={(e)=>startLongPress(e, { kind: p === 'rest' ? 'rest' : 'split', id:p })}
                onMouseMove={onChipMove}
                onTouchMove={onChipMove}
                onMouseUp={cancelLongPress}
                onTouchEnd={cancelLongPress}
                onTouchCancel={cancelLongPress}
                onClick={()=>toggleSelect(p === 'rest' ? 'rest' : 'split', p)}
                style={{ cursor: 'pointer' }}
              >
                {dt.label}
              </Chip>
            );
          })}
          <span className="sched-chip-divider" aria-hidden="true"/>
          {cardioChips.map(c => {
            const sel = isSelected('cardio', c.id);
            return (
              <Chip
                key={`c-${c.id}`}
                gradient="cardio-day"
                size="md"
                role="button"
                tabIndex={0}
                className={`sched-chip ${sel ? 'is-selected' : ''} ${armedChip && armedChip.id === c.id ? 'is-armed' : ''}`}
                onMouseDown={(e)=>startLongPress(e, { kind:'cardio', id:c.id })}
                onTouchStart={(e)=>startLongPress(e, { kind:'cardio', id:c.id })}
                onMouseMove={onChipMove}
                onTouchMove={onChipMove}
                onMouseUp={cancelLongPress}
                onTouchEnd={cancelLongPress}
                onTouchCancel={cancelLongPress}
                onClick={()=>toggleSelect('cardio', c.id)}
                style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
              >
                {CARDIO_TYPES[c.type]?.label || c.name} · {c.dur}m
              </Chip>
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

      {/* Presets sheet moved to Splits tab in v11.5 Issue 3. */}

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


