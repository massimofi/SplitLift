# SplitLift

> Generates and lets you edit personalized weekly lifting splits — sport-tailored exercises, a clickable 3D anatomy with raycasting + camera zoom, cardio prescriptions, and nutrition targets — all from 5 inputs.

**BroncoHacks 2026 submission.** Track: Sports & Fitness · Prize: Best UX/UI Design.

---

## Run locally

```bash
npm install
npm run dev          # vite dev server on http://localhost:5173
npm run dev:lan      # same, but exposes on your LAN for phone testing
npm run build        # produces dist/
npm run preview      # serve dist/ locally
```

Designed for a 380 px-wide phone viewport. Use Chrome DevTools' device emulation or `npm run dev:lan` + your phone on the same wifi.

---

## Tech stack

- **Vite 5** + **React 18.3** (no TypeScript — speed over types)
- **react-body-highlighter** for the clickable muscle SVG in the Body tab
- **lucide-react** for sport icons in onboarding
- All CSS is hand-written in `src/index.css` (no Tailwind / styled-components)
- `localStorage` persistence for full app state, key: `splitlift-state-v1`

> **Note on the Body view.** We initially built the Body tab as a Three.js + react-three-fiber 3D anatomy loaded from a Z-Anatomy `.glb`, but the freely-licensed Sketchfab export had stripped mesh names — making per-muscle clicking unreliable enough to bench it on a hackathon timeline. Pivoted to react-body-highlighter (MIT) which ships front + back SVG silhouettes purpose-built for fitness apps, with built-in click handling and intensity-based highlighting. The same coverage data + drawer / smart-add UX sits on top.

## Project layout

```
src/
├── App.jsx                       # screen router + state hydration
├── main.jsx                      # ReactDOM mount
├── index.css                     # all CSS (~2300 lines, single file)
├── data/
│   ├── exercises.js              # EXERCISES, SPORTS, BMR/TDEE/macros/HR math
│   └── templates.js              # SPLIT_TEMPLATES, ranking, planForSport
├── lib/
│   ├── splits.js                 # splitsByType helpers + makeDayForType
│   ├── confetti.js               # one-shot confetti burst
│   ├── StatusBar.jsx             # fake iPhone status bar
│   └── Toaster.jsx               # toast list
├── components/
│   ├── Anatomy2D.jsx             # detailed 2D anatomy SVG (front + back)
│   ├── Anatomy3D/                # R3F 3D anatomy
│   │   ├── Anatomy3D.jsx         # <Canvas> wrapper, lights, OrbitControls
│   │   ├── AnatomyModel.jsx      # useGLTF + mesh filter + recolor
│   │   ├── mapMeshNameToMuscle.js
│   │   └── useCameraTween.js     # easeOutCubic camera lerp on focus change
│   ├── Brand.jsx, Icons.jsx, SportIcons.jsx
│   ├── ExerciseGif.jsx           # animated thumbnail (free-exercise-db)
│   ├── CmdK.jsx, LibrarySheet.jsx, CardioSheet.jsx, CoveragePanel.jsx
├── screens/
│   ├── Landing.jsx, Login.jsx, Onboarding.jsx, MainApp.jsx
├── tabs/
│   ├── GeneralTab.jsx            # inputs + computed BMR/TDEE/macros/HR
│   ├── SplitsTab.jsx             # per-day-type exercise editor
│   ├── ScheduleTab.jsx           # week view, drag palette + tap picker
│   ├── BodyTab.jsx               # 3D + 2D fallback (lazy-loaded)
│   ├── DashboardTab.jsx          # scores, sport, weekly time, streak
│   └── ProfileTab.jsx            # settings, privacy, danger zone (reset)
└── state/
    └── persist.js                # versioned localStorage save/load/clear

public/
└── models/
    ├── anatomy.glb               # Z-Anatomy Myology (CC-BY-SA, 8.5 MB Draco-compressed)
    ├── LICENSE-MODEL.txt         # required CC-BY-SA attribution
    └── README.md                 # how to source / decimate the model
```

## What's the 3D model?

**Z-Anatomy "Myology"** by Gauthier Kervyn (CC-BY-SA 4.0) — itself a derivative of BodyParts3D (Database Center for Life Science, Japan). The .glb has been Draco-compressed and decimated to ~50% triangle count.

The Body tab loads the model lazily (only when you open the tab), then:
1. Hides every mesh whose name matches a "gore" pattern (eyeballs, teeth, bones, organs — see `HIDE_PATTERNS` in `AnatomyModel.jsx`).
2. Maps each remaining mesh to one of 17 canonical muscle keys via `mapMeshNameToMuscle()`.
3. Recolors meshes by coverage status (dark = unworked, blue = under, teal = optimal, coral = over).
4. Tap a muscle → highlight + camera tween + drawer with status, target band, exercises, smart-add.

**Three visual presets** at the top of `AnatomyModel.jsx`:
- `'clean'` (default) — muscles only, no head/face/skeleton
- `'no_head'` — same but also crops above the neck
- `'full'` — everything visible (debug only)

A dev-only mesh inventory log prints in DevTools the first time the model loads, showing which meshes mapped to muscles vs hidden.

If the .glb fails to load or WebGL context is lost, the Body tab silently falls back to the detailed 2D anatomy SVG.

## Performance

Initial JS payload: **~256 KB / 78 KB gzipped** (under the 400 KB target).
Body-tab chunk (Three.js + R3F + drei): **~887 KB / 243 KB gzipped**, lazy-loaded only when the user opens Body.
Model: **8.5 MB** (Draco compressed). Loads in 1–3 s on wifi.

## Credits

Per BroncoHacks rule 7:

- **React 18** (MIT) — Meta
- **Vite 5** (MIT) — Evan You / Vite team
- **react-body-highlighter** (MIT) — Gia Vinh
- **lucide-react** (ISC) — Lucide contributors
- **Z-Anatomy "Myology"** (CC-BY-SA 4.0) — Gauthier Kervyn; derivative of BodyParts3D (Database Center for Life Science, Japan). Originally used for the planned 3D anatomy and removed during the body-highlighter pivot. `public/models/LICENSE-MODEL.txt` kept for archival.
- **Free Exercise DB** (public domain) — yuhonas / GitHub. Used for the 2-frame animated exercise thumbnails (`raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/...`).
- **Mifflin–St Jeor equation** — Mifflin et al. (1990), Am J Clin Nutr. Used for BMR.
- **Tanaka heart-rate formula** — Tanaka et al. (2001). Used for max HR + zones.

## What changed in this rebuild

The previous version was a single-page CDN app with Babel-Standalone compiling JSX in the browser and every module dumping its exports onto `window`. This rebuild migrates to a proper Vite + ESM project and replaces the hand-rolled vanilla-Three.js Body view with react-three-fiber. See `CLAUDE-CODE-PROMPT.md` for the full spec we executed against.

Highlights:
- All ~10 source files now use proper ES `import` / `export` (no more `window.X`).
- Three new features: animated exercise GIFs, sport icons in onboarding, and full-app `localStorage` persistence (refresh = no data loss).
- 3D anatomy is now the default Body view; 2D is the fallback.
- Body tab is code-split so the 3D bundle only loads when needed.

## Changelog

### 2026-04-26 — v0.2.0 — Vite + R3F migration (BroncoHacks build)

- **Phase 1:** Hand-scaffolded Vite project, converted every `splitlift-*.jsx` from window-attached globals to proper ES modules. Six tabs in their own files. CSS extracted verbatim from `app.html`. Build green.
- **Phase 2:** New `src/components/Anatomy3D/` with `Anatomy3D.jsx` ([Canvas]), `AnatomyModel.jsx` (useGLTF + mesh filter + recolor), `mapMeshNameToMuscle.js`, `useCameraTween.js`. Loads `public/models/anatomy.glb` (Z-Anatomy Myology, Draco-compressed). `HIDE_PATTERNS` strips eyeballs/teeth/bones/organs so the body looks like MuscleWiki, not a med-school diagram. `VISUAL_STYLE` constant for clean / no-head / full presets. Dev-mode mesh inventory log.
- **Phase 3:** `ExerciseGif` component (alternates `0.jpg`/`1.jpg` from yuhonas/free-exercise-db every 600 ms, lazy-loads, falls back to dumbbell glyph). Lucide-react sport icons in the onboarding sport-picker, with the accent gradient on the selected card. `src/state/persist.js` — versioned localStorage with debounced save; `App.jsx` hydrates on mount.
- **Phase 4:** One-time intro hint on Body ("Tap any muscle to see exercises that hit it"), dismisses after 4 s or on first tap. `npm run dev:lan` script for phone-on-wifi demos. Old `splitlift-*.jsx` + `app.html` deleted.
