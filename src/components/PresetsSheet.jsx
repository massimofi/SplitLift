// Presets sheet — browse + apply built-in templates and user-created
// custom presets. v11.5 Issue 3 moved this out of ScheduleTab so the
// Splits tab can also open it.

import React, { useState, useMemo } from 'react';
import { DAY_TYPES, SPORTS } from '../data/exercises.js';
import { SPLIT_TEMPLATES, planForSport, rankTemplatesForSport } from '../data/templates.js';
import { makeDayForType, splitsByTypeFromDays } from '../lib/splits.js';
import { IconX } from './Icons.jsx';

export function PresetsSheet({
  profile, setProfile, locked, days, setDays,
  splitsByType, setSplitsByType, showToast, onClose,
}) {
  const ranked = useMemo(
    () => rankTemplatesForSport({ sport: profile.sport, days: profile.days, limit: 3 }),
    [profile.sport, profile.days]
  );
  const sportLabel = SPORTS.find(s => s.id === profile.sport)?.label || 'your sport';
  const customPresets = profile.customPresets || [];

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
    const safeLocked = locked || [false,false,false,false,false,false,false];
    const safeDays = days || [];
    const newDays = (safeDays.length === 7 ? safeDays : Array(7).fill({ type:'rest', exIds:[], rest:true }))
      .map((d, i) => safeLocked[i] ? d : makeDayForType(tpl.days[i], profile, splitsByType));
    if (setDays) setDays(newDays);
    syncSplits(newDays);
    showToast && showToast(`Applied: ${tpl.name}`);
    onClose();
  };

  const autoBuild = () => {
    const plan = planForSport({ ...profile });
    const safeLocked = locked || [false,false,false,false,false,false,false];
    const newDays = plan.map((p, i) => safeLocked[i] ? (days?.[i]) : p);
    if (setDays) setDays(newDays);
    syncSplits(newDays);
    showToast && showToast('Auto-built for your sport');
    onClose();
  };

  const [detail, setDetail] = useState(null);
  const [dupOpen, setDupOpen] = useState(null);
  const [dupName, setDupName] = useState('');

  const liftCountFor = (tpl) => tpl.days.filter(d => d && d !== 'rest').length;

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
    showToast && showToast(`Saved: ${newPreset.name}`);
    setDupOpen(null);
    setDetail(null);
  };
  const deleteCustom = (id) => {
    setProfile && setProfile(p => ({
      ...p,
      customPresets: (p.customPresets || []).filter(c => c.id !== id),
    }));
    setDetail(null);
    showToast && showToast('Deleted');
  };

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

      {detail && (
        <div className="ps-overlay" style={{ zIndex: 250, position: 'fixed', inset: 0 }} onClick={() => setDetail(null)}>
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

      {dupOpen && (
        <div className="ps-overlay" style={{ zIndex: 250, position: 'fixed', inset: 0 }} onClick={() => setDupOpen(null)}>
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
