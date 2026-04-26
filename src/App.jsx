// Top-level router. Four screens:
//   landing → login/signup → onboard → app
// Returning users with saved state skip straight to `app` and re-hydrate.

import React, { useState, useEffect, useRef } from 'react';
import { Landing } from './screens/Landing.jsx';
import { Login } from './screens/Login.jsx';
import { Onboarding } from './screens/Onboarding.jsx';
import { MainApp } from './screens/MainApp.jsx';
import { loadState, saveState, clearState } from './state/persist.js';

const DEFAULT_PROFILE = {
  days: 4, height: 178, hUnit: 'cm', weight: 74, wUnit: 'kg',
  age: 22, sex: 'm', sport: 'soccer', cardioMin: 90,
};

export default function App() {
  // Try to hydrate from localStorage on mount.
  const saved = useRef(loadState()).current;

  const [screen, setScreen] = useState(saved?.onboarded ? 'app' : 'landing');
  const [theme, setTheme] = useState(saved?.theme || 'light');
  const [profile, setProfile] = useState(saved?.profile || DEFAULT_PROFILE);
  const [bootState, setBootState] = useState({
    initialDays: saved?.days || null,
    initialTab: saved?.onboarded ? 'general' : 'general',
    initialCardioDays: saved?.cardioDays || null,
    initialLocked: saved?.locked || null,
    initialSplitsByType: saved?.splitsByType || null,
  });
  // Keep the latest of each so we can write a single state blob on any change.
  const latestRef = useRef({
    profile, theme, days: saved?.days, cardioDays: saved?.cardioDays,
    locked: saved?.locked, splitsByType: saved?.splitsByType, onboarded: !!saved?.onboarded,
  });

  useEffect(() => {
    document.documentElement.classList.toggle('theme-dark', theme === 'dark');
    document.documentElement.classList.toggle('theme-light', theme !== 'dark');
    latestRef.current.theme = theme;
    persistDebounced();
  }, [theme]);

  useEffect(() => {
    latestRef.current.profile = profile;
    persistDebounced();
  }, [profile]);

  // Debounced save (500ms after the last change).
  const debounceRef = useRef(null);
  const persistDebounced = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => saveState(latestRef.current), 500);
  };

  const onMainAppState = (next) => {
    Object.assign(latestRef.current, next);
    persistDebounced();
  };

  const onResetAll = () => {
    clearState();
    setProfile(DEFAULT_PROFILE);
    setBootState({ initialDays: null, initialTab: 'general' });
    latestRef.current = { profile: DEFAULT_PROFILE, theme, onboarded: false };
    setScreen('landing');
  };

  return (
    <div className="phone-shell">
      <div className="phone">
        <div className="notch"/>
        {screen === 'landing' && <Landing onStart={(mode)=>setScreen(mode)}/>}
        {(screen === 'login' || screen === 'signup') && (
          <Login mode={screen} onBack={()=>setScreen('landing')} onSubmit={()=>setScreen(screen==='signup' ? 'onboard' : 'app')}/>
        )}
        {screen === 'onboard' && (
          <Onboarding onDone={({ profile: p, initialDays, initialTab }) => {
            setProfile(p);
            setBootState({ initialDays, initialTab });
            latestRef.current.onboarded = true;
            latestRef.current.profile = p;
            latestRef.current.days = initialDays;
            persistDebounced();
            setScreen('app');
          }}/>
        )}
        {screen === 'app' && (
          <MainApp
            profile={profile} setProfile={setProfile}
            theme={theme} setTheme={setTheme}
            onLogout={()=>setScreen('landing')}
            onResetAll={onResetAll}
            initialDays={bootState.initialDays}
            initialTab={bootState.initialTab}
            initialCardioDays={bootState.initialCardioDays}
            initialLocked={bootState.initialLocked}
            initialSplitsByType={bootState.initialSplitsByType}
            onState={onMainAppState}
          />
        )}
      </div>
    </div>
  );
}
