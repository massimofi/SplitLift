const { useState, useMemo, useRef, useEffect } = React;

// ---------- Icons ----------
const I = {
  arrowR: (p)=> <svg {...p} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  arrowL: (p)=> <svg {...p} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>,
  apple:  (p)=> <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.4 12.6c0-2.5 2-3.7 2.1-3.8-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.7.9s-2-.9-3.2-.9c-1.6 0-3.1 1-4 2.5C2.2 12.5 3.5 18 5.3 21c.9 1.4 2 3 3.5 3 1.4 0 1.9-.9 3.6-.9s2.2.9 3.6.9c1.5 0 2.5-1.5 3.4-2.9 1-1.6 1.5-3.2 1.5-3.3-.1 0-2.9-1.1-2.9-4.2zM14 5.4c.7-.9 1.2-2.1 1.1-3.4-1.1 0-2.4.7-3.2 1.6-.7.7-1.3 1.9-1.1 3.2 1.2.1 2.5-.6 3.2-1.4z"/></svg>,
  google: (p)=> <svg {...p} width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.4h5.9c-.3 1.4-1 2.5-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8.1z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.6H2.2v2.8C4 20.4 7.7 23 12 23z"/><path fill="#FBBC04" d="M5.8 14c-.2-.7-.3-1.4-.3-2.1s.1-1.4.3-2.1V7H2.2c-.7 1.4-1.2 3-1.2 4.9 0 1.9.4 3.5 1.2 4.9l3.6-2.8z"/><path fill="#EA4335" d="M12 4.8c1.6 0 3.1.6 4.2 1.6l3.1-3.1C17.4 1.5 14.9.5 12 .5 7.7.5 4 3.1 2.2 7l3.6 2.8C6.7 7.1 9.1 4.8 12 4.8z"/></svg>,
  email:  (p)=> <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/></svg>,

  splits: (p)=> <svg {...p} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/></svg>,
  cardio: (p)=> <svg {...p} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h4l2-6 4 12 2-6h6"/></svg>,
  cover:  (p)=> <svg {...p} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="6" r="3"/><path d="M12 9v6M8 13l4-4 4 4M5 21h14"/></svg>,
  prof:   (p)=> <svg {...p} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>,

  refresh:(p)=> <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>,
  lock:   (p)=> <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>,
  unlock: (p)=> <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7-1"/></svg>,
  plus:   (p)=> <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  x:      (p)=> <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  drag:   (p)=> <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/></svg>,
  rotate: (p)=> <svg {...p} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.7 9.7 0 0 1 6.7 2.6L21 8"/><path d="M21 3v5h-5"/></svg>,
};

// ---------- Status bar ----------
function StatusBar({ dark }) {
  return (
    <div className={`statusbar ${dark?'dark':''}`}>
      <span>9:41</span>
      <div className="icons">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="9" width="3" height="3" rx="0.5"/><rect x="5" y="6" width="3" height="6" rx="0.5"/><rect x="10" y="3" width="3" height="9" rx="0.5"/><rect x="15" y="0" width="3" height="12" rx="0.5"/></svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 5a8 8 0 0 1 12 0M4.5 7.5a4.5 4.5 0 0 1 7 0"/><circle cx="8" cy="10" r="1" fill="currentColor"/></svg>
        <svg width="24" height="12" viewBox="0 0 24 12" fill="none"><rect x="1" y="2" width="20" height="8" rx="2" stroke="currentColor"/><rect x="3" y="4" width="14" height="4" fill="currentColor"/><rect x="22" y="4.5" width="1.5" height="3" rx="0.5" fill="currentColor"/></svg>
      </div>
    </div>
  );
}

// ---------- LANDING ----------
function Landing({ onStart }) {
  return (
    <div className="screen">
      <StatusBar/>
      <div className="screen-body landing">
        <div className="top">
          <div className="logo-row">
            <div className="logo-mark">S</div>
            <div className="logo-name">Split<span className="slash">/</span>Lift</div>
          </div>
          <h1 className="hero-title">Lift smarter.<br/>Cover <span className="accent">everything.</span></h1>
          <p className="hero-sub">A weekly split tailored to your sport, your body, your week — built in under a minute.</p>

          <div className="feature-row">
            <div className="feature">
              <div className="dot"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/></svg></div>
              <div className="text"><div className="t">Drag your week into shape</div><div className="s">7-day grid, swap anything in one tap.</div></div>
            </div>
            <div className="feature">
              <div className="dot"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="6" r="3"/><path d="M12 9v6M8 13l4-4 4 4M5 21h14"/></svg></div>
              <div className="text"><div className="t">See what you cover</div><div className="s">Live body map updates as you build.</div></div>
            </div>
            <div className="feature">
              <div className="dot"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h4l2-6 4 12 2-6h6"/></svg></div>
              <div className="text"><div className="t">Tuned to your sport</div><div className="s">Soccer ≠ climbing ≠ general fitness.</div></div>
            </div>
          </div>
        </div>

        <div className="bottom">
          <button className="btn green" onClick={() => onStart('signup')}>Get started <I.arrowR/></button>
          <div className="secondary-text">Already have an account? <a onClick={() => onStart('login')}>Log in</a></div>
        </div>
      </div>
    </div>
  );
}

// ---------- LOGIN ----------
function Login({ mode, onBack, onSubmit }) {
  const [email, setEmail] = useState('alex@splitlift.app');
  const [pw, setPw] = useState('••••••••');
  const isSignup = mode === 'signup';

  return (
    <div className="screen">
      <StatusBar/>
      <div className="screen-body auth">
        <button className="back-btn" onClick={onBack}><I.arrowL/></button>
        <div className="auth-head">
          <h1 className="auth-title">{isSignup ? 'Create account' : 'Welcome back'}</h1>
          <p className="auth-sub">{isSignup ? 'Two fields, then we get out of your way.' : 'Pick up where you left off.'}</p>
        </div>

        <div className="auth-form">
          <div className="field">
            <div className="label">Email</div>
            <input className="input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com"/>
          </div>
          <div className="field">
            <div className="label">Password</div>
            <input className="input" type="password" value={pw} onChange={(e)=>setPw(e.target.value)} placeholder="••••••••"/>
          </div>
          <button className="btn green" onClick={onSubmit}>{isSignup ? 'Create account' : 'Log in'} <I.arrowR/></button>
        </div>

        <div className="divider">Or continue with</div>

        <div className="social">
          <button className="btn outline" onClick={onSubmit}><I.apple/> Continue with Apple</button>
          <button className="btn outline" onClick={onSubmit}><I.google/> Continue with Google</button>
        </div>
      </div>
    </div>
  );
}

// ---------- ONBOARDING ----------
function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const [days, setDays] = useState(4);
  const [hUnit, setHUnit] = useState('cm');
  const [wUnit, setWUnit] = useState('kg');
  const [height, setHeight] = useState(178);
  const [weight, setWeight] = useState(74);
  const [pulse, setPulse] = useState('');
  const [sport, setSport] = useState('soccer');

  const total = 4;
  const next = () => step < total - 1 ? setStep(step+1) : onDone({ days, height, hUnit, weight, wUnit, pulse, sport });
  const back = () => step > 0 && setStep(step-1);

  return (
    <div className="screen">
      <StatusBar/>
      <div className="screen-body onboard">
        <button className="back-btn" onClick={back} style={{ visibility: step===0?'hidden':'visible' }}><I.arrowL/></button>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${((step+1)/total)*100}%` }}/>
        </div>
        <div className="step-eyebrow mono">Step {step+1} of {total}</div>

        {step === 0 && (
          <>
            <h2 className="step-q">What sport do you train for?</h2>
            <p className="step-help">Drives muscle priorities. You can change it later.</p>
            <div className="sport-grid">
              {window.SPORTS.map(s => (
                <button key={s.id} className={`sport-card ${sport===s.id?'active':''}`} onClick={()=>setSport(s.id)}>
                  <div className="t">{s.label}</div>
                  <div className="s">{s.sub}</div>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="step-q">How many days a week can you lift?</h2>
            <p className="step-help">We'll fill the rest with sport practice or rest.</p>
            <div className="pill-row">
              {[2,3,4,5,6].map(n => (
                <div key={n} className={`day-pill ${days===n?'active':''}`} onClick={()=>setDays(n)}>{n}</div>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="step-q">Your stats.</h2>
            <p className="step-help">Used to estimate volume and intensity targets.</p>

            <div style={{ marginBottom: 28 }}>
              <div className="stat-input-row">
                <span className="label">Height</span>
                <div className="unit-toggle">
                  <button className={hUnit==='cm'?'active':''} onClick={()=>setHUnit('cm')}>CM</button>
                  <button className={hUnit==='ft'?'active':''} onClick={()=>setHUnit('ft')}>FT</button>
                </div>
              </div>
              <div className="big-number-input">
                <input className="num" type="number" value={height} onChange={(e)=>setHeight(e.target.value)}/>
                <span className="unit">{hUnit}</span>
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <div className="stat-input-row">
                <span className="label">Weight</span>
                <div className="unit-toggle">
                  <button className={wUnit==='kg'?'active':''} onClick={()=>setWUnit('kg')}>KG</button>
                  <button className={wUnit==='lb'?'active':''} onClick={()=>setWUnit('lb')}>LB</button>
                </div>
              </div>
              <div className="big-number-input">
                <input className="num" type="number" value={weight} onChange={(e)=>setWeight(e.target.value)}/>
                <span className="unit">{wUnit}</span>
              </div>
            </div>

            <div>
              <div className="stat-input-row">
                <span className="label">Resting pulse <span className="opt-tag">optional</span></span>
              </div>
              <div className="big-number-input">
                <input className="num" type="number" value={pulse} onChange={(e)=>setPulse(e.target.value)} placeholder="—"/>
                <span className="unit">bpm</span>
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 className="step-q">You're set.</h2>
            <p className="step-help">Here's what we'll use to seed your week.</p>
            <div style={{ background: 'var(--bg-2)', borderRadius: 16, padding: 18, marginBottom: 14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0' }}><span className="mono" style={{color:'var(--ink-3)', fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase'}}>Sport</span><span style={{fontWeight:600}}>{window.SPORTS.find(s=>s.id===sport)?.label}</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0' }}><span className="mono" style={{color:'var(--ink-3)', fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase'}}>Lift days</span><span style={{fontWeight:600}}>{days} / week</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0' }}><span className="mono" style={{color:'var(--ink-3)', fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase'}}>Height</span><span style={{fontWeight:600}}>{height} {hUnit}</span></div>
              <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0' }}><span className="mono" style={{color:'var(--ink-3)', fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase'}}>Weight</span><span style={{fontWeight:600}}>{weight} {wUnit}</span></div>
              {pulse && <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0' }}><span className="mono" style={{color:'var(--ink-3)', fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase'}}>Pulse</span><span style={{fontWeight:600}}>{pulse} bpm</span></div>}
            </div>
          </>
        )}

        <div className="onboard-foot">
          <button className="btn green" onClick={next}>
            {step === total-1 ? 'Build my split' : 'Continue'} <I.arrowR/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- WEEKLY BUILDER ----------
function ExerciseRow({ ex, dayIdx, exIdx, onRemove, onDragStartCard, dragging }) {
  return (
    <div
      className={`ex-row t-${ex.type} ${dragging?'dragging':''}`}
      onMouseDown={(e)=>onDragStartCard(e, dayIdx, exIdx)}
      onTouchStart={(e)=>onDragStartCard(e, dayIdx, exIdx)}
    >
      <div className="handle"><I.drag/></div>
      <div className="body">
        <div className="name">{ex.name}</div>
        <div className="meta">
          <span>{ex.sets}</span>
          <span className="gear">{ex.gear}</span>
          <span>· {window.TYPE_LABELS[ex.type].label}</span>
        </div>
      </div>
      <button className="remove" onClick={(e)=>{ e.stopPropagation(); onRemove(dayIdx, exIdx); }}><I.x/></button>
    </div>
  );
}

function DayCard({ day, dayIdx, locked, onToggleLock, onRemove, onDropOn, onAddTap, onDragStartCard, dropActiveIdx, draggingFrom }) {
  const exObjs = day.exIds.map(id => window.EXERCISES.find(e=>e.id===id)).filter(Boolean);
  const totalSets = exObjs.reduce((s,ex)=>s+window.setsForExercise(ex),0);
  const isDropActive = dropActiveIdx === dayIdx;

  return (
    <div
      data-day-idx={dayIdx}
      className={`day-card ${locked?'locked':''} ${isDropActive?'drop-active':''} ${day.rest?'day-rest':''}`}
    >
      <div className="day-card-head">
        <div className="left">
          <span className="day-name">{window.DAY_NAMES[dayIdx]}</span>
          <span className="focus">{day.focus}</span>
        </div>
        <div className="right">
          {!day.rest && exObjs.length > 0 && (
            <span className="day-meta-pill">{totalSets} sets · {Math.round(totalSets*3 + 8)}m</span>
          )}
          <button className={`day-lock ${locked?'on':''}`} onClick={()=>onToggleLock(dayIdx)}>
            {locked ? <I.lock/> : <I.unlock/>}
          </button>
        </div>
      </div>

      {day.rest && day.exIds.length === 0 ? (
        <div className="empty-day">{day.restNote}</div>
      ) : exObjs.length === 0 ? (
        <div className="empty-day">No exercises yet — tap below to add.</div>
      ) : (
        <div className="ex-list">
          {exObjs.map((ex, exIdx) => (
            <ExerciseRow
              key={`${day.exIds[exIdx]}-${exIdx}`}
              ex={ex}
              dayIdx={dayIdx}
              exIdx={exIdx}
              onRemove={onRemove}
              onDragStartCard={onDragStartCard}
              dragging={draggingFrom && draggingFrom.dayIdx===dayIdx && draggingFrom.exIdx===exIdx}
            />
          ))}
        </div>
      )}

      {!day.rest && (
        <button className="add-mini-btn" onClick={()=>onAddTap(dayIdx)}>
          <I.plus/> Add exercise
        </button>
      )}
    </div>
  );
}

// ---------- LIBRARY SHEET ----------
function LibrarySheet({ open, onClose, onAdd, days, defaultDay }) {
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [targetDay, setTargetDay] = useState(defaultDay ?? 0);

  useEffect(() => {
    if (open && defaultDay !== undefined && defaultDay !== null) {
      setTargetDay(defaultDay);
    }
  }, [open, defaultDay]);

  const filtered = window.EXERCISES.filter(ex => {
    if (filter !== 'all' && ex.type !== filter) return false;
    if (q.trim() && !ex.name.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const targetDayObj = days[targetDay];

  return (
    <>
      <div className={`sheet-overlay ${open?'open':''}`} onClick={onClose}/>
      <div className={`sheet ${open?'open':''}`}>
        <div className="sheet-handle"/>
        <div className="sheet-head">
          <h2 className="sheet-title">Exercise library</h2>
          <p className="sheet-sub">Tap to add to a day. Color = lift type.</p>
          <input className="sheet-search" placeholder="Search exercises…" value={q} onChange={(e)=>setQ(e.target.value)}/>

          <div className="day-target-prompt">
            <span className="b">Adding to:</span> {window.DAY_NAMES[targetDay]} · {targetDayObj?.focus || 'Rest'}
          </div>
          <div className="day-picker-row">
            {window.DAY_NAMES.map((d, i) => (
              <button
                key={i}
                className={targetDay===i?'active':''}
                onClick={()=>setTargetDay(i)}
              >{d}</button>
            ))}
          </div>

          <div className="chip-row">
            {window.FILTER_CHIPS.map(c => (
              <button key={c.id} className={`chip ${filter===c.id?'active':''}`} onClick={()=>setFilter(c.id)}>
                {c.id !== 'all' && <span className="dot" style={{background: window.TYPE_LABELS[c.id]?.color}}/>}
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sheet-body">
          {filtered.map(ex => (
            <div key={ex.id} className={`lib-row t-${ex.type}`} onClick={()=>onAdd(ex.id, targetDay)}>
              <div className="body">
                <div className="name" style={{fontSize:15, fontWeight:600, letterSpacing:'-0.01em'}}>{ex.name}</div>
                <div className="meta mono" style={{fontSize:11, color:'var(--ink-3)', marginTop:2}}>
                  {ex.sets} · {ex.gear} · {window.TYPE_LABELS[ex.type].label}
                </div>
              </div>
              <button className="add"><I.plus/></button>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{textAlign:'center', padding:'40px 0', color:'var(--ink-4)', fontSize:14}}>
              Nothing matches.
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ---------- COVERAGE PANEL ----------
function CoveragePanel({ open, onClose, days }) {
  const [view, setView] = useState('front');
  const [recently, setRecently] = useState(null);
  const sets = useMemo(()=>window.computeCoverage(days), [days]);

  const flash = (key) => {
    setRecently(key);
    setTimeout(()=>setRecently(null), 800);
  };

  return (
    <div className={`coverage-panel ${open?'open':''}`}>
      <StatusBar dark/>
      <div className="cov-head">
        <div>
          <div className="title">Coverage</div>
          <div className="sub">This week · live</div>
        </div>
        <button className="cov-close" onClick={onClose}><I.x/></button>
      </div>

      <div className="cov-toggles">
        <div className="cov-seg">
          <button className={view==='front'?'active':''} onClick={()=>setView('front')}>Front</button>
          <button className={view==='back'?'active':''} onClick={()=>setView('back')}>Back</button>
        </div>
      </div>

      <div className="body-stage">
        <window.Body3D sets={sets} view={view} recently={recently} onRegion={flash}/>
        <div className="rotate-hint">tap front · back to rotate</div>
      </div>

      <div className="cov-summary">
        <h3>Per group · weekly sets</h3>
        <div className="cov-list">
          {Object.keys(window.MUSCLE_LABELS).map(k => {
            const s = sets[k] || 0;
            const status = window.statusFor(s, window.TARGETS[k]);
            return (
              <div key={k} className="cov-item">
                <span className="name">{window.MUSCLE_LABELS[k]}</span>
                <span className="sets mono">{s}</span>
                <span className={`badge ${status}`}>{status}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ---------- MAIN APP ----------
function MainApp({ profile, onLogout }) {
  const [days, setDays] = useState(window.INITIAL_DAYS);
  const [locked, setLocked] = useState([false,true,false,false,false,true,false]);
  const [tab, setTab] = useState('splits');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDay, setSheetDay] = useState(0);
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Drag state
  const [drag, setDrag] = useState(null);
  // drag = { exId, fromDay, fromExIdx, x, y, offX, offY, w, h, ghost: { name, type } }
  const [dropDayIdx, setDropDayIdx] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(()=>setToast(null), 2000);
  };

  // ---- Drag handlers ----
  const onDragStartCard = (e, dayIdx, exIdx) => {
    if (e.button === 2) return; // right click
    const ex = window.EXERCISES.find(x => x.id === days[dayIdx].exIds[exIdx]);
    if (!ex) return;
    const isTouch = e.touches !== undefined;
    const px = isTouch ? e.touches[0].clientX : e.clientX;
    const py = isTouch ? e.touches[0].clientY : e.clientY;
    const rect = e.currentTarget.getBoundingClientRect();

    setDrag({
      exId: ex.id,
      fromDay: dayIdx,
      fromExIdx: exIdx,
      x: px,
      y: py,
      offX: px - rect.left,
      offY: py - rect.top,
      w: rect.width,
      h: rect.height,
      ghost: { name: ex.name, type: ex.type, sets: ex.sets, gear: ex.gear },
    });
    e.preventDefault();
  };

  useEffect(() => {
    if (!drag) return;

    const move = (e) => {
      const isTouch = e.touches !== undefined;
      const px = isTouch ? e.touches[0].clientX : e.clientX;
      const py = isTouch ? e.touches[0].clientY : e.clientY;

      // find day under pointer
      const el = document.elementFromPoint(px, py);
      const dayEl = el && el.closest && el.closest('[data-day-idx]');
      const idx = dayEl ? parseInt(dayEl.getAttribute('data-day-idx'), 10) : null;

      setDrag(d => d ? { ...d, x: px, y: py } : null);
      setDropDayIdx(idx);

      if (isTouch) e.preventDefault();
    };

    const up = (e) => {
      if (drag && dropDayIdx !== null && dropDayIdx !== drag.fromDay) {
        // move
        setDays(prev => {
          const next = prev.map(d => ({...d, exIds: [...d.exIds]}));
          // remove from origin
          next[drag.fromDay].exIds.splice(drag.fromExIdx, 1);
          // add to target
          if (next[dropDayIdx].rest) {
            next[dropDayIdx] = { ...next[dropDayIdx], rest: false, exIds:[drag.exId], focus: 'Custom' };
          } else {
            next[dropDayIdx].exIds.push(drag.exId);
          }
          return next;
        });
      }
      setDrag(null);
      setDropDayIdx(null);
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
    window.addEventListener('touchcancel', up);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
      window.removeEventListener('touchcancel', up);
    };
  }, [drag, dropDayIdx]);

  const removeExercise = (dayIdx, exIdx) => {
    setDays(prev => {
      const next = prev.map(d => ({...d, exIds: [...d.exIds]}));
      next[dayIdx].exIds.splice(exIdx, 1);
      return next;
    });
  };

  const toggleLock = (dayIdx) => setLocked(prev => prev.map((v,i)=>i===dayIdx?!v:v));

  const regenerate = () => {
    setDays(prev => prev.map((d,i) => locked[i] ? d : { ...window.INITIAL_DAYS[i] }));
    showToast('Split regenerated');
  };

  const openSheet = (dayIdx) => {
    setSheetDay(dayIdx);
    setSheetOpen(true);
  };

  const addExerciseToDay = (exId, dayIdx) => {
    setDays(prev => {
      const next = prev.map(d => ({...d, exIds: [...d.exIds]}));
      if (next[dayIdx].rest) {
        next[dayIdx] = { ...next[dayIdx], rest: false, exIds: [exId], focus: 'Custom' };
      } else {
        next[dayIdx].exIds.push(exId);
      }
      return next;
    });
    showToast(`Added to ${window.DAY_NAMES[dayIdx]}`);
  };

  const sportLabel = window.SPORTS.find(s => s.id === profile.sport)?.label || 'General';
  const totalLiftDays = days.filter(d => !d.rest).length;

  return (
    <div className="app-screen">
      <StatusBar/>
      <div className="app-header">
        <div>
          <div className="header-title">Your week</div>
          <div className="header-sub">{sportLabel.toUpperCase()} · {totalLiftDays} LIFT · {7-totalLiftDays} OFF</div>
        </div>
        <div className="avatar" onClick={onLogout} title="Logout">A</div>
      </div>

      {/* Stats nav */}
      <div className="stats-nav">
        <div className="stat-chip">
          <span className="k">Height</span>
          <span className="v">{profile.height}<span className="u">{profile.hUnit}</span></span>
        </div>
        <div className="stat-chip">
          <span className="k">Weight</span>
          <span className="v">{profile.weight}<span className="u">{profile.wUnit}</span></span>
        </div>
        <div className={`stat-chip ${profile.pulse?'':'optional'}`}>
          <span className="k">Pulse</span>
          <span className="v">{profile.pulse || '—'}<span className="u">bpm</span></span>
        </div>
        <div className="stat-chip">
          <span className="k">Days</span>
          <span className="v">{profile.days}<span className="u">/wk</span></span>
        </div>
        <div className="stat-chip">
          <span className="k">Sport</span>
          <span className="v">{sportLabel}</span>
        </div>
      </div>

      <div className="screen-body" style={{position:'relative'}}>
        {/* Splits tab */}
        {tab === 'splits' && (
          <>
            <div style={{padding:'0 24px 12px', display:'flex', gap:8}}>
              <button className="btn outline sm" style={{flex:1}} onClick={regenerate}>
                <I.refresh/> Regenerate
              </button>
            </div>

            <div className="week-stack">
              {days.map((day, idx) => (
                <DayCard
                  key={idx}
                  day={day}
                  dayIdx={idx}
                  locked={locked[idx]}
                  onToggleLock={toggleLock}
                  onRemove={removeExercise}
                  onAddTap={openSheet}
                  onDragStartCard={onDragStartCard}
                  dropActiveIdx={dropDayIdx}
                  draggingFrom={drag ? { dayIdx: drag.fromDay, exIdx: drag.fromExIdx } : null}
                />
              ))}
            </div>

            <button className="lib-sheet-trigger" onClick={()=>openSheet(0)}>
              <span className="l">Open exercise library</span>
              <span className="c mono">{window.EXERCISES.length}</span>
              <I.arrowR className="arrow"/>
            </button>
          </>
        )}

        {tab === 'cardio' && (
          <div style={{padding:24, color:'var(--ink-3)', fontSize:15}}>
            <h3 style={{color:'var(--ink)', marginBottom:8}}>Cardio</h3>
            Coming next iteration.
          </div>
        )}
        {tab === 'profile' && (
          <div style={{padding:24, color:'var(--ink-3)', fontSize:15}}>
            <h3 style={{color:'var(--ink)', marginBottom:8}}>Profile</h3>
            Settings live here.
          </div>
        )}

        {/* Floating coverage tab */}
        {tab === 'splits' && (
          <button className="cov-tab" onClick={()=>setCoverageOpen(true)}>
            <span>See coverage</span>
          </button>
        )}

        {toast && <div className="toast">{toast}</div>}

        {/* Drag ghost */}
        {drag && (
          <div
            style={{
              position: 'fixed',
              left: drag.x - drag.offX,
              top: drag.y - drag.offY,
              width: drag.w,
              pointerEvents: 'none',
              zIndex: 1000,
              opacity: 0.95,
            }}
          >
            <div className={`ex-row t-${drag.ghost.type} dragging`} style={{margin:0}}>
              <div className="handle"><I.drag/></div>
              <div className="body">
                <div className="name">{drag.ghost.name}</div>
                <div className="meta">
                  <span>{drag.ghost.sets}</span>
                  <span className="gear">{drag.ghost.gear}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="bottom-nav">
        <button className={`bn-item ${tab==='splits'?'active':''}`} onClick={()=>setTab('splits')}>
          <I.splits/><span className="lbl">Splits</span>
        </button>
        <button className={`bn-item ${tab==='cardio'?'active':''}`} onClick={()=>setTab('cardio')}>
          <I.cardio/><span className="lbl">Cardio</span>
        </button>
        <button className={`bn-item ${tab==='cover'?'active':''}`} onClick={()=>setCoverageOpen(true)}>
          <I.cover/><span className="lbl">Cover</span>
        </button>
        <button className={`bn-item ${tab==='profile'?'active':''}`} onClick={()=>setTab('profile')}>
          <I.prof/><span className="lbl">Profile</span>
        </button>
      </div>

      <LibrarySheet
        open={sheetOpen}
        onClose={()=>setSheetOpen(false)}
        onAdd={(exId, dayIdx)=>{ addExerciseToDay(exId, dayIdx); }}
        days={days}
        defaultDay={sheetDay}
      />

      <CoveragePanel
        open={coverageOpen}
        onClose={()=>setCoverageOpen(false)}
        days={days}
      />
    </div>
  );
}

// ---------- ROOT ROUTER ----------
function Root() {
  const [screen, setScreen] = useState('landing'); // landing | login | signup | onboard | app
  const [profile, setProfile] = useState({
    days: 4, height: 178, hUnit: 'cm', weight: 74, wUnit: 'kg', pulse: '', sport: 'soccer'
  });

  return (
    <div className="phone-shell">
      <div className="phone">
        <div className="notch"/>
        {screen === 'landing' && <Landing onStart={(mode)=>setScreen(mode)}/>}
        {(screen === 'login' || screen === 'signup') && (
          <Login
            mode={screen}
            onBack={()=>setScreen('landing')}
            onSubmit={()=>setScreen(screen==='signup' ? 'onboard' : 'app')}
          />
        )}
        {screen === 'onboard' && (
          <Onboarding onDone={(p)=>{ setProfile(p); setScreen('app'); }}/>
        )}
        {screen === 'app' && <MainApp profile={profile} onLogout={()=>setScreen('landing')}/>}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root/>);
