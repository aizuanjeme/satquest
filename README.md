# SatQuest ⚡

> Learn Bitcoin the fun way. Stack real sats.

**SatQuest** is an open-source, mobile-first PWA that teaches Bitcoin and Lightning fundamentals through a Nigerian lens. Players pick an avatar, choose a username, work through 37 progressive levels across two stages — mixing match-the-pair puzzles, timed Word Hunt rounds, and a Crossover Quiz — then stack satoshis they can actually withdraw.

Plays fully offline. All progress is saved on the device. A live NestJS backend handles profile sync, progress storage, Lightning payouts, and a global paginated leaderboard.

---

## Why SatQuest Exists

Most Bitcoin education is written for people who already have bank accounts, stable currencies, and functioning financial systems.

Nigerians — and hundreds of millions of people across Africa — live with 25%+ annual inflation, frozen accounts, PayPal restrictions, SWIFT delays, and currencies that halve in value every few years.

**SatQuest teaches Bitcoin as a tool for financial survival, not speculation.**

Every level is grounded in real Nigerian life: Mama Titi's market savings, Emeka sending money to Aba, Dayo's account being frozen during EndSARS. By the end of level 26, players understand Bitcoin and Lightning better than most people who have held it for years.

---

## What's Inside

- **37 levels** across 2 stages with a gentle teaching curve — starts with "Bitcoin is money" and ends with apex Bitcoin wisdom
  - **Stage 1**: 27 levels (20 match + 6 word hunts + 1 crossover quiz)
  - **Stage 2**: 10 levels (8 match + 2 word hunts)
- **3 game modes**, rotated through the journey:
  - **🎯 Match** — tap a picture, tap its meaning. Pure vocabulary teaching.
  - **🧩 Word Hunt** — timed review rounds (8 total). Spot real Bitcoin words mixed with regular finance words and beat the clock to earn points.
  - **🏆 Crossover Quiz** — Stage 1 final test. Score at least 70% under timer pressure to pass and unlock Stage 2.
- **Points-based rewards** — gameplay rewards tracked as pts; sats payout happens via Lightning from the Wallet screen
- **38 custom avatars** (19 sisters + 19 brothers) — pick your character on first launch from a scrollable horizontal strip
- **Welcome-back screen** — your pts and levels done are visible before you even tap Continue
- **Edit profile any time** — avatar changeable from the Profile screen (username is immutable, tied to your wallet)
- **Performance tracked** per level — fastest completion time and attempt count
- **Global leaderboard** — infinite-scroll ranked list, paginated from the backend (20 per page)
- **Arcade audio** — 7 procedural music tracks (Afrobeat default) + full SFX set (tap, hover, correct, wrong, win); music toggles instantly from the Profile screen
- **Plays offline** — installable as a PWA; full progress in `localStorage`
- **Live backend** — NestJS + PostgreSQL handles profile sync, progress merge, Lightning payouts, and paginated leaderboard
- **Landing page** — separate marketing site at `satquests.com` with hero, leaderboard, player feedback, and a Tournament coming-soon page
- **No login friction** — username and avatar chosen once on first launch; synced to backend automatically

---

## Quick Look

| Welcome | Map | Match level | Word Hunt | Wallet | Profile |
|---|---|---|---|---|---|
| Username + avatar carousel | 37 zig-zag nodes across 2 stages | Picture ↔ Meaning grid | Timed word grid with decoys | pts + per-level stats | Avatar picker strip |

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

The API listens on `http://localhost:3000/api`. See [`backend/README.md`](backend/README.md) for the full endpoint list.

### Run the landing page

```bash
cd landing
npm run dev
```

Opens at `http://localhost:5174` by default.

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
│   │   │   └── SoundManager.js        # Procedural Web Audio — 7 music tracks + SFX
│   │   ├── avatars/                   # 38 character webp images (19F + 19M)
│   │   ├── core/
│   │   │   ├── APIClient.js           # Typed wrappers for all backend endpoints
│   │   │   ├── GameEngine.js
│   │   │   └── LevelManager.js        # AVATARS, resolveAvatarId, TOTAL_SATS
│   │   ├── data/levels.js             # 37 levels across 2 stages (match, wordhunt, crossover)
│   │   ├── hooks/
│   │   │   ├── useGame.js             # Full state machine + storage hydration
│   │   │   └── useLightningEvents.js
│   │   ├── lib/
│   │   │   ├── api.js                 # leaderboardApi, profileApi, progressApi
│   │   │   └── storage.js             # localStorage layer + backend sync
│   │   ├── screens/
│   │   │   ├── EntryScreen.jsx        # Onboarding: username + avatar carousel
│   │   │   ├── LevelMap.jsx           # 26-node zig-zag map
│   │   │   ├── Leaderboard.jsx        # Infinite-scroll global rankings
│   │   │   ├── ProfileEditor.jsx      # Avatar picker (preview + horizontal strip)
│   │   │   ├── Wallet.jsx             # pts balance + Lightning payout
│   │   │   └── …
│   │   ├── ui/                        # Avatar, NeonButton, GlassPanel, ScoreDisplay …
│   │   ├── App.jsx                    # Phase router
│   │   └── index.css                  # Brand palette as CSS variables
│   ├── index.html
│   ├── vite.config.js
│   ├── netlify.toml
│   └── package.json
├── backend/                           # ⚡ NestJS + PostgreSQL API
│   ├── src/
│   │   ├── main.ts                    # Bootstrap, /api prefix, ValidationPipe
│   │   ├── app.module.ts
│   │   ├── health/                    # GET  /api/health
│   │   ├── profile/                   # POST / GET / PATCH /api/profile
│   │   ├── progress/                  # PUT  / GET /api/progress
│   │   ├── leaderboard/               # GET  /api/leaderboard?page=1&limit=20
│   │   ├── lightning/                 # Lightning payout endpoints
│   │   ├── feedback/                  # Player feedback (avatarId included)
│   │   └── rewards/
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── .env.example
│   └── package.json
├── landing/                           # ⚡ Vite + React marketing site
│   ├── src/
│   │   ├── avatars/                   # Mirror of frontend avatars for landing UI
│   │   ├── components/
│   │   │   ├── Nav.jsx                # Top nav with Play Now → app.satquests.com
│   │   │   ├── Hero.jsx
│   │   │   ├── Leaderboard.jsx        # Top-10 live leaderboard widget
│   │   │   ├── Feedback.jsx           # Player quotes with real avatars
│   │   │   └── Footer.jsx
│   │   └── pages/
│   │       └── TournamentPage.jsx     # Coming-soon page with CRT glitch effects
│   ├── index.html
│   ├── vite.config.js
│   ├── netlify.toml
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
| Build | Vite 5 | Fast dev, small output |
| Styling | CSS Modules | Scoped styles, no runtime overhead |
| PWA | vite-plugin-pwa + Workbox | Auto service worker + manifest |
| State | React hooks | `useGame.js` is a complete state machine |
| Persistence | localStorage + PostgreSQL | Offline-first, synced to backend |
| Audio | Web Audio API | Procedural synthesis — no audio files |
| Backend | NestJS + TypeORM | REST API, validation, PostgreSQL ORM |
| Icon pipeline | sharp | SVG → PNG at home-screen sizes |
| Fonts | Nunito (Google) | Rounded, friendly, legible on small screens |

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

### Three game types

```js
// Match level (default)
{
  type: 'match',
  pairs: [
    { id: 'sats', imgEmoji: '🔬', imgLabel: 'Sats',
                  wordEmoji: '🟠', wordLabel: 'Small piece of Bitcoin' },
    // ...
  ],
  reveals: [ /* one per pair */ ],
}

// Word Hunt level (inserted after each 3 match levels)
{
  type: 'wordhunt',
  timeLimit: 30,                                // seconds
  real:  ['Bitcoin', 'Sats', 'Satoshi'],        // tap these
  decoy: ['Naira', 'Dollar', 'Bank', 'Loan'],   // skip these
  sats: 15,                                     // full reward if all found in time
}

// Stage 1 Crossover Quiz (final level)
{
  type: 'crossover',
  timeLimit: 90,
  passMark: 0.70, // must score at least 70%
  sats: 10,
}
```

Word Hunts pull words from concepts taught in the preceding 3 match levels. Decoys are non-Bitcoin finance words so the puzzle teaches what is and isn't Bitcoin vocabulary. The Crossover Quiz closes Stage 1 with a timed exam and sats reward.

### Level data shape (match)

```js
{
  id: 1, badge: '1', chapter: 'Step 1',
  title: 'What is Bitcoin?',
  story: 'Bitcoin is money. But not the kind you keep in a bank...',
  hint: 'Match the picture to the meaning',
  hintColor: '#FF9500', sats: 5,
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
      naija: '💰', btc: '🪙',
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
GET  /api/health
POST /api/profile                     body: { username, avatarId }
GET  /api/profile?username=...
PATCH /api/profile/:id                body: { avatarId }
PUT  /api/progress                    body: progress object (merge logic)
GET  /api/progress?username=...
GET  /api/leaderboard?page=1&limit=20 → { data, total, page, limit, totalPages }
GET  /api/feedback                    → [{ ... avatarId }]
POST /api/lightning/...               Lightning payout endpoints
```

Per-level `bestTimeMs` is already tracked, so a "fastest L7 completions" leaderboard is just a query away.

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

## Contributing

See [CONTRIBUTORS.md](CONTRIBUTORS.md) for the full contribution guide.

Quick summary:

- **Add pairs to a level** — edit [`frontend/src/data/levels.js`](frontend/src/data/levels.js ), add to `pairs[]` and `reveals[]`
- **Add a new match level** — copy an existing level object, increment id, run `npm run build` in `frontend/` to confirm
- **Tweak a Word Hunt** — edit the `WORD_HUNTS` array at the bottom of [`levels.js`](frontend/src/data/levels.js )
- **Add an avatar** — drop a new `Size_XXL__2048px______Avatar_{female|male}_N_____Round_no.webp` file in [`frontend/src/avatars/`](frontend/src/avatars/ ) and bump `AVATAR_COUNT` in [`frontend/src/data/levels.js`](frontend/src/data/levels.js )
- **Fix a bug** — open an issue or PR
- **Translate** — each level's `story`, `hint`, `def`, and `funny` fields can be localised

---

## Roadmap

- [x] 37 levels across 2 stages with three game modes (Match, Word Hunt, Crossover Quiz)
- [x] Username + 38 custom avatars
- [x] Offline persistence + per-level performance tracking
- [x] Welcome-back & edit-profile flows
- [x] Real PNG home-screen icons (iOS + Android + maskable)
- [x] Real Lightning payouts in sats
- [x] Live NestJS + PostgreSQL backend
- [x] Global leaderboard with infinite scroll (paginated)
- [x] Arcade audio — Afrobeat music + full SFX set
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
