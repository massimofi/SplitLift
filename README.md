# SplitLift

> Generates and lets you edit personalized weekly lifting splits — sport-tailored exercises, a clickable body map, cardio prescriptions, and nutrition targets — all from 5 inputs.

**BroncoHacks 2026 submission.** Track: Sports & Fitness · Prize: Best UX/UI Design.

---

## Run locally

It's a static site — no install, no build step.

```bash
# clone
git clone https://github.com/massimofi/SplitLift.git
cd SplitLift

# any static server works; pick one:
python3 -m http.server 8000
# then open http://localhost:8000/app.html
```

Or just open `app.html` directly in a browser. The CDN-loaded React + Babel will compile the JSX in the browser.

---

## Tech stack

- **React 18** loaded via unpkg CDN
- **Babel Standalone** to compile JSX in the browser
- **Pure SVG** for the anatomy figure and dumbbell brand mark
- No backend, no build, no npm install

Files (all in repo root):
- `app.html` — entry, theme tokens, all CSS, script loader
- `splitlift-data.jsx` — exercise DB, sports, scoring math, cardio library, BMR/TDEE/HR helpers
- `splitlift-templates.jsx` — split templates (PPL, Upper/Lower, Full body, Bro, hybrid, Custom) + sport-aware ranking
- `splitlift-anatomy.jsx` — detailed front/back 2D anatomy SVG with named muscle regions
- `splitlift-3d.jsx` — Three.js canvas: loads `public/models/anatomy.glb`, raycast-on-tap, camera tween, coverage-colored materials. Falls back gracefully if the model is missing.
- `splitlift-brand.jsx` — dumbbell mark + wordmark lockup
- `splitlift-tabs.jsx` — General, Splits, Schedule, Body, Dashboard, Profile tab content
- `splitlift-app.jsx` — root, routing, onboarding, header, bottom nav
- `public/models/anatomy.glb` — 3D anatomy mesh (not committed; see `public/models/README.md`)

---

## Credits

Per BroncoHacks rule 7 ("All libraries / frameworks / open-source code must be credited"):

- **React 18** — UI library, MIT license, loaded via unpkg
- **Babel Standalone** — in-browser JSX compilation, MIT license, loaded via unpkg
- **Three.js r150** — 3D rendering, MIT license, loaded via unpkg
- **Three.js GLTFLoader** — glTF binary loader, MIT license, loaded via unpkg
- **Three.js OrbitControls** — orbit camera controller, MIT license, loaded via unpkg
- **Z-Anatomy / BodyParts3D** (when `anatomy.glb` is added) — anatomical mesh, CC-BY-SA 4.0. Credit Gauthier Kervyn (Z-Anatomy) and the BodyParts3D project (Database Center for Life Science, Japan). See `public/models/README.md` for license-distribution notes.
- **Free Exercise DB by yuhonas** — exercise dataset reference, public domain
- **Mifflin–St Jeor equation** — Mifflin et al. (1990), Am J Clin Nutr (BMR formula)
- **Tanaka heart-rate formula** — Tanaka et al. (2001) (max HR estimation)

Libraries to be credited as they're added:
- Lucide Icons (ISC) — when SVG icon set is migrated

---

## Changelog

### 2026-04-25 — Batch 6: 3D anatomy with click-to-zoom
- New `splitlift-3d.jsx` mounts a Three.js scene (r150 via UMD CDN: `three.min.js` + `examples/js/loaders/GLTFLoader.js` + `examples/js/controls/OrbitControls.js`). Loads `public/models/anatomy.glb`, auto-fits, sets up hemisphere + key + fill lights, OrbitControls (damping, no pan, clamped distance), and a render loop.
- Click / tap → raycasts against the loaded model. Each mesh's name is fuzzy-mapped to one of the 17 canonical muscle keys (`mapMeshNameToMuscle()`). Tap is distinguished from drag by a touch-distance threshold so orbit + select feel right on mobile.
- Selected muscle: bright emissive highlight + camera tween (easeOutCubic, 700 ms) to a fitted distance along the user's current view direction. Deselect (or close drawer) tweens back to the default body framing.
- Mesh recolor by coverage status: dark `#393B5E` if unworked, blue if under, teal if optimal, coral if over. Sport-priority muscles get a priority pill in the drawer.
- `Anatomy3DCanvas` reports `'loading' | 'ready' | 'failed'` via `onStatus`. **`BodyTabV2` defaults to 3D when `window.Anatomy3DCanvas` exists, then auto-falls-back to 2D if the model fails to load.** A 3D / 2D toggle always lets the user switch manually (mobile GPU choke).
- Drawer rebuilt: status pill (in band / under / over / unworked), sport-priority pill, **`CoverageProgress` bar** showing where the user's set-count sits in the [min, max] band, top-8 exercises (with `hit %`), smart "Add" that routes to the best matching split-type via `bestSplitTypeFor()`, and "Edit relevant split →" jump.
- Coverage list switched to granular `MUSCLE_LABELS_V2` keys (12 most-relevant) so "Lats / Traps / Rear delts" show separately instead of a vague "Back".
- Added `public/models/README.md` with sourcing + license + mesh-naming docs. The directory exists so the relative URL is stable; the `.glb` itself is not in the repo (CC-BY-SA scope), so the demo currently shows the 2D fallback until you drop one in.

### 2026-04-25 — Schedule v3 + Batches 5–9 (mostly)
**Schedule rebuilt for tap *and* drag.** Two-column grid: a 92 px sticky left palette of split + cardio chips, and a right column of bigger day boxes (≥86 px) with fatter colored left borders. Drag a chip onto a day OR tap a day to open the picker sheet (lift type chips, cardio adds with HR badges, lock/clear, jump-to-Splits). Day rows have a hover/drop-glow during drag.

**Dashboard body figure shrunk to ~60% width / max 220 px** and moved to the bottom of the default widget order — it's a teaser, not the centre. Will become a 3D model once the asset is in.

**Batch 5 (cardio enhancements within Schedule):** Cardio rows in the day picker now show target HR range (computed from `profile.age` via Tanaka), e.g. "30 m · 4.5 mi · 115–135 bpm". A "Why this much?" expandable explains the weekly target + CDC baseline. New `cardioHRZone(cardio, profile)` helper.

**Batch 6 (Body / 3D):** No new code. The detailed 2D `Anatomy3D` (front+back faux-3D rotation) is the mandated fallback from CLAUDE.md §6 and continues to back the Body tab + Dashboard figure. The Three.js + GLTFLoader integration is parked until an `anatomy.glb` is added to `public/models/`.

**Batch 7 (Profile = settings only):** Dropped Body & Training section (covered by General). Replaced emoji icons throughout with cleaner text. New Danger zone with Reset all data + inline confirm. `Row` component gained an optional sub-line.

**Batch 8 (Onboarding rebuilt):** New 4-step flow — Sport → You (height + weight + age + gender, 4 options M/F/NB/Prefer not to say) → Training (days + cardio target) → Pick template (top-3 sport-fit, best auto-selected). On finish, `initialDays` is computed from the picked template and the user lands on Dashboard. `Root` threads `bootState` ({initialDays, initialTab}) into `MainApp`. Default `locked` array reset to all-false.

**Batch 9 (touch-target sweep + emoji audit):** Bumped `.gt-step-btn` (36→44 px), `.chip` (38→44 px), `.b2-d-r-add` (36→44 px). Replaced the last `＋` typographic plus and `✕` emoji with SVG icons. `c2-i-x` and `b2-d-x` close buttons promoted to 44 px. Added `aria-label` on close/add buttons.

### 2026-04-25 — Batch 4: Dashboard polish (rotating figure, persisted order, split label)
- New `DashAnatomy` widget: slow-rotating front/back anatomy SVG (~16s per rotation, ~22°/s) using `requestAnimationFrame`. Tap to pause, tap again to resume. Replaces the static `BodyHeatmap` figure.
- Widget order is now persisted in `localStorage` under `sl-dash-order`. Initial load merges stored order with any new widget IDs that didn't exist when saved (forwards-compatible).
- Sport widget gains a "SPLIT — [name]" pill that detects the current schedule pattern and matches it against known templates (e.g. "Push / Pull / Legs", "Upper / Lower"); falls back to a "/-joined" list of distinct lift types or "Custom" if it can't match.
- Default widget order moves the body figure to the top.

### 2026-04-25 — General tab + Schedule rebuilt for tap-first UX
On user feedback ("the schedule tab is very unintuitive… make it really nice and UI friendly… inputs are kind of guided by the order of the navbar"):

- **Bottom nav reordered to General → Splits → Schedule → Body → Dashboard.** Default tab is now `general`, so the user lands on inputs / stats first and walks rightward through the build flow.
- **New General tab** (`splitlift-tabs.jsx`): editable input tiles for sport, age, sex, days/wk, cardio target, height, weight (with cm/ft and kg/lb unit toggles per tile), plus a read-only "Your numbers" grid for BMR, TDEE, protein/fat/carbs targets, and Tanaka max-HR + Z2 zone. New `SportSheet` modal for sport pick.
- **Schedule rebuilt as vertical day-rows** instead of a tiny 7-column grid + drag palette. Each day is a full-width tappable row showing day-type, cardio pills, lock indicator, and a today badge. Tapping a row opens a single `DayPickerSheet` that handles lift type (chip grid), cardio adds, lock/unlock, clear, and a quick "Edit Push exercises →" jump into Splits. Drag is gone — tap is the primary mechanism on mobile.
- **Profile defaults gained `age` (22), `sex` (`'m'`), `cardioMin` (90), and lost `pulse`.** Onboarding step 2 now only asks height + weight (the resting-pulse field is removed). Pulse references in the JSX layer are fully gone (the only remaining "pulse" is a CSS animation class name on the anatomy SVG, unrelated).
- **New math helpers in `splitlift-data.jsx`:** `activityMultiplier(days)`, `tdeeFor(profile)`, `macrosFor(profile, tdee)` (1.8 g/kg protein, 25% fat, carbs remainder), and `hrZonesFor(age)` (Tanaka max-HR + Z2 / tempo / HIIT bands).
- **CmdK** now lists General first and drops Cardio from the tab list (Cardio still has its own page reachable from Schedule and Dashboard).
- Removed the now-dead `.pal-row`, `.pal-pill`, `.cd-dots`, `.lock-mark`, `.day-actions` CSS.

### 2026-04-25 — Batch 3: Splits tab is now a per-day-type editor
- Single source of truth for "what's in a Push day" is now `splitsByType` (object: `{push:[exId,...], pull:[...]}`). Editing it propagates to every day in the week with that type, so Push-day-1 and Push-day-2 share the same exercise list.
- New `SplitsTab` (in `splitlift-tabs.jsx`): horizontal chip row of types currently in the schedule → exercise list (full-bleed muscle color, ≥64 px tall, one-tap delete) → single Add button → lightweight `SplitExSheet` filtered by `exercisesForDayType()`.
- `makeDayForType()` now consults `splitsByType` first and only falls back to a sport-priority pick when no list exists for that type. PresetsSheet's apply-template / auto-build paths sync new types into `splitsByType` after rebuilding days.
- Tapping a day-type chip in Schedule's drag palette jumps to Splits with that type pre-selected.
- The old per-day-card list (`DayCard`/`ExerciseRow`/`onDragStartCard`) is no longer rendered on the Splits tab; left in `splitlift-app.jsx` for now since other batches may reuse the drag-between-days flow elsewhere.

### 2026-04-25 — Batch 2 follow-up: Schedule = literally the schedule
On user feedback ("very mobile friendly, easier to use — schedule should literally only be the schedule"), the Schedule tab was pared back to a single surface:
- Just a tiny title bar with a single **Presets** button, the week grid, and a flat horizontal-scroll palette with two rows: **SPLITS** and **CARDIO**. Drag any chip onto any day. Splits replace the day-type; cardios append to that day.
- Day cells now show small colored dots for each cardio session on that day; tap a day to open a compact action sheet with **Lock / Unlock**, **Clear day**, and a removable list of that day's cardios.
- Templates / suggested-for-sport / auto-build moved into a `PresetsSheet` modal that opens only when the Presets button is tapped — none of that lives on the main schedule surface anymore.
- Removed the `.sched-hero`, `.tpl-row`, `.tpl-card`, `.inline-picker`, `.palette-grid`, `.pal-chip` styles to keep the CSS in sync.

### 2026-04-25 — Batch 2: split-template picker + schedule polish
- New `splitlift-templates.jsx` owns the template catalog (Full body × 2/3, PPL × 3/5/6, Upper/Lower, Bro split, UL+PPL hybrid, Sport-focused, Custom).
- Added `rankTemplatesForSport()` — scores each template against the sport's muscle-priority weights and a days/week target; the Schedule tab now surfaces the top 3 as a "Suggested for [sport]" strip (one tap to apply).
- Schedule tab now has a tap-to-clear path: tapping any day opens an inline picker with **Lock / Unlock** and **Clear day** actions before the day-type chips. Removed the cramped per-cell lock toggle (which used 🔒/🔓 emoji and a 22 px hit area, violating Rules 1 and 8) — replaced with a non-interactive lock indicator inside locked cells.
- Bumped `.ip-chip` to a 44 px min-height, swapped picker close button to an SVG.
- `splitlift-data.jsx` no longer owns templates; `planForSport()` resolves them via `window.SPLIT_TEMPLATES`.

### 2026-04-25 — Batch 1: brand + header + nav icons
- New `splitlift-brand.jsx` with `BrandMark` (gradient-tile dumbbell) and `BrandLockup` (mark + "SplitLift" wordmark).
- Landing page now uses the dumbbell lockup instead of the placeholder "S" tile.
- Compact app header now uses `BrandMark`; header capped at ~56px tall, single-line.
- Bumped `.icon-btn` (40 → 44 px) and `.avatar-mini` (36 → 44 px) to meet the 44×44 touch-target rule. Avatar promoted to a real `<button>` with `aria-label`.
- Bottom nav already used a dumbbell glyph for Splits — confirmed and left as-is. All `bn-item` cells already exceed 44×44.
- Initialized this README with run-locally instructions and credits.
