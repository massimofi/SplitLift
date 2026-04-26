// Command palette (⌘K). Searches exercises + tab destinations.

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { EXERCISES, TYPE_LABELS } from '../data/exercises.js';
import { I } from './Icons.jsx';

export function CmdK({ open, onClose, onAddExercise, onSwitchTab }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => { if (open) { setQ(''); setSel(0); setTimeout(()=>inputRef.current?.focus(), 60); } }, [open]);

  const items = useMemo(() => {
    const exs = EXERCISES.map(ex => {
      if (!ex || !ex.id) return null;
      const typeLabel = TYPE_LABELS[ex.type]?.label || ex.type || '';
      return {
        kind: 'ex', id: ex.id, name: ex.name, type: ex.type,
        sub: `${ex.sets} · ${ex.gear} · ${typeLabel}`,
        ent: 'Add to today',
      };
    }).filter(Boolean);
    const tabs = [
      { kind: 'tab', id: 'dashboard',name: 'Go to Dashboard',sub: 'Lifting + cardio scores', ent: '↵' },
      { kind: 'tab', id: 'splits',   name: 'Go to Splits',   sub: 'Per-day-type exercise editor', ent: '↵' },
      { kind: 'tab', id: 'schedule', name: 'Go to Schedule', sub: 'Plan the week', ent: '↵' },
      { kind: 'tab', id: 'body',     name: 'Go to Body',     sub: 'Coverage map', ent: '↵' },
      { kind: 'tab', id: 'friends',  name: 'Go to Friends',  sub: 'Compare splits', ent: '↵' },
      { kind: 'tab', id: 'general',  name: 'Go to General',  sub: 'Profile, stats, calories', ent: '↵' },
      { kind: 'tab', id: 'profile',  name: 'Go to Profile',  sub: 'Settings', ent: '↵' },
    ];
    return { tabs, exs };
  }, []);

  const ql = q.trim().toLowerCase();
  const filteredTabs = ql ? items.tabs.filter(t => t.name.toLowerCase().includes(ql)) : items.tabs;
  const filteredExs = ql
    ? items.exs.filter(e => {
        const typeLabel = TYPE_LABELS[e.type]?.label || '';
        return e.name.toLowerCase().includes(ql) || typeLabel.toLowerCase().includes(ql);
      })
    : items.exs.slice(0, 8);

  const flat = [...filteredTabs.map(x => ({...x, group:'Navigate'})), ...filteredExs.map(x => ({...x, group:'Add to today'}))];

  useEffect(() => { setSel(0); }, [q]);

  const onKey = useCallback((e) => {
    if (!open) return;
    if (e.key === 'Escape') { onClose(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s+1, flat.length-1)); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); setSel(s => Math.max(s-1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      const it = flat[sel];
      if (!it) return;
      if (it.kind === 'tab') { onSwitchTab(it.id); onClose(); }
      else if (it.kind === 'ex') { onAddExercise(it.id); onClose(); }
    }
  }, [open, flat, sel, onClose, onSwitchTab, onAddExercise]);

  useEffect(() => {
    if (!open) return;
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onKey]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const row = list.querySelector(`[data-idx="${sel}"]`);
    if (!row) return;
    const lr = list.getBoundingClientRect();
    const rr = row.getBoundingClientRect();
    if (rr.top < lr.top) list.scrollTop -= (lr.top - rr.top) + 8;
    else if (rr.bottom > lr.bottom) list.scrollTop += (rr.bottom - lr.bottom) + 8;
  }, [sel]);

  if (!open) return null;

  let groupedIdx = -1;
  const groups = {};
  flat.forEach(it => { (groups[it.group] = groups[it.group] || []).push(it); });

  return (
    <div className="cmdk-overlay" onClick={onClose}>
      <div className="cmdk" onClick={(e)=>e.stopPropagation()}>
        <div className="cmdk-input-row">
          <span className="ico"><I.search/></span>
          <input ref={inputRef} placeholder="Search exercises or jump to a tab…" value={q} onChange={(e)=>setQ(e.target.value)}/>
          <span className="kbd">ESC</span>
        </div>
        <div className="cmdk-list" ref={listRef}>
          {flat.length === 0 && <div className="cmdk-empty">No matches.</div>}
          {Object.entries(groups).map(([gname, arr]) => (
            <div key={gname}>
              <div className="cmdk-group-label">{gname}</div>
              {arr.map(it => {
                groupedIdx++;
                const idx = groupedIdx;
                const selected = idx === sel;
                return (
                  <div key={it.kind+it.id} data-idx={idx}
                    className={`cmdk-row ${it.kind==='ex' ? `t-${it.type}`:''}`}
                    aria-selected={selected}
                    onMouseEnter={()=>setSel(idx)}
                    onClick={() => {
                      if (it.kind === 'tab') { onSwitchTab(it.id); onClose(); }
                      else { onAddExercise(it.id); onClose(); }
                    }}
                  >
                    <div className="body">
                      <div className="nm">{it.name}</div>
                      <div className="ms">{it.sub}</div>
                    </div>
                    <span className="ent">{it.ent}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="cmdk-foot">
          <div className="pair"><span className="kbd">↑↓</span><span>navigate</span></div>
          <div className="pair"><span className="kbd">↵</span><span>select</span></div>
          <div className="pair"><span className="kbd">⌘K</span><span>toggle</span></div>
        </div>
      </div>
    </div>
  );
}
