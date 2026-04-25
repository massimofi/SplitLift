const { useState, useMemo, useRef, useEffect, useCallback } = React;

// ---------- Tiny "auto-animate" — animates child enter/exit on render ----------
function useFLIP(deps) {
  // simple: rely on rowIn animation in CSS for new entries; reordering animations would need FLIP, skipping for hackathon
  return null;
}

// ---------- Confetti ----------
function fireConfetti(target) {
  if (!target) return;
  const colors = ['#5B5BFF','#9B5BFF','#C09BFF','#8C8CFF','#19B6FF','#FF6BD6'];
  const stage = document.createElement('div');
  stage.className = 'confetti-stage';
  target.appendChild(stage);
  const n = 60;
  for (let i = 0; i < n; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const angle = -Math.PI/2 + (Math.random() - 0.5) * Math.PI * 0.7;
    const v = 220 + Math.random() * 200;
    const dx = Math.cos(angle) * v;
    piece.style.left = (40 + Math.random()*20) + '%';
    piece.style.top = '60%';
    piece.style.background = colors[i % colors.length];
    piece.style.setProperty('--dx', dx + 'px');
    piece.style.setProperty('--rot', (Math.random()*720 - 360) + 'deg');
    piece.style.animationDelay = (Math.random() * 200) + 'ms';
    piece.style.animationDuration = (1400 + Math.random()*900) + 'ms';
    piece.style.width = (6 + Math.random()*6) + 'px';
    piece.style.height = (10 + Math.random()*10) + 'px';
    stage.appendChild(piece);
  }
  setTimeout(() => stage.remove(), 2400);
}

// ---------- Icons ----------
const I = {
  arrowR: (p)=> <svg {...p} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  arrowL: (p)=> <svg {...p} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>,
  apple:  (p)=> <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.4 12.6c0-2.5 2-3.7 2.1-3.8-1.2-1.7-3-1.9-3.6-2-1.5-.2-3 .9-3.7.9s-2-.9-3.2-.9c-1.6 0-3.1 1-4 2.5C2.2 12.5 3.5 18 5.3 21c.9 1.4 2 3 3.5 3 1.4 0 1.9-.9 3.6-.9s2.2.9 3.6.9c1.5 0 2.5-1.5 3.4-2.9 1-1.6 1.5-3.2 1.5-3.3-.1 0-2.9-1.1-2.9-4.2zM14 5.4c.7-.9 1.2-2.1 1.1-3.4-1.1 0-2.4.7-3.2 1.6-.7.7-1.3 1.9-1.1 3.2 1.2.1 2.5-.6 3.2-1.4z"/></svg>,
  google: (p)=> <svg {...p} width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.3H12v4.4h5.9c-.3 1.4-1 2.5-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8.1z"/><path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.5-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.6H2.2v2.8C4 20.4 7.7 23 12 23z"/><path fill="#FBBC04" d="M5.8 14c-.2-.7-.3-1.4-.3-2.1s.1-1.4.3-2.1V7H2.2c-.7 1.4-1.2 3-1.2 4.9 0 1.9.4 3.5 1.2 4.9l3.6-2.8z"/><path fill="#EA4335" d="M12 4.8c1.6 0 3.1.6 4.2 1.6l3.1-3.1C17.4 1.5 14.9.5 12 .5 7.7.5 4 3.1 2.2 7l3.6 2.8C6.7 7.1 9.1 4.8 12 4.8z"/></svg>,

  splits: (p)=> <svg {...p} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 8v8M3 10v4M17.5 8v8M21 10v4M6.5 12h11"/></svg>,
  dumbbell: (p)=> <svg {...p} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6.5 8v8M3 10v4M17.5 8v8M21 10v4M6.5 12h11"/></svg>,
  cardio: (p)=> <svg {...p} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h4l2-6 4 12 2-6h6"/></svg>,
  cover:  (p)=> <svg {...p} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5.5" r="2.5"/><path d="M9 9 L8 14 l1.5 0 L9.5 21 M15 9 L16 14 l-1.5 0 L14.5 21 M9 11h6"/></svg>,
  cal:    (p)=> <svg {...p} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>,
  score:  (p)=> <svg {...p} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="13" width="4" height="8" rx="1"/><rect x="10" y="9" width="4" height="12" rx="1"/><rect x="17" y="5" width="4" height="16" rx="1"/></svg>,
  grip:   (p)=> <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="6" r="0.6"/><circle cx="15" cy="6" r="0.6"/><circle cx="9" cy="12" r="0.6"/><circle cx="15" cy="12" r="0.6"/><circle cx="9" cy="18" r="0.6"/><circle cx="15" cy="18" r="0.6"/></svg>,
  prof:   (p)=> <svg {...p} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>,

  refresh:(p)=> <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></svg>,
  lock:   (p)=> <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>,
  unlock: (p)=> <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 7-1"/></svg>,
  plus:   (p)=> <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  x:      (p)=> <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"/></svg>,
  drag:   (p)=> <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/></svg>,
  sun:    (p)=> <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>,
  moon:   (p)=> <svg {...p} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>,
  zoomOut:(p)=> <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M8 11h6"/></svg>,
  fire:   (p)=> <svg {...p} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2s4 4 4 8a4 4 0 1 1-8 0c0-2 1-3 1-3s-1 5 3 5c2 0 3-1.5 3-3 0-3-3-7-3-7z"/></svg>,
  clock:  (p)=> <svg {...p} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  trend:  (p)=> <svg {...p} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17l6-6 4 4 8-8M14 7h7v7"/></svg>,
  shield: (p)=> <svg {...p} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2 L4 6 v6 c0 5 3.5 8 8 10 c4.5-2 8-5 8-10 V6 z"/></svg>,
  bell:   (p)=> <svg {...p} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>,
  ruler:  (p)=> <svg {...p} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="8" width="20" height="8" rx="1"/><path d="M6 8v3M10 8v4M14 8v3M18 8v4"/></svg>,
  link:   (p)=> <svg {...p} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>,
  out:    (p)=> <svg {...p} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  chev:   (p)=> <svg {...p} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6"/></svg>,
  search: (p)=> <svg {...p} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></svg>,
  check:  (p)=> <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>,
  spark:  (p)=> <svg {...p} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/></svg>,
};

// ---------- CMDK: Cmd+K command palette ----------
function CmdK({ open, onClose, onAddExercise, onSwitchTab, days }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => { if (open) { setQ(''); setSel(0); setTimeout(()=>inputRef.current?.focus(), 60); } }, [open]);

  // Build searchable items
  const items = useMemo(() => {
    const exs = window.EXERCISES.map(ex => ({
      kind: 'ex', id: ex.id, name: ex.name, type: ex.type,
      sub: `${ex.sets} · ${ex.gear} · ${window.TYPE_LABELS[ex.type].label}`,
      ent: 'Add to today',
    }));
    const tabs = [
      { kind: 'tab', id: 'splits', name: 'Go to Splits', sub: 'Weekly lift planner', ent: '↵' },
      { kind: 'tab', id: 'cardio', name: 'Go to Cardio', sub: 'Run, bike, intervals', ent: '↵' },
      { kind: 'tab', id: 'body', name: 'Go to Body', sub: 'Coverage map', ent: '↵' },
      { kind: 'tab', id: 'schedule', name: 'Go to Schedule', sub: 'Plan the week', ent: '↵' },
      { kind: 'tab', id: 'dashboard', name: 'Go to Dashboard', sub: 'Lifting + cardio + body', ent: '↵' },
      { kind: 'tab', id: 'profile', name: 'Go to Profile', sub: 'Settings', ent: '↵' },
    ];
    return { tabs, exs };
  }, []);

  // filter
  const ql = q.trim().toLowerCase();
  const filteredTabs = ql ? items.tabs.filter(t => t.name.toLowerCase().includes(ql)) : items.tabs;
  const filteredExs = ql
    ? items.exs.filter(e => e.name.toLowerCase().includes(ql) || window.TYPE_LABELS[e.type].label.toLowerCase().includes(ql))
    : items.exs.slice(0, 8);

  const flat = [...filteredTabs.map(x => ({...x, group:'Navigate'})), ...filteredExs.map(x => ({...x, group:'Add to today'}))];

  useEffect(() => { setSel(0); }, [q]);

  const onKey = useCallback((e) => {
    if (!open) return;
    if (e.key === 'Escape') { onClose(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(s+1, flat.length-1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel(s => Math.max(s-1, 0)); }
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

  // Scroll selected into view (without scrollIntoView)
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

  // group rendering
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

// ---------- Sonner-style toaster ----------
function Toaster({ toasts }) {
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.leaving?'leaving':''}`}>
          <span className="t-ico"><I.check/></span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

// ---------- Status bar ----------
function StatusBar({ dark }) {
  return (
    <div className={`statusbar ${dark?'dark':''}`}>
      <span>9:41</span>
      <div className="icons">
        <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="9" width="3" height="3"/><rect x="5" y="6" width="3" height="6"/><rect x="10" y="3" width="3" height="9"/><rect x="15" y="0" width="3" height="12"/></svg>
        <svg width="16" height="12" viewBox="0 0 16 12" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 5a8 8 0 0 1 12 0M4.5 7.5a4.5 4.5 0 0 1 7 0"/><circle cx="8" cy="10" r="1" fill="currentColor"/></svg>
        <svg width="24" height="12" viewBox="0 0 24 12" fill="none"><rect x="1" y="2" width="20" height="8" rx="2" stroke="currentColor"/><rect x="3" y="4" width="14" height="4" fill="currentColor"/><rect x="22" y="4.5" width="1.5" height="3" fill="currentColor"/></svg>
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
            <div className="feature"><div className="dot"><I.splits/></div><div className="text"><div className="t">Drag your week into shape</div><div className="s">7-day grid, swap anything in one tap.</div></div></div>
            <div className="feature"><div className="dot"><I.cover/></div><div className="text"><div className="t">See what you cover</div><div className="s">Tap any muscle for a deep-dive.</div></div></div>
            <div className="feature"><div className="dot"><I.score/></div><div className="text"><div className="t">Track your score</div><div className="s">Real-time grade for your routine.</div></div></div>
          </div>
        </div>
        <div className="bottom">
          <button className="btn green mesh" onClick={() => onStart('signup')}>Get started <I.arrowR/></button>
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
          <div className="field"><div className="label">Email</div><input className="input" type="email" value={email} onChange={(e)=>setEmail(e.target.value)}/></div>
          <div className="field"><div className="label">Password</div><input className="input" type="password" value={pw} onChange={(e)=>setPw(e.target.value)}/></div>
          <button className="btn green mesh" onClick={onSubmit}>{isSignup ? 'Create account' : 'Log in'} <I.arrowR/></button>
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
        <div className="progress-bar"><div className="progress-fill" style={{ width: `${((step+1)/total)*100}%` }}/></div>
        <div className="step-eyebrow mono">Step {step+1} of {total}</div>
        {step === 0 && (<>
          <h2 className="step-q">What sport do you train for?</h2>
          <p className="step-help">Drives muscle priorities. You can change it later.</p>
          <div className="sport-grid">
            {window.SPORTS.map(s => (
              <button key={s.id} className={`sport-card ${sport===s.id?'active':''}`} onClick={()=>setSport(s.id)}>
                <div className="t">{s.label}</div><div className="s">{s.sub}</div>
              </button>
            ))}
          </div>
        </>)}
        {step === 1 && (<>
          <h2 className="step-q">How many days a week can you lift?</h2>
          <p className="step-help">We'll fill the rest with sport, cardio or rest.</p>
          <div className="pill-row">{[2,3,4,5,6].map(n => (<div key={n} className={`day-pill ${days===n?'active':''}`} onClick={()=>setDays(n)}>{n}</div>))}</div>
        </>)}
        {step === 2 && (<>
          <h2 className="step-q">Your stats.</h2>
          <p className="step-help">Used to estimate volume, calories and intensity.</p>
          <div style={{ marginBottom: 24 }}>
            <div className="stat-input-row"><span className="label">Height</span>
              <div className="unit-toggle"><button className={hUnit==='cm'?'active':''} onClick={()=>setHUnit('cm')}>CM</button><button className={hUnit==='ft'?'active':''} onClick={()=>setHUnit('ft')}>FT</button></div>
            </div>
            <div className="big-number-input"><input className="num" type="number" value={height} onChange={(e)=>setHeight(e.target.value)}/><span className="unit">{hUnit}</span></div>
          </div>
          <div style={{ marginBottom: 24 }}>
            <div className="stat-input-row"><span className="label">Weight</span>
              <div className="unit-toggle"><button className={wUnit==='kg'?'active':''} onClick={()=>setWUnit('kg')}>KG</button><button className={wUnit==='lb'?'active':''} onClick={()=>setWUnit('lb')}>LB</button></div>
            </div>
            <div className="big-number-input"><input className="num" type="number" value={weight} onChange={(e)=>setWeight(e.target.value)}/><span className="unit">{wUnit}</span></div>
          </div>
          <div>
            <div className="stat-input-row"><span className="label">Resting pulse <span className="opt-tag">optional</span></span></div>
            <div className="big-number-input"><input className="num" type="number" value={pulse} onChange={(e)=>setPulse(e.target.value)} placeholder="—"/><span className="unit">bpm</span></div>
          </div>
        </>)}
        {step === 3 && (<>
          <h2 className="step-q">You're set.</h2>
          <p className="step-help">Here's what we'll use to seed your week.</p>
          <div style={{ background: 'var(--bg-2)', borderRadius: 16, padding: 18, marginBottom: 14 }}>
            {[['Sport', window.SPORTS.find(s=>s.id===sport)?.label],['Lift days', `${days} / week`],['Height', `${height} ${hUnit}`],['Weight', `${weight} ${wUnit}`], ...(pulse?[['Pulse',`${pulse} bpm`]]:[])].map(([k,v]) => (
              <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0' }}>
                <span className="mono" style={{color:'var(--ink-3)', fontSize:11, letterSpacing:'0.08em', textTransform:'uppercase'}}>{k}</span>
                <span style={{fontWeight:600}}>{v}</span>
              </div>
            ))}
          </div>
        </>)}
        <div className="onboard-foot">
          <button className="btn green mesh" onClick={next}>{step === total-1 ? 'Build my split' : 'Continue'} <I.arrowR/></button>
        </div>
      </div>
    </div>
  );
}

// ---------- SPLITS TAB ----------
function ExerciseRow({ ex, dayIdx, exIdx, onRemove, onDragStartCard, dragging }) {
  const bpColor = `var(--bp-${ex.body || ex.type})`;
  return (
    <div
      className={`ex-row ${dragging?'dragging':''}`}
      style={{ '--bp': bpColor }}
      onMouseDown={(e)=>onDragStartCard(e, dayIdx, exIdx)}
      onTouchStart={(e)=>onDragStartCard(e, dayIdx, exIdx)}
    >
      <div className="handle"><I.drag/></div>
      <div className="body">
        <div className="name">{ex.name}</div>
        <div className="meta">
          <span className="bp-tag">{(window.DAY_TYPES?.[ex.body]?.label) || window.TYPE_LABELS[ex.type]?.label}</span>
          <span>{ex.sets}</span>
          <span className="gear">{ex.gear}</span>
        </div>
      </div>
      <button className="remove" onClick={(e)=>{ e.stopPropagation(); onRemove(dayIdx, exIdx); }}><I.x/></button>
    </div>
  );
}

function DayCard({ day, dayIdx, locked, onToggleLock, onRemove, onAddTap, onDragStartCard, dropActiveIdx, draggingFrom }) {
  const exObjs = day.exIds.map(id => window.EXERCISES.find(e=>e.id===id)).filter(Boolean);
  const totalSets = exObjs.reduce((s,ex)=>s+window.setsForExercise(ex),0);
  const isDropActive = dropActiveIdx === dayIdx;
  const minutes = window.liftMinutesForDay(day);
  const todayJs = new Date().getDay();
  const todayIdx = todayJs === 0 ? 6 : todayJs - 1;
  const isToday = todayIdx === dayIdx;
  return (
    <div data-day-idx={dayIdx} className={`day-card ${locked?'locked':''} ${isDropActive?'drop-active':''} ${day.rest?'day-rest':''}`}>
      <div className="day-card-head">
        <div className="left">
          <span className="day-name">{window.DAY_NAMES[dayIdx]}</span>
          <span className="focus">{day.focus}</span>
          {isToday && <span className="day-today-tag">Today</span>}
        </div>
        <div className="right">
          {!day.rest && exObjs.length > 0 && (<span className="day-meta-pill">{totalSets} sets · {minutes}m</span>)}
          <button className={`day-lock ${locked?'on':''}`} onClick={()=>onToggleLock(dayIdx)}>{locked ? <I.lock/> : <I.unlock/>}</button>
        </div>
      </div>
      {day.rest && day.exIds.length === 0 ? (
        <div className="empty-day">{day.restNote}</div>
      ) : exObjs.length === 0 ? (
        <div className="empty-day">No exercises yet — tap below to add.</div>
      ) : (
        <div className="ex-list">
          {exObjs.map((ex, exIdx) => (
            <ExerciseRow key={`${day.exIds[exIdx]}-${exIdx}`} ex={ex} dayIdx={dayIdx} exIdx={exIdx} onRemove={onRemove} onDragStartCard={onDragStartCard} dragging={draggingFrom && draggingFrom.dayIdx===dayIdx && draggingFrom.exIdx===exIdx}/>
          ))}
        </div>
      )}
      {!day.rest && (<button className="add-mini-btn" onClick={()=>onAddTap(dayIdx)}><I.plus/> Add exercise</button>)}
    </div>
  );
}

// ---------- LIBRARY SHEET ----------
function LibrarySheet({ open, onClose, onAdd, days, defaultDay }) {
  const [filter, setFilter] = useState('all');
  const [q, setQ] = useState('');
  const [targetDay, setTargetDay] = useState(defaultDay ?? 0);
  useEffect(() => { if (open && defaultDay !== undefined && defaultDay !== null) setTargetDay(defaultDay); }, [open, defaultDay]);
  const filtered = window.EXERCISES.filter(ex => {
    if (filter !== 'all' && ex.body !== filter) return false;
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
          <p className="sheet-sub">Tap to add. Color = lift type.</p>
          <input className="sheet-search" placeholder="Search exercises…" value={q} onChange={(e)=>setQ(e.target.value)}/>
          <div className="day-target-prompt"><span className="b">Adding to:</span> {window.DAY_NAMES[targetDay]} · {targetDayObj?.focus || 'Rest'}</div>
          <div className="day-picker-row">
            {window.DAY_NAMES.map((d, i) => (<button key={i} className={targetDay===i?'active':''} onClick={()=>setTargetDay(i)}>{d}</button>))}
          </div>
          <div className="chip-row">
            {window.FILTER_CHIPS.map(c => {
              const bpColor = c.id === 'all' ? 'var(--ink-2)' : `var(--bp-${c.id})`;
              const cnt = c.id === 'all'
                ? window.EXERCISES.length
                : window.EXERCISES.filter(e => e.body === c.id).length;
              return (
                <button key={c.id} className={`chip ${filter===c.id?'active':''}`}
                  style={{ '--bp': bpColor }}
                  onClick={()=>setFilter(c.id)}>
                  {c.label}<span className="count">{cnt}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="sheet-body">
          {filtered.map(ex => {
            const bpColor = `var(--bp-${ex.body || ex.type})`;
            const bpLabel = (window.DAY_TYPES?.[ex.body]?.label) || window.TYPE_LABELS[ex.type]?.label;
            return (
              <div key={ex.id} className="lib-row" style={{ '--bp': bpColor }} onClick={()=>onAdd(ex.id, targetDay)}>
                <div className="body">
                  <div className="name">{ex.name}</div>
                  <div className="meta">
                    <span className="bp-tag">{bpLabel}</span>
                    <span>{ex.sets}</span>
                    <span>· {ex.gear}</span>
                  </div>
                </div>
                <button className="add"><I.plus/></button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ---------- COVERAGE PANEL (clickable + zoom + exercise list) ----------
function CoveragePanel({ open, onClose, days, onAddExercise }) {
  const [view, setView] = useState('front');
  const [recently, setRecently] = useState(null);
  const [focused, setFocused] = useState(null);
  const sets = useMemo(()=>window.computeCoverageV2(days), [days]);

  const onRegion = (key) => {
    setRecently(key);
    setFocused(key);
    setTimeout(()=>setRecently(null), 800);
  };

  const closeFocus = () => setFocused(null);

  // When open changes, reset focus
  useEffect(() => { if (!open) { setFocused(null); setView('front'); } }, [open]);

  const focusedExercises = focused ? window.exercisesForMuscle(focused).slice(0, 8) : [];
  const focusedSets = focused ? (sets[focused] || 0) : 0;
  const focusedTarget = focused ? window.TARGETS_V2[focused] : null;

  return (
    <div className={`coverage-panel ${open?'open':''}`}>
      <StatusBar dark/>
      <div className="cov-head">
        <div>
          <div className="title">{focused ? window.MUSCLE_LABELS_V2[focused] : 'Coverage'}</div>
          <div className="sub">{focused ? 'Tap body to switch · zoom-out below' : 'This week · tap any muscle'}</div>
        </div>
        <button className="cov-close" onClick={onClose}><I.x/></button>
      </div>

      <div className="cov-toggles">
        <div className="cov-seg">
          <button className={view==='front'?'active':''} onClick={()=>setView('front')}>Front</button>
          <button className={view==='back'?'active':''} onClick={()=>setView('back')}>Back</button>
        </div>
        {focused && (
          <button className="cov-close" onClick={closeFocus} title="Zoom out" style={{background: 'var(--green)', color: 'var(--shell-bg)'}}>
            <I.zoomOut/>
          </button>
        )}
      </div>

      <div className="cov-legend">
        <span>none</span>
        <div className="legend-bar">
          <span style={{background:'#1B1F3D'}}/>
          <span style={{background:'#2A2E63'}}/>
          <span style={{background:'#5151C7'}}/>
          <span style={{background:'#8C8CFF'}}/>
          <span style={{background:'#C09BFF'}}/>
        </div>
        <span>over</span>
      </div>

      <div className="body-stage">
        <window.Anatomy3D sets={sets} view={view} recently={recently} focused={focused} onRegion={onRegion}/>
        {!focused && <div className="rotate-hint">tap front · back to rotate · tap a muscle to dive in</div>}
      </div>

      {focused ? (
        <div className="muscle-detail">
          <div className="md-head">
            <div>
              <h3>{window.MUSCLE_LABELS_V2[focused]}</h3>
              <div className="sub">Weekly load</div>
            </div>
            <button className="cov-close" onClick={closeFocus} style={{background:'var(--bg-2)', color:'var(--ink)'}}><I.x/></button>
          </div>
          <div className="md-stat-row">
            <div className="md-stat"><span className="k">This week</span><span className="v">{focusedSets} <span style={{fontSize:11,color:'var(--ink-3)',fontWeight:500}}>sets</span></span></div>
            <div className="md-stat"><span className="k">Target</span><span className="v" style={{fontSize:14,paddingTop:6}}>{focusedTarget.min}–{focusedTarget.max}</span></div>
            <div className="md-stat"><span className="k">Status</span><span className="v" style={{fontSize:14,paddingTop:6}}>
              {focusedSets < focusedTarget.min ? <span style={{color:'#E63946'}}>Under</span> :
               focusedSets > focusedTarget.max ? <span style={{color:'#8A5A14'}}>Over</span> :
               <span style={{color:'var(--green-deep)'}}>Optimal</span>}
            </span></div>
          </div>
          <div className="md-section-title">Best exercises for this</div>
          {focusedExercises.map(({ex}) => (
            <div key={ex.id} className={`md-ex-row t-${ex.type}`}>
              <div className="nm">{ex.name}</div>
              <span className="ms">{ex.sets} · {ex.gear}</span>
              <button className="add-here" onClick={()=>onAddExercise(ex.id)} title="Add to today"><I.plus/></button>
            </div>
          ))}
          {focusedExercises.length === 0 && <div style={{color:'var(--ink-3)',fontSize:13,padding:'12px 0'}}>No specific exercises mapped yet.</div>}
        </div>
      ) : (
        <div className="cov-summary">
          <h3>Per group · weekly sets</h3>
          <div className="cov-list">
            {Object.keys(window.MUSCLE_LABELS_V2).slice(0,9).map(k => {
              const s = sets[k] || 0;
              const t = window.TARGETS_V2[k];
              const status = s < t.min ? 'under' : s > t.max ? 'over' : 'optimal';
              return (
                <div key={k} className="cov-item" onClick={()=>setFocused(k)}>
                  <span className="name">{window.MUSCLE_LABELS_V2[k]}</span>
                  <span className="sets mono">{s}</span>
                  <span className={`badge ${status}`}>{status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- CARDIO TAB ----------
function CardioPage({ cardioDays, setCardioDays, onOpenCardioSheet }) {
  const totalMin = window.totalCardioMinutes(cardioDays);
  const totalMi = window.totalCardioMiles(cardioDays);
  const totalKcal = window.totalCardioKcal(cardioDays);

  const removeItem = (dayIdx, itemIdx) => {
    setCardioDays(prev => {
      const next = prev.map(d => ({ items: [...d.items] }));
      next[dayIdx].items.splice(itemIdx, 1);
      return next;
    });
  };

  return (
    <div className="tab-pane">
      <div style={{padding:'0 20px 12px', display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8}}>
        <div className="stat-tile" style={{padding:'10px 12px'}}>
          <span className="lbl">Time</span>
          <span className="val">{totalMin}<span className="u">min</span></span>
        </div>
        <div className="stat-tile" style={{padding:'10px 12px'}}>
          <span className="lbl">Distance</span>
          <span className="val">{totalMi}<span className="u">mi</span></span>
        </div>
        <div className="stat-tile" style={{padding:'10px 12px'}}>
          <span className="lbl">Burn</span>
          <span className="val">{totalKcal}<span className="u">kcal</span></span>
        </div>
      </div>

      <div className="cardio-stack">
        {cardioDays.map((d, idx) => (
          <div key={idx} className="day-card-cardio">
            <div className="day-card-head">
              <div className="left">
                <span className="day-name">{window.DAY_NAMES[idx]}</span>
                <span className="focus">{d.items.length === 0 ? 'No cardio' : `${d.items.length} session${d.items.length>1?'s':''}`}</span>
              </div>
              <span className="day-meta-pill">
                {d.items.reduce((s,id)=>s+(window.cardioFor(id)?.dur||0),0)}m
              </span>
            </div>
            {d.items.length === 0 ? (
              <div className="empty-day">No cardio scheduled.</div>
            ) : (
              <div className="ex-list">
                {d.items.map((id, i) => {
                  const c = window.cardioFor(id);
                  if (!c) return null;
                  const t = window.CARDIO_TYPES[c.type];
                  return (
                    <div key={i} className="cardio-row" style={{'--bar': t.color}}>
                      <div style={{position:'absolute', left:0, top:8, bottom:8, width:4, borderRadius:2, background:t.color}}/>
                      <div className="body">
                        <div className="name">{c.name}</div>
                        <div className="meta">
                          <span>{c.dur} min</span>
                          {c.dist > 0 && <span>{c.dist} {c.unit}</span>}
                          <span>· {t.label}</span>
                        </div>
                      </div>
                      <button className="remove" onClick={()=>removeItem(idx, i)}><I.x/></button>
                    </div>
                  );
                })}
              </div>
            )}
            <button className="add-mini-btn" onClick={()=>onOpenCardioSheet(idx)}><I.plus/> Add cardio</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function CardioSheet({ open, onClose, onAdd, defaultDay, cardioDays }) {
  const [targetDay, setTargetDay] = useState(defaultDay ?? 0);
  const [filter, setFilter] = useState('all');
  useEffect(() => { if (open && defaultDay !== undefined) setTargetDay(defaultDay); }, [open, defaultDay]);
  const filtered = window.CARDIO_LIBRARY.filter(c => filter==='all' || c.type === filter);
  const types = [{id:'all',label:'All'},...Object.entries(window.CARDIO_TYPES).map(([id,v])=>({id,label:v.label}))];
  return (
    <>
      <div className={`sheet-overlay ${open?'open':''}`} onClick={onClose}/>
      <div className={`sheet ${open?'open':''}`}>
        <div className="sheet-handle"/>
        <div className="sheet-head">
          <h2 className="sheet-title">Cardio library</h2>
          <p className="sheet-sub">Pick a session for any day.</p>
          <div className="day-target-prompt"><span className="b">Adding to:</span> {window.DAY_NAMES[targetDay]}</div>
          <div className="day-picker-row">
            {window.DAY_NAMES.map((d, i) => (<button key={i} className={targetDay===i?'active':''} onClick={()=>setTargetDay(i)}>{d}</button>))}
          </div>
          <div className="chip-row">
            {types.map(t => {
              const c = t.id === 'all' ? 'var(--ink-2)' : (window.CARDIO_TYPES[t.id]?.color || 'var(--ink-2)');
              const cnt = t.id === 'all'
                ? window.CARDIO_LIBRARY.length
                : window.CARDIO_LIBRARY.filter(x => x.type === t.id).length;
              return (
                <button key={t.id} className={`chip ${filter===t.id?'active':''}`}
                  style={{ '--bp': c }}
                  onClick={()=>setFilter(t.id)}>
                  {t.label}<span className="count">{cnt}</span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="sheet-body">
          {filtered.map(c => {
            const t = window.CARDIO_TYPES[c.type];
            return (
              <div key={c.id} className="lib-row" style={{ '--bp': t.color }} onClick={()=>onAdd(c.id, targetDay)}>
                <div className="body">
                  <div className="name">{c.name}</div>
                  <div className="meta">
                    <span className="bp-tag">{t.label}</span>
                    <span>{c.dur} min{c.dist>0 ? ` · ${c.dist} ${c.unit}` : ''}</span>
                  </div>
                </div>
                <button className="add"><I.plus/></button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ---------- SCORE TAB ----------
function ScoreRing({ value, size=110, stroke=10 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value)) / 100;
  const dash = c * pct;
  const [animV, setAnimV] = useState(0);
  useEffect(() => { const t = setTimeout(()=>setAnimV(value), 80); return ()=>clearTimeout(t); }, [value]);
  const animDash = c * (animV/100);
  return (
    <div className="score-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--green)" strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${animDash} ${c}`}
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ transition: 'stroke-dasharray 1200ms cubic-bezier(0.32,0.72,0,1)' }}
        />
      </svg>
      <div className="score-num">{Math.round(animV)}</div>
    </div>
  );
}

function ScorePage({ days, cardioDays, profile }) {
  const score = useMemo(()=>window.computeScore(days, cardioDays, profile), [days, cardioDays, profile]);
  const liftMin = window.totalLiftMinutes(days);
  const cardioMin = window.totalCardioMinutes(cardioDays);
  const totalMin = liftMin + cardioMin;
  const liftKcal = window.totalLiftKcal(days);
  const cardioKcal = window.totalCardioKcal(cardioDays);
  const trainingKcal = liftKcal + cardioKcal;
  const dailyKcal = window.dailyKcalNeed(profile, trainingKcal);
  const bmr = window.estimateBMR(profile);

  const grade = score.score >= 85 ? 'Excellent' : score.score >= 70 ? 'Solid' : score.score >= 55 ? 'Decent' : 'Needs work';
  const gradeNote = score.score >= 85 ? 'Locked-in. Keep this rhythm.' :
                     score.score >= 70 ? 'Good plan, small gaps to plug.' :
                     score.score >= 55 ? 'Half there. Add balance and time.' :
                     'Plenty of room — start with adherence.';

  // Per-day minutes for chart
  const maxMin = Math.max(...days.map((_,i) => (window.liftMinutesForDay(days[i])+(cardioDays[i].items.reduce((s,id)=>s+(window.cardioFor(id)?.dur||0),0)))), 60);

  return (
    <div className="tab-pane score-page">
      <div className="score-hero">
        <div className="label">Health score · this week</div>
        <div className="score-row">
          <ScoreRing value={score.score}/>
          <div className="score-text">
            <div className="grade">{grade}</div>
            <div className="grade-sub">{gradeNote}</div>
          </div>
        </div>
        <div className="score-bars">
          {[
            ['Adherence', score.adherence],
            ['Coverage balance', score.balance],
            ['Cardio', score.cardioOK],
            ['Time investment', score.timeScore],
          ].map(([k,v], i) => (
            <div key={k} className="score-bar">
              <div className="lbl-row"><span>{k}</span><span>{Math.round(v*100)}%</span></div>
              <div className="track"><div className="fill" style={{width:`${v*100}%`, transitionDelay:`${i*120+200}ms`}}/></div>
            </div>
          ))}
        </div>
      </div>

      <div className="tile-grid">
        <div className="stat-tile">
          <div className="head"><span className="lbl">Daily calories</span><span className="ico"><I.fire/></span></div>
          <div className="val">{dailyKcal}<span className="u">kcal</span></div>
          <div className="sub">BMR {bmr} + activity</div>
        </div>
        <div className="stat-tile">
          <div className="head"><span className="lbl">Weekly burn</span><span className="ico"><I.fire/></span></div>
          <div className="val">{trainingKcal}<span className="u">kcal</span></div>
          <div className="sub">Lift {liftKcal} · Cardio {cardioKcal}</div>
        </div>
        <div className="stat-tile">
          <div className="head"><span className="lbl">Weekly time</span><span className="ico"><I.clock/></span></div>
          <div className="val">{Math.round(totalMin/60*10)/10}<span className="u">hr</span></div>
          <div className="sub">{totalMin} min total</div>
        </div>
        <div className="stat-tile">
          <div className="head"><span className="lbl">Daily avg</span><span className="ico"><I.clock/></span></div>
          <div className="val">{Math.round(totalMin/7)}<span className="u">min</span></div>
          <div className="sub">across the week</div>
        </div>

        <div className="stat-tile full">
          <div className="head"><span className="lbl">Time per day</span><span className="ico"><I.trend/></span></div>
          <div className="timebars">
            {days.map((d, i) => {
              const lm = window.liftMinutesForDay(d);
              const cm = cardioDays[i].items.reduce((s,id)=>s+(window.cardioFor(id)?.dur||0),0);
              const tot = lm + cm;
              const h = (tot / maxMin) * 80;
              return (
                <div key={i} className="timebar">
                  <div className="bar" style={{height: Math.max(4, h)}}>
                    {cm > 0 && <div className="cardio" style={{height: `${(cm/tot)*100}%`}}/>}
                    {lm > 0 && <div className="lift" style={{height: `${(lm/tot)*100}%`}}/>}
                  </div>
                  <div className="lbl">{window.DAY_NAMES[i].slice(0,1)}</div>
                </div>
              );
            })}
          </div>
          <div className="legend-inline"><span><span className="swatch" style={{background:'var(--green)'}}/>Lift</span><span><span className="swatch" style={{background:'var(--t-cardio)'}}/>Cardio</span></div>
        </div>

        <div className="stat-tile full">
          <div className="head"><span className="lbl">Health benefits this week</span><span className="ico" style={{color:'var(--green)'}}><I.shield/></span></div>
          <div style={{display:'flex', flexDirection:'column', gap:6, fontSize:13, color:'var(--ink-2)', marginTop:4}}>
            <div>· {Math.round(cardioMin)} min Z2/HIIT — heart-rate adaptations</div>
            <div>· {Math.round(score.inBand)}/{score.total} muscle groups in optimal range</div>
            <div>· ~{trainingKcal} kcal expenditure beyond BMR</div>
            <div>· {Math.round(score.hours*10)/10}h training load — sustainable zone</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- PROFILE TAB ----------
function ProfilePage({ profile, theme, setTheme, onLogout }) {
  const [units, setUnits] = useState({ metric: profile.hUnit==='cm' });
  const [notif, setNotif] = useState(true);
  const [share, setShare] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  return (
    <div className="tab-pane profile-page">
      <div className="profile-card">
        <div className="avatar-lg">A</div>
        <div>
          <div className="name">Alex Rivera</div>
          <div className="em mono">alex@splitlift.app</div>
        </div>
      </div>

      <div className="settings-section">
        <div className="head">Appearance</div>
        <div className="settings-list">
          <div className="settings-row">
            <span className="ico">{theme==='dark' ? <I.moon/> : <I.sun/>}</span>
            <div className="body"><div className="lbl">Dark mode</div><div className="sub">Easier on the eyes at night.</div></div>
            <button className={`switch ${theme==='dark'?'on':''}`} onClick={()=>setTheme(theme==='dark'?'light':'dark')}/>
          </div>
          <div className="settings-row">
            <span className="ico"><I.ruler/></span>
            <div className="body"><div className="lbl">Units</div><div className="sub">Metric or imperial.</div></div>
            <span className="right">{units.metric ? 'Metric' : 'Imperial'}</span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="head">Notifications</div>
        <div className="settings-list">
          <div className="settings-row">
            <span className="ico"><I.bell/></span>
            <div className="body"><div className="lbl">Workout reminders</div><div className="sub">Push 30m before your scheduled lift.</div></div>
            <button className={`switch ${notif?'on':''}`} onClick={()=>setNotif(!notif)}/>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="head">Privacy</div>
        <div className="settings-list">
          <div className="settings-row">
            <span className="ico"><I.shield/></span>
            <div className="body"><div className="lbl">Anonymous analytics</div><div className="sub">Help improve recommendations.</div></div>
            <button className={`switch ${analytics?'on':''}`} onClick={()=>setAnalytics(!analytics)}/>
          </div>
          <div className="settings-row">
            <span className="ico"><I.link/></span>
            <div className="body"><div className="lbl">Share progress</div><div className="sub">Public profile link.</div></div>
            <button className={`switch ${share?'on':''}`} onClick={()=>setShare(!share)}/>
          </div>
          <div className="settings-row">
            <span className="ico"><I.shield/></span>
            <div className="body"><div className="lbl">Data export</div><div className="sub">Download everything as JSON.</div></div>
            <span className="right"><I.chev/></span>
          </div>
          <div className="settings-row">
            <span className="ico" style={{color:'#E63946'}}><I.x/></span>
            <div className="body"><div className="lbl" style={{color:'#E63946'}}>Delete account</div><div className="sub">Permanent. Removes all data.</div></div>
            <span className="right"><I.chev/></span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <div className="head">Account</div>
        <div className="settings-list">
          <div className="settings-row" onClick={onLogout}>
            <span className="ico"><I.out/></span>
            <div className="body"><div className="lbl">Log out</div></div>
            <span className="right"><I.chev/></span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- BODY TAB (inline section, replaces side panel) ----------
function BodyTab({ days, onAddExercise }) {
  const [view, setView] = useState('front');
  const [recently, setRecently] = useState(null);
  const [focused, setFocused] = useState(null);
  const sets = useMemo(()=>window.computeCoverageV2(days), [days]);

  const onRegion = (key) => {
    setRecently(key);
    setFocused(key);
    setTimeout(()=>setRecently(null), 800);
  };
  const closeFocus = () => setFocused(null);

  const focusedExercises = focused ? window.exercisesForMuscle(focused).slice(0, 8) : [];
  const focusedSets = focused ? (sets[focused] || 0) : 0;
  const focusedTarget = focused ? window.TARGETS_V2[focused] : null;

  return (
    <div className="tab-pane body-tab">
      <div className="cov-toggles">
        <div className="cov-seg" style={{background:'var(--bg-2)'}}>
          <button className={view==='front'?'active':''} onClick={()=>setView('front')} style={{color: view==='front'?'#002914':'var(--ink-3)'}}>Front</button>
          <button className={view==='back'?'active':''} onClick={()=>setView('back')} style={{color: view==='back'?'#002914':'var(--ink-3)'}}>Back</button>
        </div>
        {focused && (
          <button className="icon-btn" onClick={closeFocus} title="Zoom out"><I.zoomOut/></button>
        )}
      </div>

      <div className="body-stage-inline">
        <window.Anatomy3D sets={sets} view={view} recently={recently} focused={focused} onRegion={onRegion}/>
      </div>

      <div className="cov-legend">
        <span>none</span>
        <div className="legend-bar">
          <span style={{background:'#1B1F3D'}}/>
          <span style={{background:'#2A2E63'}}/>
          <span style={{background:'#5151C7'}}/>
          <span style={{background:'#8C8CFF'}}/>
          <span style={{background:'#C09BFF'}}/>
        </div>
        <span>over</span>
      </div>

      {focused ? (
        <div className="muscle-detail">
          <div className="md-head">
            <div>
              <h3>{window.MUSCLE_LABELS_V2[focused]}</h3>
              <div className="sub">Weekly load</div>
            </div>
            <button className="icon-btn" onClick={closeFocus}><I.x/></button>
          </div>
          <div className="md-stat-row">
            <div className="md-stat"><span className="k">This week</span><span className="v">{focusedSets} <span style={{fontSize:11,color:'var(--ink-3)',fontWeight:500}}>sets</span></span></div>
            <div className="md-stat"><span className="k">Target</span><span className="v" style={{fontSize:14,paddingTop:6}}>{focusedTarget.min}–{focusedTarget.max}</span></div>
            <div className="md-stat"><span className="k">Status</span><span className="v" style={{fontSize:14,paddingTop:6}}>
              {focusedSets < focusedTarget.min ? <span style={{color:'#E63946'}}>Under</span> :
               focusedSets > focusedTarget.max ? <span style={{color:'#8A5A14'}}>Over</span> :
               <span style={{color:'var(--green-deep)'}}>Optimal</span>}
            </span></div>
          </div>
          <div className="md-section-title">Best exercises for this</div>
          {focusedExercises.map(({ex}) => (
            <div key={ex.id} className={`md-ex-row t-${ex.type}`}>
              <div className="nm">{ex.name}</div>
              <span className="ms">{ex.sets} · {ex.gear}</span>
              <button className="add-here" onClick={()=>onAddExercise(ex.id)} title="Add to today"><I.plus/></button>
            </div>
          ))}
          {focusedExercises.length === 0 && <div style={{color:'var(--ink-3)',fontSize:13,padding:'12px 0'}}>No specific exercises mapped yet.</div>}
        </div>
      ) : (
        <div className="cov-summary">
          <h3>Per group · weekly sets</h3>
          <div className="cov-list">
            {Object.keys(window.MUSCLE_LABELS_V2).slice(0,9).map(k => {
              const s = sets[k] || 0;
              const t = window.TARGETS_V2[k];
              const status = s < t.min ? 'under' : s > t.max ? 'over' : 'optimal';
              return (
                <div key={k} className="cov-item" onClick={()=>setFocused(k)}>
                  <span className="name">{window.MUSCLE_LABELS_V2[k]}</span>
                  <span className="sets mono">{s}</span>
                  <span className={`badge ${status}`}>{status}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------- MAIN APP ----------
function MainApp({ profile, setProfile, theme, setTheme, onLogout }) {
  const [days, setDays] = useState(window.INITIAL_DAYS);
  const [cardioDays, setCardioDays] = useState(window.INITIAL_CARDIO_DAYS);
  const [locked, setLocked] = useState([false,true,false,false,false,true,false]);
  const [tab, setTab] = useState('splits');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDay, setSheetDay] = useState(0);
  const [cardioSheetOpen, setCardioSheetOpen] = useState(false);
  const [cardioSheetDay, setCardioSheetDay] = useState(0);
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
  const [drag, setDrag] = useState(null);
  const [dropDayIdx, setDropDayIdx] = useState(null);
  const screenBodyRef = useRef(null);

  const showToast = (msg) => {
    const id = ++toastIdRef.current;
    setToasts(prev => [...prev.slice(-2), { id, msg, leaving: false }]);
    setTimeout(() => setToasts(prev => prev.map(t => t.id===id ? {...t, leaving:true} : t)), 2200);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2500);
  };
  const fireConfettiAt = () => fireConfetti(screenBodyRef.current);

  // ⌘K shortcut
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setCmdkOpen(o => !o);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Confetti when Score tab is opened with excellent grade
  const scoreFiredRef = useRef(false);
  useEffect(() => {
    if (tab !== 'dashboard') return;
    const sc = window.computeScore(days, cardioDays, profile).score;
    if (sc >= 85 && !scoreFiredRef.current) {
      scoreFiredRef.current = true;
      setTimeout(fireConfettiAt, 320);
      showToast('Excellent week — keep it up');
    }
    if (sc < 80) scoreFiredRef.current = false;
  }, [tab, days, cardioDays, profile]);

  // ---- Drag handlers ----
  const onDragStartCard = (e, dayIdx, exIdx) => {
    if (e.button === 2) return;
    const ex = window.EXERCISES.find(x => x.id === days[dayIdx].exIds[exIdx]);
    if (!ex) return;
    const isTouch = e.touches !== undefined;
    const px = isTouch ? e.touches[0].clientX : e.clientX;
    const py = isTouch ? e.touches[0].clientY : e.clientY;
    const rect = e.currentTarget.getBoundingClientRect();
    const startCard = e.currentTarget;
    const startDrag = () => {
      startCard.classList.remove('lp-arming');
      startCard.classList.add('lp-armed');
      if (navigator.vibrate) navigator.vibrate(15);
      setDrag({ exId: ex.id, fromDay: dayIdx, fromExIdx: exIdx, x: px, y: py, offX: px - rect.left, offY: py - rect.top, w: rect.width, h: rect.height, ghost: { name: ex.name, type: ex.type, sets: ex.sets, gear: ex.gear }});
    };
    if (isTouch) {
      startCard.classList.add('lp-arming');
      const lpTimer = setTimeout(startDrag, 220);
      const cancelLP = (ev) => {
        const tx = ev.touches?.[0]?.clientX ?? ev.changedTouches?.[0]?.clientX ?? px;
        const ty = ev.touches?.[0]?.clientY ?? ev.changedTouches?.[0]?.clientY ?? py;
        if (Math.abs(tx-px) > 10 || Math.abs(ty-py) > 10) {
          clearTimeout(lpTimer);
          startCard.classList.remove('lp-arming');
          window.removeEventListener('touchmove', cancelLP);
          window.removeEventListener('touchend', cancelLP);
        }
      };
      window.addEventListener('touchmove', cancelLP, { passive: true });
      window.addEventListener('touchend', () => { clearTimeout(lpTimer); startCard.classList.remove('lp-arming'); }, { once: true });
    } else {
      startDrag();
      e.preventDefault();
    }
  };

  useEffect(() => {
    if (!drag) return;
    const move = (e) => {
      const isTouch = e.touches !== undefined;
      const px = isTouch ? e.touches[0].clientX : e.clientX;
      const py = isTouch ? e.touches[0].clientY : e.clientY;
      const el = document.elementFromPoint(px, py);
      const dayEl = el && el.closest && el.closest('[data-day-idx]');
      const idx = dayEl ? parseInt(dayEl.getAttribute('data-day-idx'), 10) : null;
      setDrag(d => d ? { ...d, x: px, y: py } : null);
      setDropDayIdx(idx);
      if (isTouch) e.preventDefault();
    };
    const up = () => {
      if (drag && dropDayIdx !== null && dropDayIdx !== drag.fromDay) {
        setDays(prev => {
          const next = prev.map(d => ({...d, exIds: [...d.exIds]}));
          next[drag.fromDay].exIds.splice(drag.fromExIdx, 1);
          if (next[dropDayIdx].rest) next[dropDayIdx] = { ...next[dropDayIdx], rest: false, exIds:[drag.exId], focus: 'Custom' };
          else next[dropDayIdx].exIds.push(drag.exId);
          return next;
        });
      }
      setDrag(null); setDropDayIdx(null);
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
    setDays(prev => { const n = prev.map(d => ({...d, exIds: [...d.exIds]})); n[dayIdx].exIds.splice(exIdx, 1); return n; });
  };
  const toggleLock = (dayIdx) => setLocked(prev => prev.map((v,i)=>i===dayIdx?!v:v));
  const regenerate = () => {
    setDays(prev => prev.map((d,i) => locked[i] ? d : { ...window.INITIAL_DAYS[i] }));
    showToast('Split regenerated');
  };
  const openSheet = (dayIdx) => { setSheetDay(dayIdx); setSheetOpen(true); };
  const addExerciseToDay = (exId, dayIdx) => {
    setDays(prev => {
      const n = prev.map(d => ({...d, exIds: [...d.exIds]}));
      const wasEmpty = n[dayIdx].exIds.length === 0 || n[dayIdx].rest;
      if (n[dayIdx].rest) n[dayIdx] = { ...n[dayIdx], rest: false, exIds: [exId], focus: 'Custom' };
      else n[dayIdx].exIds.push(exId);
      // milestone: when this brings the week up to 5+ planned days
      const planned = n.filter(d => !d.rest && d.exIds.length > 0).length;
      if (wasEmpty && planned >= 5) setTimeout(fireConfettiAt, 80);
      return n;
    });
    showToast(`Added to ${window.DAY_NAMES[dayIdx]}`);
  };
  const addToToday = (exId) => {
    const today = new Date().getDay();
    const idx = today === 0 ? 6 : today - 1;
    addExerciseToDay(exId, idx);
  };
  const openCardioSheet = (dayIdx) => { setCardioSheetDay(dayIdx); setCardioSheetOpen(true); };
  const addCardioToDay = (cId, dayIdx) => {
    setCardioDays(prev => {
      const n = prev.map(d => ({ items: [...d.items] }));
      n[dayIdx].items.push(cId);
      return n;
    });
    showToast(`Added to ${window.DAY_NAMES[dayIdx]}`);
  };

  const sportLabel = window.SPORTS.find(s => s.id === profile.sport)?.label || 'General';
  const totalLiftDays = days.filter(d => !d.rest).length;

  return (
    <div className="app-screen">
      <StatusBar/>
      <div className="app-header-mini">
        <div className="left">
          <div className="logo-mini" title="SplitLift">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M6.5 8v8M3 10v4M17.5 8v8M21 10v4M6.5 12h11"/></svg>
          </div>
          <div className="title-block">
            <div className="h-title">{tab === 'splits' ? 'Your week' : tab==='schedule'?'Schedule':tab==='cardio'?'Cardio':tab==='dashboard'?'Dashboard':tab==='profile'?'Profile':'Body'}</div>
            <div className="h-sub mono">{sportLabel.toUpperCase()} · {totalLiftDays} LIFT · {7-totalLiftDays} OFF</div>
          </div>
        </div>
        <div className="right">
          <button className="icon-btn ghost" onClick={()=>setCmdkOpen(true)} title="Search ⌘K"><I.search/></button>
          <button className="icon-btn ghost" onClick={()=>setTheme(theme==='dark'?'light':'dark')} title="Theme">
            {theme === 'dark' ? <I.sun/> : <I.moon/>}
          </button>
          <div className="avatar-mini" onClick={()=>setTab('profile')}>A</div>
        </div>
      </div>

      <div className="screen-body" style={{position:'relative'}} ref={screenBodyRef}>
        {tab === 'splits' && (
          <div className="tab-pane">
            <div className="splits-toolbar">
              <button className="cmdk-trigger" onClick={()=>setCmdkOpen(true)}>
                <span className="ico"><I.search/></span>
                <span className="lbl">Search exercises…</span>
                <span className="kbd">⌘K</span>
              </button>
              <button className="icon-btn" onClick={regenerate} title="Regenerate split"><I.refresh/></button>
            </div>
            <div className="week-stack">
              {days.map((day, idx) => (
                <DayCard key={idx} day={day} dayIdx={idx} locked={locked[idx]} onToggleLock={toggleLock} onRemove={removeExercise} onAddTap={openSheet} onDragStartCard={onDragStartCard} dropActiveIdx={dropDayIdx} draggingFrom={drag ? { dayIdx: drag.fromDay, exIdx: drag.fromExIdx } : null}/>
              ))}
            </div>
            <button className="lib-sheet-trigger" onClick={()=>openSheet(0)}>
              <span className="l">Open exercise library</span>
              <span className="c mono">{window.EXERCISES.length}</span>
              <I.arrowR className="arrow"/>
            </button>
          </div>
        )}
        {tab === 'schedule' && <window.ScheduleTab days={days} setDays={setDays} locked={locked} setLocked={setLocked} profile={profile} showToast={showToast} onJumpToSplits={()=>setTab('splits')}/>}
        {tab === 'body' && (window.BodyTabV2 ? <window.BodyTabV2 days={days} onAddExercise={addToToday} setTab={setTab}/> : <BodyTab days={days} onAddExercise={addToToday}/>)}
        {tab === 'cardio' && (window.CardioPageV2 ? <window.CardioPageV2 cardioDays={cardioDays} setCardioDays={setCardioDays} onOpenCardioSheet={openCardioSheet}/> : <CardioPage cardioDays={cardioDays} setCardioDays={setCardioDays} onOpenCardioSheet={openCardioSheet}/>)}
        {tab === 'dashboard' && <window.DashboardPage days={days} cardioDays={cardioDays} profile={profile} setTab={setTab}/>}
        {tab === 'profile' && (window.ProfileV2 ? <window.ProfileV2 profile={profile} setProfile={setProfile} theme={theme} setTheme={setTheme} onLogout={onLogout}/> : <ProfilePage profile={profile} theme={theme} setTheme={setTheme} onLogout={onLogout}/>)}

        {tab === 'splits' && (
          <button className="cov-tab" onClick={()=>setTab('body')}><span>See coverage</span></button>
        )}

        <Toaster toasts={toasts}/>

        {drag && (
          <div style={{ position:'fixed', left:drag.x-drag.offX, top:drag.y-drag.offY, width:drag.w, pointerEvents:'none', zIndex:1000, opacity:0.95 }}>
            <div className="ex-row dragging" style={{margin:0, '--bp': `var(--bp-${drag.ghost.body || drag.ghost.type})`}}>
              <div className="handle"><I.drag/></div>
              <div className="body"><div className="name">{drag.ghost.name}</div><div className="meta"><span>{drag.ghost.sets}</span><span className="gear">{drag.ghost.gear}</span></div></div>
            </div>
          </div>
        )}
      </div>

      <div className="bottom-nav">
        <div className="bn-track">
          <div className="bn-pill" style={{
            transform: `translateX(${Math.max(0, ['schedule','splits','cardio','body','dashboard'].indexOf(tab)) * 100}%)`,
            opacity: ['schedule','splits','cardio','body','dashboard'].indexOf(tab) === -1 ? 0 : 1,
          }}/>
          <button className={`bn-item ${tab==='schedule'?'active':''}`} onClick={()=>setTab('schedule')}><I.cal/><span className="lbl">Schedule</span></button>
          <button className={`bn-item ${tab==='splits'?'active':''}`} onClick={()=>setTab('splits')}><I.dumbbell/><span className="lbl">Splits</span></button>
          <button className={`bn-item ${tab==='cardio'?'active':''}`} onClick={()=>setTab('cardio')}><I.cardio/><span className="lbl">Cardio</span></button>
          <button className={`bn-item ${tab==='body'?'active':''}`} onClick={()=>setTab('body')}><I.cover/><span className="lbl">Body</span></button>
          <button className={`bn-item ${tab==='dashboard'?'active':''}`} onClick={()=>setTab('dashboard')}><I.score/><span className="lbl">Dashboard</span></button>
        </div>
      </div>

      <LibrarySheet open={sheetOpen} onClose={()=>setSheetOpen(false)} onAdd={(exId, dayIdx)=>addExerciseToDay(exId, dayIdx)} days={days} defaultDay={sheetDay}/>
      <CardioSheet open={cardioSheetOpen} onClose={()=>setCardioSheetOpen(false)} onAdd={(cId, dayIdx)=>addCardioToDay(cId, dayIdx)} defaultDay={cardioSheetDay} cardioDays={cardioDays}/>
      <CoveragePanel open={coverageOpen} onClose={()=>setCoverageOpen(false)} days={days} onAddExercise={addToToday}/>
      <CmdK open={cmdkOpen} onClose={()=>setCmdkOpen(false)}
            onAddExercise={addToToday}
            onSwitchTab={(t)=>setTab(t)}
            days={days}/>
    </div>
  );
}

// ---------- ROOT ROUTER ----------
function Root() {
  const [screen, setScreen] = useState('landing');
  const [theme, setTheme] = useState('light');
  const [profile, setProfile] = useState({ days: 4, height: 178, hUnit: 'cm', weight: 74, wUnit: 'kg', pulse: '', sport: 'soccer' });

  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', theme === 'dark');
    document.documentElement.classList.toggle('theme-light', theme !== 'dark');
  }, [theme]);

  return (
    <div className="phone-shell">
      <div className="phone">
        <div className="notch"/>
        {screen === 'landing' && <Landing onStart={(mode)=>setScreen(mode)}/>}
        {(screen === 'login' || screen === 'signup') && (
          <Login mode={screen} onBack={()=>setScreen('landing')} onSubmit={()=>setScreen(screen==='signup' ? 'onboard' : 'app')}/>
        )}
        {screen === 'onboard' && (<Onboarding onDone={(p)=>{ setProfile(p); setScreen('app'); }}/>)}
        {screen === 'app' && <MainApp profile={profile} setProfile={setProfile} theme={theme} setTheme={setTheme} onLogout={()=>setScreen('landing')}/>}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Root/>);
