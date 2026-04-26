# Claude Code Prompt — SplitLift v2: Vite + R3F + 3D-First

> Paste this entire file into Claude Code as your initial message. It contains everything needed to migrate SplitLift from CDN/no-build to a Vite project with react-three-fiber, drop in the real 3D anatomy model, and ship three additional features (exercise GIFs, sport icons, localStorage persistence) for BroncoHacks 2026.

---

## Mission

You are taking SplitLift — a working CDN-based React app — and migrating it to a Vite + React 18 + TypeScript-optional project that uses **react-three-fiber** for the 3D anatomy view. The 3D feature is the centerpiece of our hackathon submission and **must work flawlessly on mobile**.

The user (Massi) has already:
- Downloaded the Z-Anatomy "Myology" .glb model
- Compressed it with `gltf-transform` to under 5 MB
- Placed it at the path you'll use: `public/models/anatomy.glb`
- Written `public/models/LICENSE-MODEL.txt`

If those files don't exist when you start, STOP and tell Massi to follow `3D-MODEL-SETUP.md` first. Don't try to work around a missing model.

---

## Hard requirements — non-negotiable

1. **Mobile-first.** Every change must work on a 380px-wide phone viewport. If you build something that only works on desktop, you've failed.
2. **60fps target on mid-tier phones** for the 3D view. If FPS drops below 30, fall back to the 2D anatomy.
3. **Don't break working features.** The current onboarding flow, splits editor, schedule, dashboard, and 2D anatomy all work. Migrate them, don't rewrite them.
4. **Preserve Massi's data model.** `MUSCLE_LABELS_V2`, `TARGETS_V2`, `EXERCISES`, `SPORTS`, `SPLIT_TEMPLATES`, the coverage math (`computeCoverageV2`), and the Tanaka HR / Mifflin-St Jeor formulas — keep these *exactly* as they are. They're tested and the math is right.
5. **No tracked-changes mode in your edits.** When you replace `splitlift-3d.jsx`, replace it cleanly. Don't leave commented-out blocks.
6. **Read this entire file before writing any code.** Then read every existing `splitlift-*.jsx` file. Then make a plan and tell Massi the plan before you start. Then execute.

---

## The four phases

Do these **in order**. Don't start phase 2 until phase 1 actually works in the browser.

### Phase 1 — Vite migration (do this first, in isolation)

Goal: same app, same look, same features, but running under Vite with proper imports instead of CDN script tags + Babel-Standalone.

Steps:

1. **Create new project structure** at the same repo root. Don't delete the old files yet — keep them for reference until phase 1 is verified.

   ```bash
   npm create vite@latest . -- --template react
   ```

   When prompted "directory not empty" — proceed. Then:
   ```bash
   npm install
   npm install three @react-three/fiber @react-three/drei
   npm install lucide-react
   ```

2. **Move JSX → ESM.** Each `splitlift-*.jsx` file currently dumps things on `window`. Convert to proper exports:
   - `splitlift-data.jsx` → `src/data/exercises.js` (export `EXERCISES`, `SPORTS`, `setsForExercise`, `activityMultiplier`, `tdeeFor`, `macrosFor`, `hrZonesFor`, `cardioHRZone`)
   - `splitlift-templates.jsx` → `src/data/templates.js`
   - `splitlift-anatomy.jsx` → `src/components/Anatomy2D.jsx` (export `AnatomyFront`, `AnatomyBack`, `Anatomy3D` (the 2D faux-3D one — rename to `Anatomy2DSwivel` to avoid confusion with the new R3F one), `MUSCLE_LABELS_V2`, `TARGETS_V2`, `computeCoverageV2`, `expandHits`, `exercisesForMuscle`)
   - `splitlift-bodymap.jsx` → DELETE. It's the older v1 anatomy and is no longer used.
   - `splitlift-brand.jsx` → `src/components/Brand.jsx`
   - `splitlift-tabs.jsx` → split into `src/tabs/GeneralTab.jsx`, `SplitsTab.jsx`, `ScheduleTab.jsx`, `BodyTab.jsx`, `DashboardTab.jsx`, `ProfileTab.jsx`. Each tab gets its own file.
   - `splitlift-app.jsx` → `src/App.jsx`
   - `splitlift-3d.jsx` → DELETE. We're rewriting this entirely in phase 2 with R3F.

3. **CSS.** Move all the CSS from `app.html`'s `<style>` block to `src/index.css`. Keep the CSS variables (`--accent`, `--bg`, etc.) as-is. Don't modernize the CSS — Massi likes how it looks.

4. **No TypeScript.** Stay in plain `.jsx`. Massi is on a deadline and TS would slow this down.

5. **Entry point.** `src/main.jsx` mounts `<App />` into `#root`. `index.html` becomes a 10-line Vite-default file.

6. **Verify Phase 1.** Run `npm run dev`. Open in a phone-sized browser window. Click through every tab. Onboarding should work. Schedule should work. Splits editing should work. The existing 2D anatomy should still display in the Body tab. **If anything is broken, fix it before moving to Phase 2.**

7. **Tell Massi:** "Phase 1 done — Vite migration complete, all existing features verified working. Ready for Phase 2 (3D model). Want me to continue?" Wait for confirmation.

### Phase 2 — Drop in react-three-fiber 3D anatomy

Goal: replace the (now-deleted) `splitlift-3d.jsx` with a clean R3F implementation.

Create `src/components/Anatomy3D/` with:

- `Anatomy3D.jsx` — the `<Canvas>` wrapper, lighting, camera, fallback handling
- `AnatomyModel.jsx` — `useGLTF`-loaded model with click handling and per-mesh material control
- `mapMeshNameToMuscle.js` — moves the existing fuzzy-mapping function out, keep it 1:1 from current `splitlift-3d.jsx`
- `useCameraTween.js` — custom hook that tweens the camera target+position when `focused` changes

Key implementation notes:

**IMPORTANT: Muscle-only rendering filter.** The Z-Anatomy Myology model includes the entire anatomy — eyeballs, teeth, tongue, skull, ribcage, all bones. We do NOT want any of that visible. SplitLift is a fitness app, not a med school tool. The user wants something that *looks* like the muscle map in MuscleWiki / Strong / Hevy: smooth body silhouette, muscles colored by coverage, no anatomical gore.

The fix: when traversing the loaded scene, hide every mesh whose name doesn't match a muscle pattern. The hide list is below — copy it verbatim.

```jsx
// AnatomyModel.jsx
import { useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mapMeshNameToMuscle } from './mapMeshNameToMuscle';

useGLTF.preload('/models/anatomy.glb');

// Anything matching one of these substrings (case-insensitive) is hidden
// at load time. Tweak this list if mesh names differ in the user's .glb.
const HIDE_PATTERNS = [
  // Head/face — the biggest source of "looks medical/gross"
  'eye', 'eyeball', 'eyelid', 'eyelash', 'cornea', 'lens', 'iris', 'pupil', 'sclera',
  'tooth', 'teeth', 'tongue', 'gum', 'gingiva', 'lip', 'palate', 'uvula',
  'ear', 'auricle', 'cochlea', 'tympanic',
  'nose', 'nostril', 'nasal',
  'brain', 'cerebrum', 'cerebellum',

  // Bones — we want muscles, not the skeleton
  'skull', 'cranium', 'mandible', 'maxilla', 'jaw',
  'bone', 'rib_', 'ribs', 'spine', 'vertebra', 'vertebrae',
  'pelvis', 'sacrum', 'coccyx', 'ilium', 'ischium', 'pubis',
  'femur', 'tibia', 'fibula', 'patella',
  'humerus', 'radius', 'ulna', 'clavicle', 'scapula', 'sternum',
  'carpal', 'metacarpal', 'phalanx', 'phalanges',
  'tarsal', 'metatarsal', 'calcaneus',

  // Connective tissue / internals
  'tendon', 'ligament', 'cartilage', 'fascia', 'aponeurosis',
  'organ', 'heart', 'lung', 'liver', 'kidney', 'stomach', 'intestine',
  'artery', 'vein', 'vessel', 'nerve',
];

function shouldHide(name) {
  if (!name) return false;
  const n = name.toLowerCase();
  return HIDE_PATTERNS.some(p => n.includes(p));
}

export function AnatomyModel({ sets, focused, onSelect, targets }) {
  const { scene } = useGLTF('/models/anatomy.glb');

  // Build a muscle-key -> [meshes] map ONCE, and hide everything that isn't
  // a muscle we know how to map.
  const muscleMeshes = useMemo(() => {
    const map = new Map();
    scene.traverse(child => {
      if (!child.isMesh) return;

      // Step 1: hide anatomical "gore" by name pattern
      if (shouldHide(child.name)) {
        child.visible = false;
        return;
      }

      // Step 2: try to map this mesh to one of our 17 canonical muscle keys
      const key = mapMeshNameToMuscle(child.name);
      if (key) {
        child.userData.muscleKey = key;
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(child);
        child.material = new THREE.MeshStandardMaterial({
          color: 0x4a4a66,
          roughness: 0.55,
          metalness: 0.05,
        });
      } else {
        // Step 3: meshes that aren't on the hide list AND aren't recognized
        // as muscles — hide them too. They're typically connective tissue
        // or model artifacts that slipped past the pattern list.
        child.visible = false;
      }
    });
    return map;
  }, [scene]);

  // Recolor on every coverage change
  useMemo(() => {
    muscleMeshes.forEach((meshes, key) => {
      const t = targets[key];
      const s = sets[key] || 0;
      const isFocused = focused === key;
      const color = colorForCoverage(s, t, isFocused);
      meshes.forEach(m => {
        m.material.color.set(color);
        m.material.emissive.set(isFocused ? color : 0x000000);
        m.material.emissiveIntensity = isFocused ? 0.35 : 0;
      });
    });
  }, [sets, focused, muscleMeshes, targets]);

  return (
    <primitive
      object={scene}
      onPointerDown={(e) => {
        e.stopPropagation();
        const key = e.object.userData.muscleKey;
        if (key) onSelect(key);
      }}
    />
  );
}
```

**Three visual presets** — Massi can pick which one looks best at demo time. Add a constant at the top of `AnatomyModel.jsx`:

```jsx
// Switch this to change the look. Default = 'clean' (recommended).
const VISUAL_STYLE = 'clean';

// 'clean'   — muscles only, head/face/skeleton hidden. Fitness-app look.
// 'no_head' — same as clean, but also hide everything above the neck.
//             Body+arms+legs only. Most stylized.
// 'full'    — show everything (not recommended; for debugging mesh names).
```

Then in the traversal, gate the hide logic on `VISUAL_STYLE`:

```jsx
if (VISUAL_STYLE !== 'full' && shouldHide(child.name)) {
  child.visible = false;
  return;
}
if (VISUAL_STYLE === 'no_head') {
  // Crude head test: hide anything whose bounding-box center is above
  // the model's neck height. Compute once after the model loads.
  // (Implementation: traverse once to find max Y, then anything above
  // ~0.85 * maxY is "head". Tune the threshold to taste.)
}
```

Implement the `'no_head'` height-clamp as a second traversal pass after `useGLTF` returns, so it runs after auto-fit. Default to `'clean'`. If `'clean'` accidentally hides muscles we want (e.g. a mesh named "neck_muscle" gets caught by the `'ear'` substring through "near"), tighten the hide patterns — don't loosen the muscle mapper.

**One mesh-name debug tool.** Add a dev-only logger that runs once on first model load:

```jsx
if (import.meta.env.DEV) {
  console.group('[Anatomy3D] Mesh inventory');
  scene.traverse(c => {
    if (c.isMesh) console.log(c.name, '→',
      shouldHide(c.name) ? 'HIDDEN (gore)' :
      mapMeshNameToMuscle(c.name) ? `MUSCLE (${mapMeshNameToMuscle(c.name)})` :
      'HIDDEN (unmapped)');
  });
  console.groupEnd();
}
```

That way Massi can open DevTools, see exactly which meshes are mapped vs hidden, and tell Claude Code to fix specific names if any muscles are getting hidden by mistake.

For the `Anatomy3D.jsx` wrapper:

```jsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, AdaptiveDpr, AdaptiveEvents, Bounds, Stats } from '@react-three/drei';
import { Suspense, useState } from 'react';
import { AnatomyModel } from './AnatomyModel';

export function Anatomy3D({ sets, targets, focused, onSelect, onFallback }) {
  const [contextLost, setContextLost] = useState(false);
  if (contextLost) { onFallback?.(); return null; }

  return (
    <Canvas
      camera={{ position: [0, 1.4, 4.2], fov: 35 }}
      dpr={[1, 1.5]}                 // cap pixel ratio on phones
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', () => setContextLost(true));
      }}
    >
      <ambientLight intensity={0.6} />
      <hemisphereLight args={[0xffffff, 0x303040, 0.4]} />
      <directionalLight position={[2, 4, 3]} intensity={0.85} />
      <directionalLight position={[-3, 1, -2]} intensity={0.25} color={0x9b5bff} />
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.2}>
          <AnatomyModel sets={sets} focused={focused} onSelect={onSelect} targets={targets} />
        </Bounds>
      </Suspense>
      <OrbitControls
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        minDistance={1.4}
        maxDistance={8}
      />
    </Canvas>
  );
}
```

Camera tween on `focused` change: use a simple `useFrame` lerp inside an internal `<CameraRig>` component that reads `focused` and the target mesh's bounding box. Don't import a tween library — write 20 lines of lerp code.

**Loading state.** Wrap the `<Canvas>` in a `<Suspense fallback={<LoadingSpinner />}>` at the parent level. When `useGLTF` is fetching, show a "Loading 3D model…" spinner. Use `useProgress` from drei to show actual percentage.

**Failure fallback.** If `useGLTF` errors (e.g. file missing or corrupted), fall through to the existing 2D `Anatomy2DSwivel` component. Also fall through if WebGL context is lost (some Android browsers).

**The 3D ↔ 2D toggle stays.** User can manually switch even if 3D is working — some judges will be on phones that struggle.

### Phase 3 — Three side features (do all three; they're small)

#### 3a. Exercise GIFs from `yuhonas/free-exercise-db`

The dataset is on GitHub at `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/`. Each exercise has a folder with `0.jpg` and sometimes `1.jpg` (which when alternated act as a 2-frame animation).

Plan:

1. Create `src/data/exerciseImages.js`. Manually map our existing `EXERCISES` IDs to free-exercise-db slugs. Massi has ~60 exercises in `splitlift-data.jsx`. Match each to a free-exercise-db entry. Examples:
   - `bench_press` → `Barbell_Bench_Press_-_Medium_Grip`
   - `squat` → `Barbell_Squat`
   - `deadlift` → `Barbell_Deadlift`
   - Use the directory listing at https://github.com/yuhonas/free-exercise-db/tree/main/exercises to find slugs.
   - For exercises that don't have an obvious match (e.g. "cable face pull"), pick the closest one and document it with a comment.

2. Create `<ExerciseGif exId={...} size={48} />` component:
   ```jsx
   const slug = EXERCISE_IMAGES[exId];
   if (!slug) return <PlaceholderGlyph />;
   const base = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${slug}`;
   // Alternate between 0.jpg and 1.jpg every 600ms via setInterval
   ```

3. Drop `<ExerciseGif>` into:
   - The exercise rows in the Splits tab (left side, square thumbnail)
   - The "Top exercises" list in the Body-tab muscle drawer
   - The exercise picker modal

4. **Lazy-load.** Use native `loading="lazy"` on the `<img>` tag. Don't preload. The schedule shouldn't fetch 60 GIFs on mount.

5. Credit `yuhonas/free-exercise-db` (public domain) in the README and the in-app About section.

#### 3b. Sport icons in onboarding

The current sport-picker uses text chips. Replace with icon + label cards.

Use **lucide-react** (already installed in Phase 1). It has good fitness icons:

```jsx
import { Dumbbell, Bike, Mountain, Activity, Zap, Trophy, Volleyball } from 'lucide-react';

const SPORT_ICONS = {
  basketball: () => <Volleyball size={32}/>,  // close enough; lucide has no basketball
  soccer:     () => <Trophy size={32}/>,
  running:    () => <Activity size={32}/>,
  cycling:    () => <Bike size={32}/>,
  hiking:     () => <Mountain size={32}/>,
  general_strength: () => <Dumbbell size={32}/>,
  // ... map all sports in window.SPORTS
};
```

Render the picker as a 2-column grid of cards (≥80px tall, gradient bg, big icon, sport name, daysHint as sub-label).

The existing accent gradient mesh from the navbar — Massi liked that. **Apply the same gradient to the selected sport card** so onboarding feels visually consistent.

#### 3c. localStorage persistence

The user's entire app state should survive a refresh. This is critical — judges will reload the page and we *cannot* lose their split.

Implementation:

1. Create `src/state/persist.js`:
   ```js
   const KEY = 'splitlift-state-v1';

   export function loadState() {
     try {
       const raw = localStorage.getItem(KEY);
       return raw ? JSON.parse(raw) : null;
     } catch { return null; }
   }

   export function saveState(state) {
     try {
       localStorage.setItem(KEY, JSON.stringify(state));
     } catch (e) { console.warn('persist failed', e); }
   }

   export function clearState() {
     localStorage.removeItem(KEY);
   }
   ```

2. In `App.jsx`, on mount: read `loadState()`. If present, hydrate `profile`, `days`, `splitsByType`, `locked`, `onboarded`. If absent, start fresh.

3. Anywhere state mutates (every `setProfile`, `setDays`, `setSplitsByType`, etc.), call `saveState(...)` after. Easiest: use a single `useEffect` that watches all top-level state and writes on change with a 500ms debounce.

4. **Profile → Danger Zone → "Reset all data"** already exists. Wire it to `clearState()` + page reload.

5. **Versioning.** The KEY includes `-v1`. If we ever change the state shape, bump to `-v2` and old state will be ignored (rather than crashing).

### Phase 4 — Polish & demo-readiness

1. **Add a loading skeleton on the Body tab.** When the .glb is fetching, show a nice skeleton instead of a blank canvas. Use the 2D anatomy ghost.

2. **Add a one-time intro hint** the first time a user opens the Body tab: "Tap any muscle to see exercises that hit it." Auto-dismiss after 4s or on first tap.

3. **Update `README.md`** with:
   - New run instructions (`npm install && npm run dev`)
   - The Z-Anatomy attribution
   - free-exercise-db attribution
   - Lucide credit (ISC)
   - R3F + drei credits (MIT)
   - A "What changed in this rebuild" section

4. **Add `npm run dev -- --host` to package.json scripts** as `"dev:lan": "vite --host"` so Massi can demo on phones from his laptop.

5. **Test the full flow on a real phone** before declaring done. Massi will use his own phone connected to his laptop's wifi.

---

## What you must NOT change

- Onboarding's 4-step structure (sport → you → training → template). Massi just rebuilt this in Batch 8.
- The Schedule tab's tap-first design. Don't reintroduce drag-and-drop on the Schedule.
- The General-tab unit toggles (cm/ft, kg/lb).
- Any of the math: BMR, TDEE, macros, Tanaka HR, coverage scoring.
- The bottom-nav order (General → Splits → Schedule → Body → Dashboard).
- The split templates list and rankings.
- The CSS variables and color tokens.

If you think one of these *should* change, tell Massi first. Don't unilaterally redesign.

---

## Performance budget (phone, mid-tier Android)

| Metric | Target | Hard fail |
|---|---|---|
| Time to interactive | < 3s | > 6s |
| 3D model load | < 2s | > 5s |
| 3D frame rate (idle orbit) | 60fps | < 30fps |
| 3D frame rate (camera tween) | 45fps | < 25fps |
| Bundle size (initial JS) | < 400 KB | > 800 KB |
| `anatomy.glb` size | < 5 MB | > 8 MB |

If any "hard fail" threshold is hit, stop and tell Massi. Don't ship something broken on phones.

---

## Acceptance criteria

You're done when ALL of these are true:

- [ ] `npm run dev` starts the app, no console errors
- [ ] `npm run build` produces a `dist/` folder, no warnings about chunk size > 800 KB
- [ ] Onboarding completes successfully on first load (refresh → no onboarding shown again)
- [ ] All 6 tabs render without errors on a 380px viewport
- [ ] Body tab loads the .glb model in under 2s on a wired connection
- [ ] Tapping a muscle on the 3D model: highlights it, tweens the camera, opens the drawer with status pill / coverage bar / top exercises
- [ ] **3D model has NO visible eyeballs, teeth, tongue, skull, or bones** — only smooth muscles. Looks like a fitness-app muscle map, not a med-school anatomy diagram.
- [ ] **`VISUAL_STYLE` constant is exposed at the top of `AnatomyModel.jsx`** so Massi can flip between `'clean'` and `'no_head'` in one line if he prefers the no-head look at demo time.
- [ ] **Mesh inventory logs to console in dev mode** (one-time, on first model load) showing every mesh's name + whether it's mapped to a muscle / hidden as gore / hidden as unmapped.
- [ ] 3D ↔ 2D toggle works both directions; 2D fallback auto-engages if .glb fails to load
- [ ] Exercise GIFs appear in Splits tab and exercise pickers, lazy-loading correctly
- [ ] Sport-picker in onboarding shows icons (not text chips) on a 2-column grid
- [ ] Refreshing the page restores the user's profile, days, splits, locked days exactly as they were
- [ ] "Reset all data" in Profile clears localStorage and returns to onboarding
- [ ] All three credit blocks present in README: Z-Anatomy (CC-BY-SA), free-exercise-db (public domain), R3F + drei (MIT)
- [ ] `LICENSE-MODEL.txt` is in `public/models/`
- [ ] `npm run dev:lan` script exists for phone-on-same-wifi demos

---

## Plan-then-execute protocol

When you read this, do NOT immediately start coding. First:

1. Read every existing `splitlift-*.jsx` file end to end.
2. Read `app.html` for the CSS.
3. Identify any place where the prompt above conflicts with the existing code (e.g. an export name doesn't match what I assumed). Tell Massi about each conflict.
4. Tell Massi: "Here's my migration plan: [bullets]. I'll start with Phase 1. Approve?"
5. Wait for approval.
6. Execute Phase 1. Report back. Get approval.
7. Execute Phase 2. Report back. Get approval.
8. Execute Phases 3 and 4 together. Report back.

This is a hackathon and Massi is on a deadline. Don't ask 20 clarifying questions — make reasonable defaults, document them in your plan message, and proceed once approved.

---

## When you finish

Tell Massi:
1. What works
2. What's still rough (be honest — if FPS is 35 not 60, say so)
3. What he should test on his phone before the demo
4. Estimated bundle size and load time (run `npm run build` and read the output)
5. Any deferred items he should know about

Good luck. Make it slick.
