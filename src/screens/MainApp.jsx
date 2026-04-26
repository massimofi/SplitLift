// MainApp — header + tab routing + bottom nav. State lives here so all tabs
// share days / splitsByType / cardioDays / etc.

import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_DAYS, INITIAL_CARDIO_DAYS, SPORTS, computeScore } from '../data/exercises.js';
import { splitsByTypeFromDays, applySplitsByTypeToDays } from '../lib/splits.js';
import { fireConfetti } from '../lib/confetti.js';
import { StatusBar } from '../lib/StatusBar.jsx';
import { Toaster } from '../lib/Toaster.jsx';
import { BrandMark } from '../components/Brand.jsx';
import { I } from '../components/Icons.jsx';
import { CmdK } from '../components/CmdK.jsx';
import { LibrarySheet } from '../components/LibrarySheet.jsx';
import { CardioSheet } from '../components/CardioSheet.jsx';
import { CoveragePanel } from '../components/CoveragePanel.jsx';
import { GeneralTab } from '../tabs/GeneralTab.jsx';
import { SplitsTab } from '../tabs/SplitsTab.jsx';
import { ScheduleTab } from '../tabs/ScheduleTab.jsx';
import { DashboardTab } from '../tabs/DashboardTab.jsx';
import { ProfileTab } from '../tabs/ProfileTab.jsx';
import BodyTab from '../tabs/BodyTab.jsx';
import FriendsTab from '../tabs/FriendsTab.jsx';
import { Users as UsersIcon } from 'lucide-react';

export function MainApp({
  profile, setProfile,
  theme, setTheme,
  onLogout, onResetAll,
  initialDays, initialTab,
  // Optional: when persistence is wired (Phase 3) these come pre-hydrated.
  initialCardioDays, initialLocked, initialSplitsByType,
  // Persisted state writers — App owns localStorage; MainApp just notifies.
  onState,
}) {
  const baseDays = initialDays || INITIAL_DAYS;
  const [days, setDays] = useState(baseDays);
  const [cardioDays, setCardioDays] = useState(initialCardioDays || INITIAL_CARDIO_DAYS);
  const [locked, setLocked] = useState(initialLocked || [false,false,false,false,false,false,false]);
  const [tab, setTab] = useState(initialTab || 'general');
  const [splitsByType, setSplitsByType] = useState(() =>
    initialSplitsByType || splitsByTypeFromDays(baseDays)
  );
  const [splitsActiveType, setSplitsActiveType] = useState('push');

  // Propagate splitsByType edits down to every day with that type.
  useEffect(() => {
    setDays(prev => applySplitsByTypeToDays(prev, splitsByType));
  }, [splitsByType]);

  // Notify parent of state changes so it can persist.
  useEffect(() => {
    onState && onState({ days, cardioDays, locked, splitsByType });
  }, [days, cardioDays, locked, splitsByType, onState]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDay, setSheetDay] = useState(0);
  const [cardioSheetOpen, setCardioSheetOpen] = useState(false);
  const [cardioSheetDay, setCardioSheetDay] = useState(0);
  const [coverageOpen, setCoverageOpen] = useState(false);
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const toastIdRef = useRef(0);
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

  // Confetti when Dashboard is opened with excellent grade
  const scoreFiredRef = useRef(false);
  useEffect(() => {
    if (tab !== 'dashboard') return;
    const sc = computeScore(days, cardioDays, profile).score;
    if (sc >= 85 && !scoreFiredRef.current) {
      scoreFiredRef.current = true;
      setTimeout(fireConfettiAt, 320);
      showToast('Excellent week — keep it up');
    }
    if (sc < 80) scoreFiredRef.current = false;
  }, [tab, days, cardioDays, profile]);

  const addExerciseToDay = (exId, dayIdx) => {
    setDays(prev => {
      const n = prev.map(d => ({...d, exIds: [...d.exIds]}));
      const wasEmpty = n[dayIdx].exIds.length === 0 || n[dayIdx].rest;
      if (n[dayIdx].rest) n[dayIdx] = { ...n[dayIdx], rest: false, exIds: [exId], focus: 'Custom' };
      else n[dayIdx].exIds.push(exId);
      const planned = n.filter(d => !d.rest && d.exIds.length > 0).length;
      if (wasEmpty && planned >= 5) setTimeout(fireConfettiAt, 80);
      return n;
    });
    showToast(`Added`);
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
    showToast(`Added cardio`);
  };

  const sportLabel = SPORTS.find(s => s.id === profile.sport)?.label || 'General';
  const totalLiftDays = days.filter(d => !d.rest).length;

  return (
    <div className="app-screen">
      <StatusBar/>
      <div className="app-header-mini">
        <div className="left">
          <BrandMark size={36}/>
          <div className="title-block">
            <div className="h-title">{
              tab === 'general'   ? 'General' :
              tab === 'splits'    ? 'Splits'  :
              tab === 'schedule'  ? 'Schedule':
              tab === 'friends'   ? 'Friends' :
              tab === 'dashboard' ? 'Dashboard':
              tab === 'profile'   ? 'Profile' : 'Body'
            }</div>
            <div className="h-sub mono">{sportLabel.toUpperCase()} · {totalLiftDays} LIFT · {7-totalLiftDays} OFF</div>
          </div>
        </div>
        <div className="right">
          <button className="icon-btn ghost" onClick={()=>setCmdkOpen(true)} title="Search ⌘K" aria-label="Search"><I.search/></button>
          <button className="icon-btn ghost" onClick={()=>setTheme(theme==='dark'?'light':'dark')} title="Theme" aria-label="Toggle theme">
            {theme === 'dark' ? <I.sun/> : <I.moon/>}
          </button>
          <button className="avatar-mini" onClick={()=>setTab('profile')} aria-label="Profile">A</button>
        </div>
      </div>

      <div className="screen-body" style={{position:'relative'}} ref={screenBodyRef}>
        {tab === 'general' && (
          <GeneralTab
            profile={profile}
            setProfile={setProfile}
            days={days}
            cardioDays={cardioDays}
            showToast={showToast}
          />
        )}
        {tab === 'splits' && (
          <SplitsTab
            days={days}
            splitsByType={splitsByType}
            setSplitsByType={setSplitsByType}
            activeType={splitsActiveType}
            setActiveType={setSplitsActiveType}
            profile={profile}
            showToast={showToast}
          />
        )}
        {tab === 'schedule' && (
          <ScheduleTab
            days={days} setDays={setDays}
            cardioDays={cardioDays} setCardioDays={setCardioDays}
            locked={locked} setLocked={setLocked}
            profile={profile} showToast={showToast}
            splitsByType={splitsByType} setSplitsByType={setSplitsByType}
            onJumpToSplits={(typeId)=>{ if(typeId) setSplitsActiveType(typeId); setTab('splits'); }}
          />
        )}
        {tab === 'body' && (
          <BodyTab
            days={days}
            onAddExercise={addToToday}
            setTab={setTab}
            profile={profile}
            splitsByType={splitsByType}
            setSplitsByType={setSplitsByType}
            setSplitsActiveType={setSplitsActiveType}
            showToast={showToast}
          />
        )}
        {tab === 'friends' && (
          <FriendsTab profile={profile} days={days} splitsByType={splitsByType}/>
        )}
        {tab === 'dashboard' && (
          <DashboardTab days={days} cardioDays={cardioDays} profile={profile} setTab={setTab}/>
        )}
        {tab === 'profile' && (
          <ProfileTab
            profile={profile} setProfile={setProfile}
            theme={theme} setTheme={setTheme}
            onLogout={onLogout}
            onResetAll={onResetAll}
          />
        )}

        {tab === 'splits' && (
          <button className="cov-tab" onClick={()=>setTab('body')}><span>See coverage</span></button>
        )}

        <Toaster toasts={toasts}/>
      </div>

      <div className="bottom-nav">
        <div className="bn-track six">
          <div className="bn-pill" style={{
            transform: `translateX(${Math.max(0, ['general','splits','schedule','body','friends','dashboard'].indexOf(tab)) * 100}%)`,
            opacity: ['general','splits','schedule','body','friends','dashboard'].indexOf(tab) === -1 ? 0 : 1,
          }}/>
          <button className={`bn-item ${tab==='general'?'active':''}`} onClick={()=>setTab('general')}><I.prof/><span className="lbl">General</span></button>
          <button className={`bn-item ${tab==='splits'?'active':''}`} onClick={()=>setTab('splits')}><I.dumbbell/><span className="lbl">Splits</span></button>
          <button className={`bn-item ${tab==='schedule'?'active':''}`} onClick={()=>setTab('schedule')}><I.cal/><span className="lbl">Schedule</span></button>
          <button className={`bn-item ${tab==='body'?'active':''}`} onClick={()=>setTab('body')}><I.cover/><span className="lbl">Body</span></button>
          <button className={`bn-item ${tab==='friends'?'active':''}`} onClick={()=>setTab('friends')}><UsersIcon size={22} strokeWidth={2}/><span className="lbl">Friends</span></button>
          <button className={`bn-item ${tab==='dashboard'?'active':''}`} onClick={()=>setTab('dashboard')}><I.score/><span className="lbl">Dashboard</span></button>
        </div>
      </div>

      <LibrarySheet open={sheetOpen} onClose={()=>setSheetOpen(false)} onAdd={(exId, dayIdx)=>addExerciseToDay(exId, dayIdx)} days={days} defaultDay={sheetDay}/>
      <CardioSheet open={cardioSheetOpen} onClose={()=>setCardioSheetOpen(false)} onAdd={(cId, dayIdx)=>addCardioToDay(cId, dayIdx)} defaultDay={cardioSheetDay} cardioDays={cardioDays}/>
      <CoveragePanel open={coverageOpen} onClose={()=>setCoverageOpen(false)} days={days} onAddExercise={addToToday}/>
      <CmdK open={cmdkOpen} onClose={()=>setCmdkOpen(false)}
            onAddExercise={addToToday}
            onSwitchTab={(t)=>setTab(t)}/>
    </div>
  );
}
