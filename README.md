# SatQuest ⚡

> Learn Bitcoin the fun way. Stack real sats.

**SatQuest** is an open-source, mobile-first PWA that teaches Bitcoin and Lightning fundamentals through a Nigerian lens. Players pick an avatar, choose a username, work through 26 progressive levels mixing match-the-pair puzzles with timed Word Hunt puzzles, and earn satoshis at every level.

Plays fully offline. All progress is saved on the device. Ready for a backend sync when you plug one in.

---

## Why SatQuest Exists

Most Bitcoin education is written for people who already have bank accounts, stable currencies, and functioning financial systems.

Nigerians — and hundreds of millions of people across Africa — live with 25%+ annual inflation, frozen accounts, PayPal restrictions, SWIFT delays, and currencies that halve in value every few years.

**SatQuest teaches Bitcoin as a tool for financial survival, not speculation.**

Every level is grounded in real Nigerian life: Mama Titi's market savings, Emeka sending money to Aba, Dayo's account being frozen during EndSARS. By the end of level 26, players understand Bitcoin and Lightning better than most people who have held it for years.

---

## What's Inside

- **26 levels** with a gentle teaching curve — starts with "Bitcoin is money" and ends with apex Bitcoin wisdom
- **2 game modes**, rotated through the journey:
  - **🎯 Match** — tap a picture, tap its meaning. Pure vocabulary teaching.
  - **🧩 Word Hunt** — timed puzzle every 4th level. Spot real Bitcoin words mixed with regular finance words (bank, IBAN, SWIFT, etc.). Beat the clock to earn sats.
- **38 custom avatars** (19 sisters + 19 brothers) with username — players pick their character on first launch
- **Welcome-back screen** — your sats and levels done are visible before you even tap Continue
- **Edit profile any time** — username + avatar changeable from the Wallet screen
- **Performance tracked** per level — fastest completion time and attempt count, ready for future leaderboards
- **Plays offline** — installable as a PWA; full progress in `localStorage`
- **Sync-ready** — storage layer designed for a backend (`syncProgress()` is a stub you swap in)
- **Lightning Wallet page** — sats balance, transaction history with best time + attempts, claim-via-Lightning placeholder
- **No login** — username and avatar live only on your device until a backend is added
- **Fully open source** under the MIT licence

---

## Quick Look

| Welcome | Map | Match level | Word Hunt | Wallet | Edit Profile |
|---|---|---|---|---|---|
| Username + avatar | 26 zig-zag nodes (puzzles dashed) | Picture ↔ Meaning grid | Timed word grid with decoys | Sats + per-level stats | Bottom-sheet modal |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

SatQuest is a **monorepo** with two top-level apps:

```
satquest/
├── frontend/    ← Vite + React PWA (the game itself)
├── backend/     ← NestJS API (profile sync + leaderboard)
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
│   │   ├── icon.svg                   # Source vector logo (SatQuest gradient + bolt)
│   │   ├── icon-192.png               # Android home-screen
│   │   ├── icon-512.png               # Android splash
│   │   ├── icon-maskable-512.png      # Android adaptive icon (safe-zone padded)
│   │   ├── apple-touch-icon.png       # iPhone home-screen (180×180)
│   │   ├── favicon-16.png             # Browser tab
│   │   └── favicon-32.png             # Browser tab retina
│   ├── scripts/
│   │   └── gen-icons.mjs              # Regenerates all PNGs from icon.svg (uses sharp)
│   ├── src/
│   │   ├── avatars/                   # 38 character webp images
│   │   ├── components/                # AvatarPick, LevelMap, GameBoard, Reveal, Wallet, …
│   │   ├── hooks/useGame.js           # Full state machine + storage hydration
│   │   ├── lib/storage.js             # localStorage layer + backend sync stub
│   │   ├── data/levels.js             # All 20 match levels + 6 word-hunts
│   │   ├── App.jsx                    # Phase router (avatar → intro → map → playing → …)
│   │   └── index.css                  # Brand palette as CSS variables
│   ├── index.html
│   ├── vite.config.js                 # Vite + vite-plugin-pwa
│   ├── netlify.toml                   # Netlify build + SPA redirects
│   └── package.json
├── backend/                           # ⚡ NestJS API (profile sync + leaderboard)
│   ├── src/
│   │   ├── main.ts                    # Bootstrap, global /api prefix, ValidationPipe
│   │   ├── app.module.ts
│   │   ├── health/                    # GET  /api/health
│   │   ├── profile/                   # POST / GET / PATCH /api/profile
│   │   ├── progress/                  # PUT  / GET /api/progress  (merge logic)
│   │   └── leaderboard/               # GET  /api/leaderboard
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── .env.example
│   └── package.json
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
| State | React hooks | [`useGame.js`](frontend/src/hooks/useGame.js ) is a complete state machine |
| Persistence | localStorage | Offline-first, sync-ready |
| Icon pipeline | sharp | SVG → PNG at home-screen sizes |
| Fonts | Nunito (Google) | Rounded, friendly, legible on small screens |

---

## Game Architecture

### Phase state machine ([`useGame.js`](frontend/src/hooks/useGame.js ))

```
avatar (signup) ────► map ────► playing ────► reveal ────► (next level or done)
   ▲                    ▲          │              │
   │                    └──────────┴──────────────┘
   │                              wallet
   │
   └─ Welcome-back screen reads from localStorage on first mount
```

### Two game types

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

// Word Hunt level (every 4th level)
{
  type: 'wordhunt',
  timeLimit: 30,                                // seconds
  real:  ['Bitcoin', 'Sats', 'Satoshi'],        // tap these
  decoy: ['Naira', 'Dollar', 'Bank', 'Loan'],   // skip these
  sats: 15,                                     // full reward if all found in time
}
```

Word Hunts pull words from concepts taught in the preceding 3 match levels. Decoys are non-Bitcoin finance words so the puzzle teaches what is and isn't Bitcoin vocabulary.

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

Legacy `omosats.*` keys are auto-migrated on first load so anyone who played the old build keeps their progress.

### Future backend (already wired)

[`storage.js`](frontend/src/lib/storage.js ) exposes a no-op `syncProgress(progress, profile)` you can swap with a real backend. The matching server is in [`backend/`](backend/) (NestJS). Endpoints already wired up:

```
POST /api/profile         body: profile           -> 201
PUT  /api/progress        body: progress          -> merged server-side
GET  /api/progress        ?username=...           -> latest progress
GET  /api/leaderboard     ?period=all|week        -> [{ username, avatarId, sats, ... }]
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

- [x] 26 levels with two game modes (Match + Word Hunt)
- [x] Username + custom avatars
- [x] Offline persistence + per-level performance tracking
- [x] Welcome-back & edit-profile flows
- [x] Real PNG home-screen icons (iOS + Android + maskable)
- [ ] Real Lightning payouts via LNURL-withdraw
- [ ] Yoruba, Igbo, and Hausa language support
- [ ] Backend + global leaderboard (sats / fastest times)
- [ ] Sound effects and haptic feedback
- [ ] Share score card for social media
- [ ] More game modes: timed flashcards, fill-in-the-blank, sentence shuffle

---

## Licence

MIT — see [LICENSE](LICENSE).

---

*Built with love for Nigeria and the rest of the world that deserves sound money.*
