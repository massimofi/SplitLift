// Body map: faux-3D rotating male silhouette, front + back faces.
// Intensity ramp uses green-on-white palette.

const RAMP = ['#E5E5E0', '#C9EBD7', '#7FD9A6', '#00C265', '#F2C600'];
//             0 rest    1 light    2 active    3 optimal    4 over

function intensityFor(sets, target) {
  if (sets <= 0) return 0;
  if (sets < target.min) return sets <= target.min / 2 ? 1 : 2;
  if (sets <= target.max) return 3;
  return 4;
}

function BodyFront({ sets, recently, onRegion }) {
  const f = (k) => RAMP[intensityFor(sets[k]||0, window.TARGETS[k])];
  const cls = (k) => `body-region ${recently===k?'pulse':''}`;
  const bind = (k) => ({
    className: cls(k),
    fill: f(k),
    stroke: 'rgba(255,255,255,0.15)',
    strokeWidth: 0.6,
    onClick: () => onRegion && onRegion(k),
  });
  return (
    <svg viewBox="0 0 240 460" aria-label="Body front">
      {/* outline silhouette behind everything (subtle shadow for depth) */}
      <defs>
        <linearGradient id="sheenF" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="rgba(255,255,255,0.0)"/>
          <stop offset="0.5" stopColor="rgba(255,255,255,0.10)"/>
          <stop offset="1" stopColor="rgba(0,0,0,0.18)"/>
        </linearGradient>
      </defs>

      {/* head + neck */}
      <circle cx="120" cy="36" r="22" fill="#E5E5E0" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6"/>
      <rect x="112" y="56" width="16" height="14" fill="#E5E5E0"/>

      {/* shoulders */}
      <ellipse cx="64" cy="100" rx="18" ry="16" {...bind('shoulder')} />
      <ellipse cx="176" cy="100" rx="18" ry="16" {...bind('shoulder')} />

      {/* chest */}
      <path d="M76,90 Q120,82 164,90 L168,140 Q120,134 72,140 Z" {...bind('chest')} />

      {/* core */}
      <path d="M96,142 Q120,138 144,142 L143,212 Q120,216 97,212 Z" {...bind('core')} />

      {/* biceps (arms) */}
      <path d="M50,120 Q42,160 48,190 L66,190 Q72,160 64,120 Z" {...bind('arms')} />
      <path d="M190,120 Q198,160 192,190 L174,190 Q168,160 176,120 Z" {...bind('arms')} />

      {/* forearms — neutral */}
      <path d="M48,192 L66,192 L70,238 L52,240 Z" fill="#E5E5E0" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6"/>
      <path d="M174,192 L192,192 L188,240 L170,238 Z" fill="#E5E5E0" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6"/>

      {/* quads */}
      <path d="M86,218 Q104,214 116,218 L114,318 Q102,322 88,316 Z" {...bind('quads')} />
      <path d="M124,218 Q136,214 154,218 L152,316 Q138,322 126,318 Z" {...bind('quads')} />

      {/* knees / shins */}
      <ellipse cx="100" cy="324" rx="14" ry="7" fill="#E5E5E0" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6"/>
      <ellipse cx="140" cy="324" rx="14" ry="7" fill="#E5E5E0" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6"/>
      <path d="M88,332 L114,332 L112,408 L90,408 Z" fill="#E5E5E0" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6"/>
      <path d="M126,332 L152,332 L150,408 L128,408 Z" fill="#E5E5E0" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6"/>
      <ellipse cx="100" cy="418" rx="14" ry="8" fill="#E5E5E0" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6"/>
      <ellipse cx="140" cy="418" rx="14" ry="8" fill="#E5E5E0" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6"/>

      {/* depth sheen overlay */}
      <rect x="0" y="0" width="240" height="460" fill="url(#sheenF)" pointerEvents="none"/>
    </svg>
  );
}

function BodyBack({ sets, recently, onRegion }) {
  const f = (k) => RAMP[intensityFor(sets[k]||0, window.TARGETS[k])];
  const cls = (k) => `body-region ${recently===k?'pulse':''}`;
  const bind = (k) => ({
    className: cls(k),
    fill: f(k),
    stroke: 'rgba(255,255,255,0.15)',
    strokeWidth: 0.6,
    onClick: () => onRegion && onRegion(k),
  });
  return (
    <svg viewBox="0 0 240 460" aria-label="Body back">
      <defs>
        <linearGradient id="sheenB" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="rgba(0,0,0,0.18)"/>
          <stop offset="0.5" stopColor="rgba(255,255,255,0.10)"/>
          <stop offset="1" stopColor="rgba(255,255,255,0.0)"/>
        </linearGradient>
      </defs>

      <circle cx="120" cy="36" r="22" fill="#E5E5E0" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6"/>
      <rect x="112" y="56" width="16" height="14" fill="#E5E5E0"/>

      {/* traps */}
      <path d="M70,72 Q120,58 170,72 L182,96 Q120,84 58,96 Z" {...bind('back')} />

      {/* rear delts */}
      <ellipse cx="62" cy="104" rx="16" ry="14" {...bind('shoulder')} />
      <ellipse cx="178" cy="104" rx="16" ry="14" {...bind('shoulder')} />

      {/* lats */}
      <path d="M76,98 Q120,92 164,98 L172,170 Q120,178 68,170 Z" {...bind('back')} />
      <path d="M88,172 Q120,168 152,172 L150,212 Q120,216 90,212 Z" {...bind('back')} />

      {/* triceps */}
      <path d="M50,118 Q42,158 48,188 L66,188 Q72,158 64,118 Z" {...bind('arms')} />
      <path d="M190,118 Q198,158 192,188 L174,188 Q168,158 176,118 Z" {...bind('arms')} />

      <path d="M48,190 L66,190 L70,236 L52,238 Z" fill="#E5E5E0" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6"/>
      <path d="M174,190 L192,190 L188,236 L170,236 Z" fill="#E5E5E0" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6"/>

      {/* glutes */}
      <path d="M86,216 Q120,210 154,216 L150,256 Q120,262 90,256 Z" {...bind('glutes')} />

      {/* hamstrings */}
      <path d="M88,260 Q104,256 116,260 L114,330 Q102,336 88,330 Z" {...bind('hams')} />
      <path d="M124,260 Q136,256 152,260 L150,330 Q138,336 126,330 Z" {...bind('hams')} />

      {/* calves */}
      <path d="M88,342 Q104,338 116,342 L114,408 Q102,412 90,408 Z" {...bind('calves')} />
      <path d="M124,342 Q136,338 152,342 L150,408 Q138,412 126,408 Z" {...bind('calves')} />

      <ellipse cx="100" cy="418" rx="14" ry="8" fill="#E5E5E0" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6"/>
      <ellipse cx="140" cy="418" rx="14" ry="8" fill="#E5E5E0" stroke="rgba(255,255,255,0.15)" strokeWidth="0.6"/>

      <rect x="0" y="0" width="240" height="460" fill="url(#sheenB)" pointerEvents="none"/>
    </svg>
  );
}

function Body3D({ sets, view, recently, onRegion }) {
  // 0 = front, 1 = back. Rotate the container; faces back-cull.
  const angle = view === 'back' ? 180 : 0;
  return (
    <div className="body-3d" style={{ transform: `rotateY(${angle}deg)` }}>
      <div className="body-face front">
        <BodyFront sets={sets} recently={recently} onRegion={onRegion}/>
      </div>
      <div className="body-face back">
        <BodyBack sets={sets} recently={recently} onRegion={onRegion}/>
      </div>
    </div>
  );
}

Object.assign(window, { BodyFront, BodyBack, Body3D, intensityFor, RAMP });
