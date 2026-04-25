# SplitLift — Claude Code Context (CLAUDE.md)

> Read this entire file at the start of every session. It contains rules, architecture, and the active work plan. Do not deviate from the rules without asking the user first.

---

## 0. Project context

**SplitLift** is a hackathon submission for **BroncoHacks 2026** at Cal Poly Pomona, April 25–26, 2026.

- **Submission track:** Sports & Fitness
- **Prize category:** Best UX/UI Design
- **Hard deadline:** Sunday 4/26/26, 12:30 PM PDT (no exceptions per hacker packet)
- **Judging criteria (out of 55 pts total):** Impact 10, Functionality 10, UX/Design 10, Creativity 5, Technical Complexity 10, Presentation 10
- **Submission requirements:** Public GitHub repo (`massimofi/SplitLift`), 2–3 min demo video on Devpost, all libraries credited in README
- **Repo:** `https://github.com/massimofi/SplitLift.git`

### What SplitLift does (one-liner for the demo)

Generates and lets users edit personalized weekly lifting splits, with sport-tailored exercise selection, a clickable body map showing muscle coverage in real time, cardio prescriptions, and nutrition targets — all from 5 inputs.

### Core flow

**Inputs (onboarding):** sport, weight, height, gender (male / female / non-binary / prefer not to say), days per week, desired cardio amount.

**Auto-generated from inputs:** 2–3 split template options (PPL, Upper/Lower, Full Body, Bro Split — pick what fits days/week). User picks one. App fills in exercises tailored to sport + body stats. Cardio plan and nutrition targets are also generated.

**Editable:** the schedule (which days are which split-types), the split (which split-type each day is), the exercises within each day, the cardio activities. Everything customizable.

---

## 1. Tech stack — DO NOT CHANGE WITHOUT EXPLICIT USER APPROVAL

This is a **static-site project, no build step, no backend.** Adding npm/Vite/Express mid-hackathon is a trap and will cost the demo. The current architecture has been deliberately chosen to minimize failure modes.

### Current files and roles

- `app.html` — entry point. Loads React 18 + Babel Standalone from CDN. Loads each `.jsx` file via `<script type="text/babel">` tags. Order matters: data → anatomy/bodymap → tabs → app.
- `splitlift-data.jsx` — exercise database, sport profiles, scoring functions, `EXERCISES` array, `setsForExercise`, `TARGETS`. Attached to `window`.
- `splitlift-anatomy.jsx` — detailed anatomy SVG (front + back, ~17 muscle groups, faux-3D with rotateY). Exports `Anatomy3D`, `AnatomyFront`, `AnatomyBack`, `computeCoverageV2`, `exercisesForMuscle`, `MUSCLE_LABELS_V2`, `TARGETS_V2`.
- `splitlift-bodymap.jsx` — older simpler body map. **Likely deprecated** — confirm by searching for usages before deleting; if `Body3D` / `BodyFront` / `BodyBack` are still referenced, keep them, otherwise remove.
- `splitlift-tabs.jsx` — tab content components.
- `splitlift-app.jsx` — main app shell, routing between tabs.
- `deck-stage.js` + `SplitLift_Deck.html` — separate pitch deck. Don't touch unless asked.

### Pattern for new code (mandatory)

Every new component file follows this exact pattern:

```jsx
// my-new-file.jsx
function MyNewComponent({ prop1, prop2 }) {
  return <div>...</div>;
}

// Helper functions
function myHelper() { ... }

// Attach to window so other files can use them
Object.assign(window, { MyNewComponent, myHelper });
```

Then in `app.html`, add a script tag in the correct position:

```html
<script type="text/babel" src="my-new-file.jsx"></script>
```

**Never use `import` / `export` / `require`.** No JSX transpiler runs at build time — Babel runs in the browser at load time, and ES module syntax breaks it. If you find yourself wanting `import`, attach to `window` instead.

### Adding npm libraries — what to do

If a feature needs a library, prefer the CDN version. Add to `app.html`:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r150/three.min.js"></script>
```

For Three.js specifically, also load `GLTFLoader` and `OrbitControls` from `examples/jsm/...` via CDN (see Three.js section below). React Three Fiber will NOT work without a build step — use vanilla Three.js.

### Backend / hosting

- **No backend server.** Skipped per user decision (insufficient time).
- **3D model hosting:** model file lives in repo at `public/models/anatomy.glb` and is fetched by relative URL. GitHub Pages or Vercel both serve static files for free.
- **Persistence:** `localStorage` only. Wrap reads in try/catch — Safari private mode throws.

---

## 2. Iron-clad coding rules (no exceptions)

1. **Touch targets ≥ 44×44 px** on every interactive element. The user said his "giant ahh fingers" need to work with this. Make buttons obvious and chunky. Add visible hit-area padding even when the visual is smaller.

2. **Color filling on chips/buttons.** When a filter chip, exercise card, or status indicator has a color (muscle group, intensity, push/pull/legs type, etc.), fill the entire background with that color, not a tiny dot at the corner. Use white or near-black text on top with sufficient contrast.

3. **Pulse field is dead.** Find every reference to "pulse" — UI, state, props, data, labels, comments — and remove it.

4. **Brand: dumbbell logo.** The SplitLift logo must include a dumbbell. The Splits tab icon in the bottom navigation must also be a dumbbell. Use an SVG, not an emoji.

5. **Mobile-first.** The user demos on mobile. Every change must look correct at 375px width. Test by adding `width: 375px` to a wrapper temporarily, or use browser device emulation.

6. **No browser-native dialogs.** No `alert()`, `prompt()`, `confirm()`. Build inline UI for every interaction.

7. **Bottom-nav dumbbell, hand on Splits, gear on Profile.** Standard icons. Don't invent custom icons that aren't recognizable in 16px.

8. **No emojis as UI affordances.** Emojis are inconsistent across platforms and look unprofessional in a UI judged on design. Use Lucide-style SVG icons inline or load Lucide via CDN.

9. **Granular muscle categorization.** Exercise muscle hits must use the detailed groups in `splitlift-anatomy.jsx` (`MUSCLE_LABELS_V2`): chest, shoulder, rear_delt, biceps, triceps, forearm, abs, obliques, lats, traps, lower_back, quads, hams, glutes, calves, hip_flex, adductors. The old aggregate keys (back/arms/core) should be remapped via `HITS_REMAP`. A pull-up's `hits` field should target `lats`, not `back`.

10. **Color palette continuity.** Don't redesign the visual language. Keep the existing `app.html` background, fonts, and primary accent. Adjustments OK; full redesign NOT OK.

11. **No external API calls at runtime.** Everything ships as static files. No fetch to OpenAI, no fetch to anyone except your own static assets.

---

## 3. Workflow rules — follow every batch

After completing each batch:

1. **Update `README.md`.** Keep features, stack, and credits current. Append to a `## Changelog` section at the bottom with the date and what changed.
2. **Commit and push:**
   ```bash
   git add -A
   git commit -m "Batch N: <one-line summary>"
   git push origin main
   ```
3. If `git push` fails with auth errors, stop and tell the user — do not try to fix git auth automatically.
4. **Pause and wait for user confirmation** before starting the next batch. Don't chain batches.
5. If a batch reveals scope creep (e.g., a "small" change requires migrating to Vite), stop and ask the user before proceeding.

---

## 4. Library credits — README must list these

Per BroncoHacks rule 7, all libraries/frameworks/open-source code must be credited. Maintain a `## Credits` section in README with at least these entries (add to it as new libraries are introduced):

- **React 18** — UI library, MIT license, loaded via CDN (unpkg)
- **Babel Standalone** — in-browser JSX compilation, MIT license, loaded via CDN
- **Lucide Icons** (when added) — icon library, ISC license
- **Three.js** (when 3D is added) — 3D rendering, MIT license
- **glTF Loader** (when 3D is added) — Three.js example loader
- **Z-Anatomy / BodyParts3D** (when 3D model is added) — anatomy 3D model, CC-BY-SA 4.0 license. Credit Gauthier Kervyn (Z-Anatomy) and the BodyParts3D project (Database Center for Life Science, Japan).
- **Free Exercise DB by yuhonas** — exercise dataset, public domain
- **Mifflin–St Jeor equation** — Mifflin et al. (1990), Am J Clin Nutr
- **Tanaka heart-rate formula** — Tanaka et al. (2001)

CC-BY-SA license note: if Z-Anatomy is used, the entire SplitLift project must be released under a compatible CC-BY-SA-or-similar license, OR only the model file itself must be redistributed under CC-BY-SA. Add a `LICENSE-MODEL.txt` next to the .glb file with the upstream attribution. Do NOT remove the original creator credits from the model metadata.

---

## 5. The active work plan — execute these batches in order

The user has approved this batch sequence. Execute Batch 1, then **stop and ask** before Batch 2.

### Batch 1 — Brand, header, navigation
- Design SplitLift logo: wordmark + dumbbell SVG. Use it in the top header.
- Shrink top header to a compact headline (one line, ~56px tall on mobile).
- Replace the bottom-nav Splits icon with a dumbbell SVG.
- Audit other nav icons — keep Schedule/Calendar, Body/anatomy figure, Dashboard chart, Profile gear. Any tap target under 44×44 must be padded.

### Batch 2 — Split-template picker + new Schedule tab
- Create `splitlift-templates.jsx`: define split templates with name, description, day count, ordered list of day-types. Templates: PPL (3-day, 6-day variants), Upper/Lower (4-day), Full Body (2/3-day), Bro Split (5-day), Custom.
- "Schedule" tab: shows a 7-column week grid Mon–Sun. User can drag day-type chips (Push, Pull, Legs, Upper, Lower, Full, Rest, Sport, etc.) onto each day. Tap a filled day to clear it.
- Sport-aware autofill: given inputs, suggest the 2–3 best templates and let the user one-tap pick one to populate the schedule.

### Batch 3 — Splits tab redesign (per-day exercise editor)
- Rename: "Splits" tab now shows the per-day exercise list for whichever day-type is selected.
- Tap a day-type chip on the Schedule tab → jumps to Splits tab with that day-type's exercises shown.
- The exercise picker (already partially built) filters by the day-type's allowed muscle groups (Push = chest/shoulder/triceps; Pull = lats/traps/biceps/rear_delt/forearm; Legs = quads/hams/glutes/calves/adductors).
- Exercise cards: full-bleed muscle color, large tap targets, drag handle, one-tap delete.

### Batch 4 — Dashboard tab (full redesign — replaces "Score")
- Rename tab from "Score" → "Dashboard".
- Layout: rotating body figure at top (uses the existing Anatomy3D, slow auto-rotate, can be paused on tap).
- Stat cards (large, readable, draggable widgets): Sport name, Days lifting per week, Hours lifting per week + per day, Weight, Height, Lifting score (0–100), Cardio score (0–100), Under-worked muscles list (text list, max 3), Lifting split name (e.g., "Push/Pull/Legs"), Weekly volume per major group bar chart.
- Widgets are draggable to reorder via simple HTML5 drag-and-drop or a tiny custom implementation. Persist order in localStorage.
- Lifting score formula (transparent, deterministic): % of muscle groups in optimal volume range × 100, plus bonuses for hitting sport-priority muscles. Cardio score: actual weekly cardio minutes ÷ recommended × 100, capped at 100.

### Batch 5 — Cardio tab redesign
- Weekly cardio plan: each cardio day shows type, miles or duration, target heart rate range, and intervals (if HIIT).
- Editable: tap a cardio block to swap modality (run/bike/row/swim/sport practice) and adjust duration.
- "Why this much?" expandable explainer.

### Batch 6 — Body tab (3D model integration)
- Add Three.js + GLTFLoader + OrbitControls via CDN to `app.html`.
- New file `splitlift-3d.jsx`: loads `public/models/anatomy.glb`, renders in a `<canvas>`, supports orbit controls, click-to-select-muscle (raycasting against named meshes), zoom-to-selected-muscle.
- Selected muscle: list of exercises that target it (use existing `exercisesForMuscle()` from anatomy file).
- **Fallback:** if the .glb fails to load (file missing, network issue, mobile GPU choke), gracefully fall back to the existing `Anatomy3D` SVG. The demo MUST work without the .glb.

### Batch 7 — Profile page
- Privacy & data section (everything is local-only, document this clearly).
- Units toggle (kg/lb, cm/ft-in).
- Edit inputs (sport, weight, height, gender, days/week, cardio amount). Gender options: Male / Female / Non-binary / Prefer not to say.
- "Reset all data" button (with inline confirm UI).
- Remove pulse field if not yet removed.

### Batch 8 — Onboarding flow upgrade
- Remove pulse field.
- Gender selector with the 4 options.
- Sport-aware auto-plan generation from sport + weight + height + days + cardio amount.
- After submit: show 2–3 split template options ranked by sport-fit, user picks one, schedule populates, app drops user on Dashboard.

### Batch 9 — Touch-target sweep + final polish
- Run through every interactive element. Anything under 44×44 gets padding.
- Audit color contrast (4.5:1 minimum for body text).
- Empty states for every tab. No "no data" — use opinionated copy.
- Final mobile layout pass at 375px.

---

## 6. The 3D model — how to actually do this

### Source

Use the **Z-Anatomy "Myology"** model: https://sketchfab.com/3d-models/myology-31b40fd809b14665b93773936d67c52c

Sketchfab provides glTF/glb download for any free model. License: CC-BY-SA 4.0.

### Steps

1. User downloads the .glb from Sketchfab (requires free account).
2. User places it at `public/models/anatomy.glb` in the repo.
3. **The .glb may be large (10–50 MB).** If over 25 MB, install Git LFS or use a compressed/decimated version. Use https://gltf.report/ to inspect and reduce mesh complexity, or use Blender to decimate.
4. The Three.js scene loads it via `GLTFLoader`.
5. To enable click-to-select, the model's child meshes must have meaningful names (e.g. `pectoralis_major_left`, `biceps_brachii_right`). After loading, traverse the scene: `model.traverse(child => { if (child.isMesh) console.log(child.name); })`. Match those names to canonical muscle keys via a lookup table in `splitlift-3d.jsx`.

### Important caveats

- **Mobile GPU performance.** A high-poly anatomy model can crater frame rate on phones. Add a desktop-only banner if FPS drops below 30, and offer a "switch to 2D view" button.
- **Loading time.** Show a skeleton loader while the .glb downloads. Don't block the rest of the app.
- **Fallback is mandatory.** If the .glb fails or the user is on slow connection, render the existing 2D `Anatomy3D` instead. Demo cannot fail.

---

## 7. Auto-generation engine — math, not magic

When the user finishes onboarding, run these calculations in order. All deterministic, no LLM, no external API.

### Step 1 — BMR & TDEE (Mifflin–St Jeor)

```
Male:    BMR = 10*kg + 6.25*cm − 5*age + 5
Female:  BMR = 10*kg + 6.25*cm − 5*age − 161
Non-binary / undisclosed:  average of male and female formulas
```

Activity multiplier from days/week trained: 2 → 1.375, 3 → 1.45, 4 → 1.55, 5 → 1.65, 6 → 1.725.

```
TDEE = BMR × activity multiplier
```

### Step 2 — Recommended split template

Based on days/week:
- 2 days → Full Body
- 3 days → PPL or Full Body (offer both)
- 4 days → Upper/Lower or PPL Rest PPL
- 5 days → Bro Split or PPL + Upper/Lower hybrid
- 6 days → PPL ×2

Sport-fit ranking: each template gets a score = sum over (sport profile weights) × (template's coverage of those muscles). Show the top 2–3 as the user's choice.

### Step 3 — Exercise selection per day

For each (day, target muscle, set count):
- Filter `EXERCISES` to those with `hits[muscle] >= 0.4` (using `expandHits()` so old aggregate keys remap correctly).
- Sort by: `hits[muscle]` weight desc, then `compound > isolation`, then experience-appropriate.
- Pick top N until set target is met. Compounds count as 1.3 toward "exercise budget" (cap session at 5–7 exercises).

### Step 4 — Cardio prescription

User-provided weekly cardio minutes is the target. Distribute across non-leg-day-heavy days. Use Tanaka max HR (`208 − 0.7 × age`). Z2 = 60–70%, HIIT working = 85–95%. Calorie burn = MET × weightKg × hours (Z2 run ≈ 7 MET, cycling Z2 ≈ 6, HIIT ≈ 10).

### Step 5 — Macros

- Protein: 1.8 g/kg (2.2 g/kg if cutting)
- Fat: 25% of TDEE / 9
- Carbs: remaining calories / 4

### Step 6 — Coverage audit

Run `computeCoverageV2()` from `splitlift-anatomy.jsx`. Anything under `target.min` flags as "under-worked". Anything over `target.max` flags as "over-worked". Surface the top 3 under-worked muscles on the Dashboard.

---

## 8. Submission deliverables checklist

By Sunday 4/26 12:30 PM PDT:

- [ ] Live URL (Vercel or GitHub Pages — Vercel recommended)
- [ ] Public GitHub repo `massimofi/SplitLift` with all changes pushed
- [ ] README with: pitch, screenshot, live URL, run-locally instructions, full credits, changelog
- [ ] 2–3 minute Devpost demo video
- [ ] Devpost submission with track = Sports & Fitness, prize = Best UX/UI
- [ ] All libraries credited in README (BroncoHacks rule 7)

---

## 9. What NOT to do (reminders that have come up)

- Don't migrate the build system. No Vite, no Next.js, no esbuild.
- Don't add Express, Firebase, Supabase, or any backend service. Static files only.
- Don't replace the existing 2D body map until the 3D version is confirmed working.
- Don't use `import`/`export` syntax in any `.jsx` file.
- Don't remove the user's previous customizations from the existing files unless explicitly asked.
- Don't use AI/LLM API calls at runtime.
- Don't submit a feature that wasn't asked for and that creates new failure modes during a 3-minute demo.
- Don't add features that need an account/login.
- Don't use the word "AI" in marketing copy. Show the math working; let it speak for itself.

---

## 10. When uncertain — ask

If a batch reveals an architectural ambiguity (e.g., "this requires a backend"), or if a request would conflict with a rule above, stop and ask the user before proceeding. The user has limited time; a clarifying question is much cheaper than a wrong batch.

End of CLAUDE.md.
