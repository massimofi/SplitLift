// Auth screen — placeholder UI; the buttons all just call onSubmit (no real auth).

import React, { useState } from 'react';
import { I } from '../components/Icons.jsx';

export function Login({ mode, onBack, onSubmit }) {
  const [email, setEmail] = useState('alex@splitlift.app');
  const [pw, setPw] = useState('••••••••');
  const isSignup = mode === 'signup';
  return (
    <div className="screen">
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
