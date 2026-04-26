// Marketing landing screen — only visible if there's no saved profile.

import React from 'react';
import { BrandLockup } from '../components/Brand.jsx';
import { I } from '../components/Icons.jsx';
import { LandingBackground } from '../components/LandingBackground.jsx';

export function Landing({ onStart }) {
  return (
    <div className="screen">
      <div className="screen-body landing">
        <LandingBackground/>
        <div className="top">
          <div className="logo-row">
            <BrandLockup markSize={48}/>
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
