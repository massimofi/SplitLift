// Friends tab — list of fake friends sorted by Sport Match Score, plus a
// side-by-side comparison view that renders both bodies' coverage maps.
//
// FAKE_DATA: see src/data/fakeFriends.js

import React, { useState, useMemo, lazy, Suspense } from 'react';
import { CircleUser, Link2, Copy, X } from 'lucide-react';
import { FAKE_FRIENDS } from '../data/fakeFriends.js';
import { SPORTS } from '../data/exercises.js';
import { computeCoverageV2, MUSCLE_LABELS_V2, TARGETS_V2 } from '../components/Anatomy2D.jsx';
import { AnatomyBody } from '../components/AnatomyBody.jsx';
import { SportIcon } from '../components/SportIcons.jsx';
import { useAnimatedNumber } from '../lib/useAnimatedNumber.js';
import { IconX } from '../components/Icons.jsx';

// Stable hue per friend id, used to color the avatar tile.
function hueFromId(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return h;
}

function smsColor(score) {
  if (score >= 90) return '#00c896';
  if (score >= 70) return '#4ED9C0';
  if (score >= 40) return '#ffd93d';
  return '#ff4444';
}

function FriendAvatar({ friend, size = 48 }) {
  const hue = hueFromId(friend.id);
  return (
    <div className="fr-avatar" style={{
      width: size, height: size,
      background: `linear-gradient(135deg, hsl(${hue} 70% 60%) 0%, hsl(${(hue + 40) % 360} 70% 45%) 100%)`,
    }}>
      <CircleUser size={Math.round(size * 0.55)} color="white" strokeWidth={1.6}/>
    </div>
  );
}

export default function FriendsTab({ profile, days, splitsByType }) {
  const [focused, setFocused] = useState(null); // friend id
  const [inviteOpen, setInviteOpen] = useState(false);

  const sorted = useMemo(
    () => [...FAKE_FRIENDS].sort((a, b) => b.sportMatchScore - a.sportMatchScore),
    []
  );

  if (focused) {
    const friend = sorted.find(f => f.id === focused);
    return <ComparisonView friend={friend} profile={profile} days={days} onBack={()=>setFocused(null)}/>;
  }

  return (
    <div className="tab-pane fr-page">
      <div className="fr-bar">
        <div>
          <div className="fr-h1">Friends</div>
          <div className="fr-sub mono">SORTED BY SPORT MATCH</div>
        </div>
        <button className="fr-add" onClick={()=>setInviteOpen(true)} aria-label="Invite friend">
          + Invite
        </button>
      </div>

      <div className="fr-list">
        {sorted.map(f => {
          const sport = SPORTS.find(s => s.id === f.sport);
          return (
            <button key={f.id} className="fr-row" onClick={()=>setFocused(f.id)}>
              <FriendAvatar friend={f} size={52}/>
              <div className="fr-body">
                <div className="fr-row-top">
                  <div className="fr-name">{f.name}</div>
                  <div className="fr-score" style={{ color: smsColor(f.sportMatchScore) }}>
                    {f.sportMatchScore}
                  </div>
                </div>
                <div className="fr-row-bot">
                  <span className="fr-sport"><SportIcon id={f.sport} size={12}/> {sport?.label || f.sport}</span>
                  <span className="fr-split">{f.splitName}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {inviteOpen && <InviteSheet onClose={()=>setInviteOpen(false)}/>}
    </div>
  );
}

function ComparisonView({ friend, profile, days, onBack }) {
  const [view, setView] = useState('front');

  const yoursSets = useMemo(() => computeCoverageV2(days), [days]);
  const theirsSets = useMemo(() => computeCoverageV2(friend.days || []), [friend]);

  const yourSport = SPORTS.find(s => s.id === profile.sport);
  const theirSport = SPORTS.find(s => s.id === friend.sport);

  // Compute biggest deltas — muscles where you and them differ most.
  const deltas = useMemo(() => {
    const allKeys = Object.keys(MUSCLE_LABELS_V2);
    return allKeys
      .map(k => ({
        k, label: MUSCLE_LABELS_V2[k],
        you: yoursSets[k] || 0,
        them: theirsSets[k] || 0,
      }))
      .filter(d => Math.abs(d.you - d.them) >= 4)
      .sort((a, b) => Math.abs(b.you - b.them) - Math.abs(a.you - a.them))
      .slice(0, 5);
  }, [yoursSets, theirsSets]);

  return (
    <div className="tab-pane fr-cmp-page">
      <div className="fr-cmp-bar">
        <button className="fr-back" onClick={onBack}>← Back</button>
        <div className="fr-cmp-title">You vs {friend.name}</div>
      </div>

      <div className="fr-cmp-stats">
        <div className="fr-cmp-col">
          <div className="fr-cmp-tag mono">YOU</div>
          <div className="fr-cmp-name">{yourSport?.label || profile.sport}</div>
          <div className="fr-cmp-row"><span>Lift days</span><b>{(days || []).filter(d => !d.rest).length}/wk</b></div>
          <div className="fr-cmp-row"><span>Cardio</span><b>{profile.cardioMin || 90}m/wk</b></div>
        </div>
        <div className="fr-cmp-col">
          <div className="fr-cmp-tag mono">{friend.name.toUpperCase()}</div>
          <div className="fr-cmp-name">{theirSport?.label || friend.sport}</div>
          <div className="fr-cmp-row"><span>Lift days</span><b>{friend.liftDaysPerWeek}/wk</b></div>
          <div className="fr-cmp-row"><span>Cardio</span><b>{friend.cardioMinPerWeek}m/wk</b></div>
          <div className="fr-cmp-row"><span>SMS</span><b style={{ color: smsColor(friend.sportMatchScore) }}>{friend.sportMatchScore}</b></div>
        </div>
      </div>

      <div className="b2-segs" style={{ alignSelf: 'center', margin: '4px 0 8px' }}>
        <button className={view==='front'?'on':''} onClick={()=>setView('front')}>Front</button>
        <button className={view==='back'?'on':''} onClick={()=>setView('back')}>Back</button>
      </div>

      <div className="fr-cmp-bodies">
        <div className="fr-cmp-body">
          <div className="fr-cmp-body-tag mono">YOU</div>
          <AnatomyBody coverage={yoursSets} targets={TARGETS_V2} view={view}/>
        </div>
        <div className="fr-cmp-body">
          <div className="fr-cmp-body-tag mono">{friend.name.split(' ')[0].toUpperCase()}</div>
          <AnatomyBody coverage={theirsSets} targets={TARGETS_V2} view={view}/>
        </div>
      </div>

      <div className="fr-cmp-deltas">
        <div className="ps-section">Where you differ</div>
        {deltas.length === 0 && (
          <div className="empty-pill" style={{ textAlign: 'center', padding: 14 }}>
            Your splits hit similar volumes — no significant gaps.
          </div>
        )}
        {deltas.map(d => (
          <div key={d.k} className="fr-delta-row">
            <span className="fr-delta-name">{d.label}</span>
            <div className="fr-delta-bars">
              <div className="fr-delta-bar you">
                <div style={{ width: `${Math.min(100, d.you * 4)}%` }}/>
                <span>{d.you}</span>
              </div>
              <div className="fr-delta-bar them">
                <div style={{ width: `${Math.min(100, d.them * 4)}%` }}/>
                <span>{d.them}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: 24 }}/>
    </div>
  );
}

function InviteSheet({ onClose }) {
  const link = useMemo(() => `splitlift.app/share/${Math.random().toString(36).slice(2, 9)}`, []);
  const [copied, setCopied] = useState(false);
  const copy = () => {
    try {
      navigator.clipboard?.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div className="ps-overlay" onClick={onClose}>
      <div className="ps-sheet" onClick={e=>e.stopPropagation()}>
        <div className="ps-head">
          <div>
            <div className="ps-t">Invite a friend</div>
            <div className="ps-s mono">COMING SOON</div>
          </div>
          <button className="ip-x" onClick={onClose} aria-label="Close"><IconX/></button>
        </div>
        <p className="invite-copy">
          Friend invites are coming soon — for now, share your split with the link below.
        </p>
        <div className="invite-link">
          <Link2 size={16}/>
          <code>{link}</code>
          <button className="invite-copy-btn" onClick={copy} aria-label="Copy link">
            <Copy size={14}/>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>
    </div>
  );
}
