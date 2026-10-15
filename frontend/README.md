# SatQuest Frontend ⚡

The SatQuest game itself — a cinematic, mobile-first **PWA** built with React 18,
Vite, and Three.js. Players pick an avatar, choose a username, and work through
progressive Bitcoin/Lightning levels (match, word hunt, quiz, scam-spotter, and
seed-order). Points earned in-game convert to real sats they can withdraw over
Lightning from the in-app wallet.

Plays fully offline after the first load. Level content is fetched from the
backend and cached in IndexedDB; profile and progress live in `localStorage` and
sync to the API.

> This is the `satquest-frontend3` (v3) rebuild — a Three.js + GSAP overhaul that
> keeps full backend/API compatibility.

## Stack

| Layer | Choice |
| --- | --- |
| UI | React 18 (hooks only, no Redux) |
| Build | Vite 5 |
| 3D | Three.js 0.184 |
| Animation | GSAP 3 |
| QR codes | `qrcode` |
| PWA | `vite-plugin-pwa` (Workbox) |
| Audio | Web Audio API (procedural — no audio files) |
| Icons | `sharp` (SVG → PNG pipeline) |
| Styling | CSS Modules |

## Quick start

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`). In dev, requests to
`/api/*` are proxied to the backend at `http://127.0.0.1:3000` (override with
`VITE_API_URL`). The proxy uses `127.0.0.1` rather than `localhost` so it doesn't
resolve to IPv6 `::1` on machines where the API only listens on IPv4.

> Run the [backend](../backend/README.md) and seed the demo levels
> (`npm run seed:levels`) first, otherwise there's no level content to play.

## Configuration

- **`VITE_API_URL`** — base URL of the backend API. Empty in dev (uses the Vite
  proxy); set it at build time for production (e.g. `https://api.satquests.com`).
  All client calls hit `${VITE_API_URL}/api/...`.

## Game types

All five level types are implemented and routed by `level.type` in
[`src/hooks/useGame.js`](src/hooks/useGame.js):

| Type | Board | Description |
| --- | --- | --- |
| `match` | `MatchBoard.jsx` | Tap an image, then tap its meaning. Match all pairs to finish. |
| `wordhunt` | `WordHuntBoard.jsx` | Timed round — tap the real Bitcoin words among decoys before the clock runs out. |
| `crossover` | `CrossoverQuizBoard.jsx` | Multiple-choice quiz gate; score above the pass mark (default 70%) to advance. |
| `scamspot` | `ScamSpotterBoard.jsx` | "Scam or Safe?" decision drills that teach self-custody. |
| `seedorder` | `SeedOrderBoard.jsx` | Study a recovery phrase, then rebuild it in the correct order. |

Every board renders inside `GameFrame.jsx` (HUD, progress, briefing) and is
followed by a `Reveal` screen. Reward amounts shown are for display only — the
backend is authoritative for points credited.

## Level loading (offline-first)

1. **First boot:** `levelsSync.ensureLevels()` fetches `GET /api/levels`, applies
   the data into the in-memory `LEVELS` array, and caches the payload in
   IndexedDB.
2. **Later boots:** read from IndexedDB immediately (fast, offline-capable), then
   refresh the cache in the background — no mid-session swap.
3. **Offline with no cache:** the app shows a "connect once" prompt with retry.
4. **Backend content update:** detected via the payload `version` hash and picked
   up on the next session.

## Localisation

UI strings go through a small runtime in [`src/i18n/index.js`](src/i18n/index.js):

```js
import { t, tn } from '../i18n'
t('reveal.continue')             // "Continue →"
t('done.title', { count: 37 })   // interpolation
tn('lb.total', 3)                // plural: 'lb.total.one' / 'lb.total.other'
```

- Players pick a language from the **Profile** screen. The choice is saved as
  `satquest.lang` and `<html lang>` is kept in sync. On first launch the browser
  language is used if it is enabled.
- Missing keys fall back to English, so a partial translation is safe.
- Level content is translated separately, with a per-level `i18n: { <code>: … }`
  overlay served by the backend and merged in [`src/data/levels.js`](src/data/levels.js).
- A language only becomes selectable when it is registered in `LOCALES` **and**
  marked `available: true` in `LANGUAGES`. Yorùbá (`yo.js`) is registered but
  stays "coming soon" until its level content is translated too. You can flip it
  on locally to test, but don't commit that change.

## First-run tour

The first time a player reaches the map, [`src/ui/Tour.jsx`](src/ui/Tour.jsx)
runs a spotlight walkthrough. Each step highlights the element tagged
`data-tour="<anchor>"` (map, sats counter, bottom-nav tabs). The steps are
defined in `TOUR_STEPS` in [`src/App.jsx`](src/App.jsx), and their text comes
from the `tour.*` i18n keys. Finishing or skipping sets `satquest.tourDone`.
Clear that key to see the tour again.

## Security touchpoints

- **Device identity:** `getDeviceId()` ([`src/lib/storage.js`](src/lib/storage.js))
  generates a stable per-browser ID stored in `localStorage` (`satquest.deviceId`).
- **One account per device:** the device ID is sent on profile create/restore so
  the backend can enforce a single account per device.
- **Device-gated actions:** the `x-device-id` header is attached to the seed
  reveal and Lightning send requests, so neither can be performed from another
  device.

## Project structure

```
frontend/
├── public/                     # icons (svg + generated PNGs), robots, sitemap
├── scripts/
│   └── gen-icons.mjs           # regenerate all PNG icons from icon.svg (sharp)
├── src/
│   ├── main.jsx                # entry; registers the service worker
│   ├── App.jsx                 # phase router (entry → map → playing → reveal …)
│   ├── index.css               # brand palette as CSS variables
│   ├── audio/
│   │   └── SoundManager.js      # procedural music tracks + SFX (Web Audio)
│   ├── avatars/                # avatar webp images
│   ├── components3d/
│   │   └── SceneBackground.jsx  # persistent mood-driven 3D backdrop + useScene()
│   ├── core/
│   │   ├── APIClient.js         # re-exports the API modules
│   │   ├── GameEngine.js        # stateless match/word/quiz helpers
│   │   └── LevelManager.js      # read-only getters over the LEVELS array
│   ├── data/
│   │   ├── concepts.js          # concept labels + spaced-repetition helpers
│   │   ├── levels.js            # LEVELS (filled from backend), AVATARS, helpers
│   │   └── seedWords.js         # random BIP-39 words for seed-order levels
│   ├── hooks/
│   │   ├── useGame.js           # central game state machine
│   │   ├── useLightningEvents.js# wallet SSE subscription
│   │   └── useTheme.jsx         # theme context (dark/light/market/…)
│   ├── i18n/
│   │   ├── index.js             # minimal t() runtime, LANGUAGES list, locale handling
│   │   ├── en.js                # English UI strings (source of truth for keys)
│   │   └── yo.js                # Yorùbá UI strings (not yet enabled)
│   ├── lib/
│   │   ├── api.js               # backend client (profile/progress/rewards/…)
│   │   ├── levelsSync.js        # offline-first level cache orchestration
│   │   └── storage.js           # localStorage + device ID
│   ├── rendering/              # Three.js scenes (QuestWorld map, AvatarWalker, board grids…)
│   ├── screens/                # all screen components (entry, map, boards, wallet…)
│   └── ui/                     # reusable UI (Avatar, NeonButton, GlassPanel, Tour…)
├── index.html
├── vite.config.js
├── netlify.toml
├── nginx.conf
├── Dockerfile
└── package.json
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server (proxies `/api` to the backend) |
| `npm run build` | Production build → `dist/` (PWA: service worker + manifest + icons) |
| `npm run preview` | Preview the production build locally |
| `npm run icons` | Regenerate home-screen PNG icons from `public/icon.svg` |

## Build & deploy

```bash
npm run build
npm run preview
```

`dist/` is a complete installable PWA (service worker, manifest, icons) ready to
deploy to Netlify (`netlify.toml` included) or serve via Nginx (`nginx.conf` /
`Dockerfile`). Set `VITE_API_URL` at build time so the bundle talks to your
deployed API.

### Installing on a phone

- **iPhone (Safari):** Share → **Add to Home Screen**.
- **Android (Chrome):** menu → **Install app**.

Once installed it runs offline, with progress saved on the device.
