# SatQuest ⚡

> Learn Bitcoin the fun way. Stack real sats.

**SatQuest** is an open-source, mobile-first PWA that teaches Bitcoin and Lightning fundamentals through a Nigerian lens. Players pick an avatar, choose a username, and work through progressive levels across two stages — mixing match-the-pair puzzles, timed Word Hunt rounds, a Crossover Quiz, scam-spotter drills, and seed-phrase ordering — earning points that convert to real satoshis they can withdraw over Lightning.

Plays fully offline. Level content is served by the backend and cached on-device; profile and progress are saved locally and synced to a NestJS + PostgreSQL API that also handles Lightning payouts and a global paginated leaderboard.

> **Open-source note:** this repository ships a small set of **demo levels** so the
> app is runnable out of the box — not the full production curriculum. See
> [Level content](#level-content).

---

## Why SatQuest Exists

Most Bitcoin education is written for people who already have bank accounts, stable currencies, and functioning financial systems.

Nigerians — and hundreds of millions of people across Africa — live with 25%+ annual inflation, frozen accounts, PayPal restrictions, SWIFT delays, and currencies that halve in value every few years.

**SatQuest teaches Bitcoin as a tool for financial survival, not speculation.**

Every level is grounded in real Nigerian life: Mama Titi's market savings, Emeka sending money to Aba, Dayo's account being frozen during EndSARS. By the end of level 26, players understand Bitcoin and Lightning better than most people who have held it for years.

---

## What's Inside

- **Two-stage journey** with a gentle teaching curve — content is data-driven and
  served from the backend, so the curriculum can grow without shipping a new build.
- **5 game modes**, rotated through the journey:
  - **🎯 Match** — tap a picture, tap its meaning. Pure vocabulary teaching.
  - **🧩 Word Hunt** — timed rounds. Spot real Bitcoin words mixed with regular finance words and beat the clock.
  - **🏆 Crossover Quiz** — a timed multiple-choice gate; score above the pass mark (default 70%) to advance.
  - **🕵️ Scam Spotter** — "scam or safe?" decision drills that teach self-custody.
  - **🧩 Seed Order** — study a recovery phrase, then rebuild it in the correct order.
- **Points → sats rewards** — gameplay accrues points; the **backend** is authoritative for how many. Points convert to sats at claim time and pay out over Lightning from the Wallet screen.
- **Non-custodial Lightning wallet per player** — derived from a BIP-39 mnemonic minted on signup (Breez SDK). Back up or restore your account with the 12-word seed.
- **Custom avatars** — pick your character on first launch from a scrollable strip.
- **Welcome-back & edit-profile flows** — avatar is changeable; username is immutable (tied to your wallet).
- **Performance tracked** per level — fastest completion time and attempt count.
- **Global leaderboard** — infinite-scroll ranked list, paginated from the backend (20 per page).
- **Cinematic 3D** — Three.js + GSAP scenes throughout (quest map, animated backgrounds).
- **Arcade audio** — procedural Web Audio music tracks + full SFX set; toggles from the Profile screen.
- **Plays offline** — installable PWA; levels cached in IndexedDB, progress in `localStorage`.
- **One account per device** — sensitive actions (seed reveal, Lightning send) are device-gated; no passwords, no login friction.
- **Landing page** — separate marketing site at `satquests.com` with hero, live leaderboard, player feedback, and a Tournament coming-soon page.

---

## Quick Look

| Welcome | Map | Match level | Word Hunt | Wallet | Profile |
|---|---|---|---|---|---|
| Username + avatar carousel | 3D quest map across 2 stages | Picture ↔ Meaning grid | Timed word grid with decoys | sats balance + per-level stats | Avatar picker strip |

Live app: **[app.satquests.com](https://app.satquests.com)**  
Landing: **[satquests.com](https://satquests.com)**

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

SatQuest is a **monorepo** with three top-level apps:

```
satquest/
├── frontend/    ← Vite + React PWA (the game itself)
├── backend/     ← NestJS API (profile sync, leaderboard, Lightning)
├── landing/     ← Vite + React marketing site (satquests.com)
├── README.md
├── CONTRIBUTORS.md
└── LICENSE
```

### Install

```bash
git clone https://github.com/aizuanjeme/satquest.git
cd satquest

# Frontend (PWA)
cd frontend && npm install && cd ..

# Backend (NestJS API)
cd backend  && npm install && cd ..

# Landing page
cd landing  && npm install && cd ..
```

### Run the frontend (the game)

```bash
cd frontend
npm run dev
```

Open the URL Vite prints (default `http://localhost:5173`).

### Run the backend (API)

```bash
cd backend
cp .env.example .env
npm run start:dev
```

The API listens on `http://localhost:3000/api`. With `DB_SYNCHRONIZE=true` (the
default) the schema is created on boot. Levels are **not** seeded automatically —
load the bundled demo levels once:

```bash
npm run seed:levels
```

See [`backend/README.md`](backend/README.md) for the full endpoint list,
environment variables, and the security model.

### Run the landing page

```bash
cd landing
npm run dev
```

Opens at `http://localhost:5180` by default.

### Regenerate home-screen icons

If you edit [`frontend/public/icon.svg`](frontend/public/icon.svg ), rebuild the PNG icons:

```bash
cd frontend
npm run icons
```

This produces the 16/32/180/192/512 PNGs plus a maskable 512 that Android and iOS need for a clean home-screen logo.

### Build the frontend for production

```bash
cd frontend
npm run build
npm run preview
```

The [`frontend/dist/`](frontend/dist/ ) folder is a complete PWA with service worker, manifest, and all icons — ready to drag-and-drop to Netlify.

---

## Project Structure

```
satquest/
├── frontend/                          # ⚡ Vite + React PWA (the game)
│   ├── public/
│   │   ├── icon.svg                   # Source vector logo
│   │   ├── icon-192.png               # Android home-screen
│   │   ├── icon-512.png               # Android splash
│   │   ├── icon-maskable-512.png      # Android adaptive icon
│   │   ├── apple-touch-icon.png       # iPhone home-screen (180×180)
│   │   ├── favicon-16.png
│   │   └── favicon-32.png
│   ├── scripts/
│   │   └── gen-icons.mjs              # Regenerates all PNGs from icon.svg (uses sharp)
│   ├── src/
│   │   ├── audio/
│   │   │   └── SoundManager.js        # Procedural Web Audio — music tracks + SFX
│   │   ├── avatars/                   # character webp images
│   │   ├── components3d/              # persistent 3D background (SceneBackground)
│   │   ├── core/
│   │   │   ├── APIClient.js           # re-exports the API modules
│   │   │   ├── GameEngine.js          # stateless match/word/quiz helpers
│   │   │   └── LevelManager.js        # read-only getters over the LEVELS array
│   │   ├── data/levels.js             # LEVELS (filled from backend), AVATARS, helpers
│   │   ├── hooks/
│   │   │   ├── useGame.js             # Full state machine + storage hydration
│   │   │   └── useLightningEvents.js
│   │   ├── lib/
│   │   │   ├── api.js                 # profile/progress/rewards/lightning/… client
│   │   │   ├── levelsSync.js          # offline-first level cache (IndexedDB)
│   │   │   └── storage.js             # localStorage layer + device ID
│   │   ├── rendering/                 # Three.js scenes (quest map, board grids)
│   │   ├── screens/
│   │   │   ├── EntryScreen.jsx        # Onboarding: username + avatar carousel
│   │   │   ├── LevelMap.jsx           # 3D quest map
│   │   │   ├── MatchBoard.jsx         # match game board
│   │   │   ├── WordHuntBoard.jsx      # timed word hunt
│   │   │   ├── CrossoverQuizBoard.jsx # quiz gate
│   │   │   ├── ScamSpotterBoard.jsx   # scam-or-safe drills
│   │   │   ├── SeedOrderBoard.jsx     # rebuild the seed phrase
│   │   │   ├── Wallet.jsx             # sats balance + Lightning payout
│   │   │   ├── Leaderboard.jsx        # Infinite-scroll global rankings
│   │   │   └── …
│   │   ├── ui/                        # Avatar, NeonButton, GlassPanel, ScoreDisplay …
│   │   ├── App.jsx                    # Phase router
│   │   └── index.css                  # Brand palette as CSS variables
│   ├── index.html
│   ├── vite.config.js
│   ├── netlify.toml
│   ├── Dockerfile
│   └── package.json
├── backend/                           # ⚡ NestJS + PostgreSQL API
│   ├── src/
│   │   ├── main.ts                    # Bootstrap, /api prefix, CORS, ValidationPipe
│   │   ├── app.module.ts
│   │   ├── database/                  # TypeORM + Postgres connection
│   │   ├── app-config/                # runtime config (POINTS_PER_SAT)
│   │   ├── health/                    # GET  /api/health
│   │   ├── levels/                    # demo seed + manual seed action + GET /api/levels
│   │   ├── profile/                   # profiles, device binding, mnemonic crypto
│   │   ├── progress/                  # PUT / GET /api/progress (+ point crediting)
│   │   ├── leaderboard/               # GET  /api/leaderboard?page=1&limit=20
│   │   ├── rewards/                   # points → sats claim flow
│   │   ├── lightning/                 # Breez SDK: info / invoice / send / events
│   │   ├── feedback/                  # Player feedback
│   │   └── rss/                       # Medium feed proxy
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── landing/                           # ⚡ Vite + React marketing site
│   ├── src/
│   │   ├── avatars/                   # avatars for landing UI
│   │   ├── rendering/                 # Three.js animated background
│   │   ├── components/
│   │   │   ├── Nav.jsx                # Top nav with Play Now → app.satquests.com
│   │   │   ├── Hero.jsx
│   │   │   ├── Leaderboard.jsx        # Top-10 live leaderboard widget
│   │   │   ├── Feedback.jsx           # Player quotes with real avatars
│   │   │   ├── Blog.jsx               # Medium blog feed
│   │   │   └── Footer.jsx
│   │   └── pages/
│   │       └── TournamentPage.jsx     # Coming-soon tournament page
│   ├── index.html
│   ├── vite.config.js
│   ├── netlify.toml
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .gitignore
├── LICENSE
├── README.md
└── CONTRIBUTORS.md
```

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| UI | React 18 | Minimal, hooks-only, no Redux |
| Build | Vite 5 (frontend) / Vite 6 (landing) | Fast dev, small output |
| 3D | Three.js + GSAP | Cinematic map, animated backgrounds |
| Styling | CSS Modules | Scoped styles, no runtime overhead |
| PWA | vite-plugin-pwa + Workbox | Auto service worker + manifest |
| State | React hooks | `useGame.js` is a complete state machine |
| Persistence | localStorage + IndexedDB + PostgreSQL | Offline-first, synced to backend |
| Audio | Web Audio API | Procedural synthesis — no audio files |
| Backend | NestJS + TypeORM + Postgres | REST API, validation, ORM |
| Lightning | Breez SDK — Spark | Non-custodial wallet per player |
| Icon pipeline | sharp | SVG → PNG at home-screen sizes |

---

## Game Architecture

### Phase state machine (`useGame.js`)

```
avatar (signup) ────► map ────► playing ────► reveal ────► (next level or done)
   ▲                    ▲          │              │
   │                    └──────────┴──────────────┘
   │                         wallet / leaderboard / profile
   │
   └─ Welcome-back screen reads from localStorage on first mount
```

### Game types

Levels are objects keyed by `type`, served from the backend and routed by
[`useGame.js`](frontend/src/hooks/useGame.js). The reward amount lives in the
`points` field but is **authoritative on the backend** — the client value is for
display only.

```js
// Match — tap an image, then its meaning
{
  type: 'match', points: 1,
  pairs: [
    { id: 'sats', imgEmoji: '🔬', imgLabel: 'Sats',
                  wordEmoji: '🟠', wordLabel: 'Small piece of Bitcoin' },
    // ...
  ],
  reveals: [ /* one per pair */ ],
}

// Word Hunt — timed; tap the real words, skip the decoys
{
  type: 'wordhunt', points: 2, timeLimit: 30,
  real:  ['bitcoin', 'wallet', 'satoshi'],
  decoy: ['naira', 'dollar', 'bank', 'loan'],
}

// Crossover Quiz — timed multiple-choice gate
{
  type: 'crossover', points: 3, timeLimit: 90, passMark: 0.70,
  questions: [ { q: '…', options: ['A', 'B', 'C'], answer: 0 } ],
}

// Scam Spotter — scam or safe?
{
  type: 'scamspot', points: 2,
  scenarios: [ { id: 's1', emoji: '⚠️', prompt: '…', answer: 'scam', why: '…' } ],
}

// Seed Order — rebuild the recovery phrase
{
  type: 'seedorder', points: 2,
  seed: ['word1', 'word2', /* … */],   // or: random: true, count: 12
}
```

Word Hunt decoys are non-Bitcoin finance words so the puzzle teaches what is and
isn't Bitcoin vocabulary. Scam Spotter and Seed Order reinforce self-custody.

### Level data shape (match)

```js
{
  id: 1, badge: '1', chapter: 'Step 1',
  title: 'What is Bitcoin?',
  story: 'Bitcoin is money. But not the kind you keep in a bank...',
  hint: 'Match the picture to the meaning',
  hintColor: '#FF9500', points: 5,
  type: 'match',
  pairs: [
    {
      id: 'money',
      imgEmoji: '💰',  imgLabel: 'Money',
      wordEmoji: '🪙', wordLabel: 'Bitcoin is money',
    },
    // ...
  ],
  reveals: [
    {
      match: 'Bitcoin is money',
      def: 'Just like naira and dollar, Bitcoin is money you can spend, save and send.',
      funny: '😂 "Money is money. Bitcoin is the digital kind!"',
    },
    // ...
  ],
}
```

### Storage shape ([`frontend/src/lib/storage.js`](frontend/src/lib/storage.js ))

```js
// localStorage key: satquest.profile
{
  username:  'emeka_lagos',
  avatarId:  'av3',
  createdAt: 1779000000000,
  updatedAt: 1779080000000,
}

// localStorage key: satquest.progress
{
  sats: 145,
  unlockedUpTo: 7,
  levels: {
    0: { sats: 5,  bestTimeMs: 18420, attempts: 1, completedAt: ... },
    1: { sats: 5,  bestTimeMs: 22100, attempts: 1, completedAt: ... },
    // ...
  },
  deviceId:  'dev_xyz...',
  updatedAt: 1779080000000,
}
```

### Backend API (live)

```
GET   /api/health
GET   /api/levels                       → ordered levels + content version
POST  /api/profile                      body: { username, avatarId, deviceId? }
GET   /api/profile/:username
PATCH /api/profile/:username             body: { avatarId? }
GET   /api/profile/:username/seed        header: x-device-id  (device-gated)
POST  /api/profile/restore               body: { mnemonic }
PUT   /api/progress                      body: progress object (merged server-side)
GET   /api/progress/:username
GET   /api/leaderboard?page=1&limit=20   → { data, total, page, limit, totalPages }
GET   /api/rewards/:username             → unclaimed points + exchange rate
POST  /api/rewards/:username/claim        → pay pending rewards over Lightning
GET   /api/lightning/:username/info
POST  /api/lightning/:username/invoice
POST  /api/lightning/:username/send      header: x-device-id  (device-gated)
GET   /api/feedback                      → [{ … avatarId }]
```

See [`backend/README.md`](backend/README.md) for the complete table, request
bodies, and the security model. Per-level `bestTimeMs` is tracked, so a "fastest
completions" leaderboard is just a query away.

---

## Installing on Your Phone

SatQuest now ships with proper home-screen icons (PNG, all sizes).

### iPhone

1. Open the app in **Safari** (Chrome on iOS won't install PWAs)
2. Tap the **Share** button (square with arrow)
3. Scroll down → **Add to Home Screen**
4. Tap **Add** — the SatQuest logo will appear on your home screen

### Android

1. Open the app in **Chrome**
2. Tap the 3-dot menu → **Install app** (or **Add to Home Screen**)
3. Tap **Install** — the SatQuest logo will appear as a real app icon

Once installed, SatQuest works fully offline. All progress is saved to your device.

---

## Level content

Levels live in the database and are served by `GET /api/levels`. This repository
ships only a small set of **demo levels** — enough to run and learn the data
shapes, but **not** the production curriculum.

- The bundled demo set is in
  [`backend/src/levels/levels.seed.ts`](backend/src/levels/levels.seed.ts)
  (one `match`, one `wordhunt`, one `crossover`).
- Seeding is a **manual action** (the server never seeds on boot). Load it with:

  ```bash
  cd backend && npm run seed:levels
  ```

- To build your own curriculum, edit `LEVELS_SEED` (using the demo entries as a
  template), then re-run `npm run seed:levels` to replace the table. The frontend
  picks up the new content on its next session via the payload `version` hash.

---

## Contributing

See [CONTRIBUTORS.md](CONTRIBUTORS.md) for the full contribution guide.

Quick summary:

- **Add or edit a level** — edit `LEVELS_SEED` in
  [`backend/src/levels/levels.seed.ts`](backend/src/levels/levels.seed.ts), then
  run `npm run seed:levels` in `backend/` to load it.
- **Add a game type / board** — wire it in
  [`frontend/src/hooks/useGame.js`](frontend/src/hooks/useGame.js) and add a board
  component under `frontend/src/screens/`.
- **Add an avatar** — drop a new webp into `frontend/src/avatars/` (and
  `landing/src/avatars/` if it should appear on the marketing site).
- **Fix a bug** — open an issue or PR.
- **Translate** — UI strings live in `frontend/src/i18n/`; level prose
  (`story`, `hint`, `def`, `funny`) can be localised in the seed content.

After changes, run `npm run build` in the app you touched to confirm it compiles.

---

## Roadmap

- [x] Two-stage journey with five game modes (Match, Word Hunt, Crossover Quiz, Scam Spotter, Seed Order)
- [x] Custom avatars + username onboarding
- [x] Offline persistence (IndexedDB level cache + `localStorage` progress)
- [x] Welcome-back & edit-profile flows
- [x] Real PNG home-screen icons (iOS + Android + maskable)
- [x] Non-custodial Lightning wallet per player + real sats payouts
- [x] Server-authoritative point rewards (points → sats at claim)
- [x] One-account-per-device + device-gated seed reveal / Lightning send
- [x] At-rest mnemonic encryption (AES-256-GCM)
- [x] NestJS + PostgreSQL backend with strict DTO validation
- [x] Global leaderboard with infinite scroll (paginated)
- [x] Cinematic Three.js + GSAP rebuild
- [x] Procedural Web Audio music + full SFX set
- [x] Landing page (satquests.com) with live leaderboard + player feedback
- [x] Tournament page (coming soon)
- [ ] Yoruba, Igbo, and Hausa language support
- [ ] Tournament mode (live bracket)
- [ ] Share score card for social media
- [ ] More game modes: timed flashcards, fill-in-the-blank, sentence shuffle

---

## Licence

MIT — see [LICENSE](LICENSE).

---

*Built with love for Nigeria and the rest of the world that deserves sound money.*
