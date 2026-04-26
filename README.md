# SplitLift

> Personalized weekly lifting split planner — built around your sport's real demands, not generic templates.

Built for **BroncoHacks 2026** (Sports & Fitness track) at Cal Poly Pomona.

## What it is

SplitLift takes 5 inputs — sport, schedule, body stats, equipment, goals — and produces a personalized weekly lifting plan. No more copying influencer programs that don't fit. Sport Match Score grades your fit live, body coverage heatmap shows what your week is actually training, and weak-spot detection points out what's missing.

## Features

- **Personalized splits** based on sport, days available, experience
- **Sport-specific cardio** — 14 sports each with custom cardio profile and rationale
- **Body coverage heatmap** — interactive front/back SVG, tap any muscle for sets and intensity
- **Sport Match Score** — 0–100 grade for how well your split fits your sport, updates live
- **Health Score** — coverage-balance metric, penalizes untrained or over-trained muscles
- **Find My Weak Spots** — detects under-trained muscles, lets you add exercises directly
- **Weight tracking** — log weigh-ins, view as line chart
- **Friend comparison** — side-by-side body heatmaps (mock data, ready for real backend)

## Tech stack

- **React 18** + **Vite** — UI and tooling
- **react-body-highlighter** — anatomy SVG with per-muscle highlighting
- **Recharts** — weight chart (lazy-loaded)
- **Lucide React** — iconography
- **Satoshi** (Fontshare) — typography
- **Playwright** — automated UI smoke and data-flow tests

State persists to **localStorage** with versioned schema migrations. No backend.

## Running locally

```bash
git clone https://github.com/massimofi/SplitLift.git
cd SplitLift
npm install
npm run dev          # boots Vite at http://localhost:5173
npm run dev:lan      # binds to LAN to demo on a phone
NGROK=1 npm run dev  # demo over an ngrok tunnel (HMR via 443)
npm run build        # production build
npm run test         # all Playwright tests
npm run test:smoke   # smoke tests only
```

## Project structure

```
src/
├── components/         # Card, Button, Chip, Toggle + tab components
├── data/               # SPORTS, EXERCISES, fakeFriends, presets
├── styles/
│   └── tokens.css      # Design tokens
├── App.jsx
└── main.jsx
tests/
├── smoke.spec.js
├── data-flow.spec.js
└── screenshots/        # Gitignored
```

## Credits & attribution

### Open-source libraries

| Library | Version | License | Use |
|---|---|---|---|
| react | 18.3.1 | MIT | UI framework |
| react-dom | 18.3.1 | MIT | DOM renderer |
| react-body-highlighter | 2.0.5 | MIT | Front/back anatomy SVG with muscle highlighting |
| recharts | 3.8.1 | MIT | Weight tracking line chart (lazy-loaded) |
| lucide-react | 0.453.0 | ISC | Icon set |
| vite | 5.4.21 | MIT | Build tooling and dev server |
| @vitejs/plugin-react | 4.7.0 | MIT | React Fast Refresh + JSX transform |
| @playwright/test | 1.59.1 | Apache-2.0 | Automated UI test framework |

### Fonts

- **Satoshi** by Indian Type Foundry / Fontshare — used under the Fontshare free font license. Loaded via the Fontshare CDN. https://www.fontshare.com/fonts/satoshi
- **JetBrains Mono** — SIL Open Font License 1.1, loaded via Fontshare.

### Data sources

- **Sport profiles, exercise database, cardio recommendations** — written by the author based on training literature.
- **Anatomy SVG** — from `react-body-highlighter` (MIT).
- **Exercise illustrations** — Lucide icons on tokenized gradient tiles. We evaluated `wger.de` (CC-BY-SA 3 / 4), the `everkinetic` dataset (public domain), and `wrkout/exercises.json` (MIT) during development; the final build ships tokenized icons for visual consistency.
- **Mifflin–St Jeor equation** for BMR — Mifflin et al., *Am J Clin Nutr* (1990).
- **Tanaka heart-rate formula** for max HR — Tanaka et al., *J Am Coll Cardiol* (2001).

### Tools used in development

- **Claude Code** by Anthropic — pair-programming assistant.

### Inspirations

Visual design references: **Linear**, **Strong**, **Hevy** for typography, card patterns, and body heatmap interactions.

## License

MIT — see [LICENSE](./LICENSE).

## Author

**Massimo Arellano** — Cal Poly Pomona

---

Built for BroncoHacks 2026.
