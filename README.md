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
- `splitlift-data.jsx` — exercise DB, sports, scoring math, cardio library
- `splitlift-templates.jsx` — split templates (PPL, Upper/Lower, Full body, Bro, hybrid, Custom) + sport-aware ranking
- `splitlift-anatomy.jsx` — detailed front/back anatomy SVG with named muscle regions
- `splitlift-brand.jsx` — dumbbell mark + wordmark lockup
- `splitlift-tabs.jsx` — Schedule, Dashboard, Cardio, Body, Profile tab content
- `splitlift-app.jsx` — root, routing, onboarding, header, bottom nav

---

## Credits

Per BroncoHacks rule 7 ("All libraries / frameworks / open-source code must be credited"):

- **React 18** — UI library, MIT license, loaded via unpkg
- **Babel Standalone** — in-browser JSX compilation, MIT license, loaded via unpkg
- **Free Exercise DB by yuhonas** — exercise dataset reference, public domain
- **Mifflin–St Jeor equation** — Mifflin et al. (1990), Am J Clin Nutr (BMR formula)
- **Tanaka heart-rate formula** — Tanaka et al. (2001) (max HR estimation)

Libraries to be credited as they're added in later batches:
- Lucide Icons (ISC) — when SVG icon set is migrated
- Three.js + GLTFLoader (MIT) — when the 3D anatomy model is wired up in Batch 6
- Z-Anatomy / BodyParts3D model (CC-BY-SA 4.0) — when the .glb is added; credit Gauthier Kervyn (Z-Anatomy) and the BodyParts3D project (Database Center for Life Science, Japan)

---

## Changelog

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
