// Bottom-sheet for logging a new weigh-in. Always stores kg internally;
// converts on submit if the user picked lb.

import React, { useState } from 'react';
import { IconX, IconPlus } from './Icons.jsx';

const TODAY_ISO = () => new Date().toISOString().slice(0, 10);
const LB_TO_KG = 0.4536;

export function LogWeightSheet({ onSubmit, onClose, defaultUnit = 'kg', defaultWeight }) {
  const [unit, setUnit] = useState(defaultUnit);
  const [weightStr, setWeightStr] = useState(
    defaultWeight ? String(unit === 'lb' ? Math.round(defaultWeight * 2.20462) : defaultWeight) : ''
  );
  const [date, setDate] = useState(TODAY_ISO());

  const submit = () => {
    const v = parseFloat(weightStr);
    if (!v || v <= 0) return;
    const kg = unit === 'lb' ? Math.round(v * LB_TO_KG * 10) / 10 : Math.round(v * 10) / 10;
    onSubmit({ date, kg, unit });
  };

  const valid = parseFloat(weightStr) > 0 && date;

  return (
    <div className="ps-overlay" onClick={onClose}>
      <div className="ps-sheet" onClick={e=>e.stopPropagation()}>
        <div className="ps-head">
          <div>
            <div className="ps-t">Log weight</div>
            <div className="ps-s mono">QUICK ENTRY</div>
          </div>
          <button className="ip-x" onClick={onClose} aria-label="Close"><IconX/></button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div className="stat-input-row"><span className="label">Weight</span>
            <div className="unit-toggle">
              <button className={unit==='kg'?'active':''} onClick={()=>setUnit('kg')}>KG</button>
              <button className={unit==='lb'?'active':''} onClick={()=>setUnit('lb')}>LB</button>
            </div>
          </div>
          <div className="big-number-input">
            <input className="num" type="number" step="0.1" inputMode="decimal"
              value={weightStr} placeholder={unit === 'kg' ? '74.5' : '165'}
              onChange={(e)=>setWeightStr(e.target.value)} autoFocus/>
            <span className="unit">{unit}</span>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div className="stat-input-row"><span className="label">Date</span></div>
          <input className="bday-input" type="date"
            value={date} max={TODAY_ISO()} min="2020-01-01"
            onChange={(e)=>setDate(e.target.value)}/>
        </div>

        <button
          className="btn green mesh"
          onClick={submit}
          disabled={!valid}
          style={!valid ? { opacity: 0.5, cursor: 'not-allowed' } : null}>
          <IconPlus/> Save weigh-in
        </button>
      </div>
    </div>
  );
}
