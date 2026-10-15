# Contributing to SatQuest ⚡

Thank you for wanting to make Bitcoin education better. This is an open-source project. Anyone can read the code, fork it, open issues, and submit pull requests.

**Merging is restricted to maintainers only.** See the workflow section below.

---

## Table of Contents

- [Contributing to SatQuest ⚡](#contributing-to-satquest-)
  - [Table of Contents](#table-of-contents)
  - [Contribution Workflow](#contribution-workflow)
    - [The `main` branch is protected](#the-main-branch-is-protected)
    - [Branch protection rules (enforced in GitHub settings)](#branch-protection-rules-enforced-in-github-settings)
  - [What Anyone Can Do](#what-anyone-can-do)
  - [What Only Maintainers Can Do](#what-only-maintainers-can-do)
    - [Becoming a maintainer](#becoming-a-maintainer)
  - [How to Fork and Submit a PR](#how-to-fork-and-submit-a-pr)
    - [Step 1 — Fork the repo](#step-1--fork-the-repo)
    - [Step 2 — Clone YOUR fork (not the original)](#step-2--clone-your-fork-not-the-original)
    - [Step 3 — Create a feature branch](#step-3--create-a-feature-branch)
    - [Step 4 — Make your changes, then build to verify](#step-4--make-your-changes-then-build-to-verify)
    - [Step 5 — Commit and push to your fork](#step-5--commit-and-push-to-your-fork)
    - [Step 6 — Open a Pull Request](#step-6--open-a-pull-request)
  - [Where Level Content Lives](#where-level-content-lives)
  - [Adding Pairs to a Match Level](#adding-pairs-to-a-match-level)
    - [Step 1 — Add the pair to `pairs[]`](#step-1--add-the-pair-to-pairs)
    - [Step 2 — Add the reveal to `reveals[]`](#step-2--add-the-reveal-to-reveals)
  - [Adding a New Level](#adding-a-new-level)
  - [Editing a Word Hunt Puzzle](#editing-a-word-hunt-puzzle)
  - [Adding an Avatar](#adding-an-avatar)
  - [Working on the Profile / Storage Layer](#working-on-the-profile--storage-layer)
  - [Regenerating Home-Screen Icons](#regenerating-home-screen-icons)
  - [Fixing Bugs](#fixing-bugs)
  - [Improving the UI](#improving-the-ui)
    - [Colour palette (current SatQuest)](#colour-palette-current-satquest)
    - [The first-run tour](#the-first-run-tour)
  - [Translating](#translating)
    - [UI strings](#ui-strings)
    - [Level content](#level-content)
  - [Content Guidelines](#content-guidelines)
    - [What makes a good pair?](#what-makes-a-good-pair)
    - [What makes a good reveal?](#what-makes-a-good-reveal)
    - [Accuracy standards](#accuracy-standards)
  - [Pull Request Checklist](#pull-request-checklist)
  - [Current Contributors](#current-contributors)

---

## Contribution Workflow

### The `main` branch is protected

Direct pushes to `main` are **blocked for all contributors** including maintainers.
All changes — no matter how small — must go through a Pull Request.

```text
Your fork → feature branch → Pull Request → maintainer review → merge to main
```

No exceptions.

### Branch protection rules (enforced in GitHub settings)

| Rule | Setting |
| --- | --- |
| Require pull request before merging | ✅ Enabled |
| Required approvals before merge | 1 (maintainer only) |
| Dismiss stale reviews on new push | ✅ Enabled |
| Require status checks to pass | ✅ Build must pass |
| Block force pushes | ✅ Enabled |
| Allow direct pushes | ❌ Disabled for everyone |

---

## What Anyone Can Do

✅ **Fork** the repository to their own GitHub account
✅ **Open issues** to report bugs, suggest new pairs, or request features
✅ **Submit pull requests** from their fork to this repository
✅ **Comment** on issues and pull requests
✅ **Review** open pull requests (reviews from non-maintainers are welcome feedback, not approvals)
✅ **Star** and share the project

---

## What Only Maintainers Can Do

❌ **Merge** pull requests — maintainer permission required
❌ **Approve** pull requests for merge — maintainer only
❌ **Push directly** to `main` or any protected branch
❌ **Change** repository settings, branch protection rules, or team permissions
❌ **Grant** collaborator or maintainer access to other users

### Becoming a maintainer

Maintainer access is granted by the project owner only. To be considered:

- You must have had **at least 3 accepted pull requests** merged into main
- You must be **invited by an existing maintainer**
- Maintainer status is **not automatic** — it is earned through sustained quality contribution

---

## How to Fork and Submit a PR

### Step 1 — Fork the repo

Click the **Fork** button on the top-right of the GitHub repository page.
This creates your own copy of SatQuest at `https://github.com/YOUR-USERNAME/satquest`.

### Step 2 — Clone YOUR fork (not the original)

```bash
git clone https://github.com/YOUR-USERNAME/satquest.git
cd satquest
```

### Step 3 — Create a feature branch

```bash
git checkout -b add/level-5-utxo-pair
# or
git checkout -b fix/wordhunt-timer-leak
```

Branch naming convention:

- `add/description` — for new pairs, levels or word-hunts
- `fix/description` — for bug fixes
- `improve/description` — for UI or UX improvements
- `translate/language-name` — for translations

### Step 4 — Make your changes, then build to verify

SatQuest is a monorepo. Install the part you're touching:

```bash
# Working on the game (UI, levels, content)
cd frontend
npm install
npm run build   # must pass with zero errors before submitting

# Working on the API or level content
cd backend
npm install
npm run build

# Working on the marketing site
cd landing
npm install
npm run build
```

> **Note:** npm may report that install scripts for `esbuild`, `fsevents`, or
> `sharp` are blocked. Those packages are approved in each app's
> `allowScripts` field in `package.json`. If you bump one of them, update the
> pinned version there as well.

### Step 5 — Commit and push to your fork

```bash
git add backend/src/levels/levels.seed.ts
git commit -m "add: UTXO and hash pairs to level 5"
git push origin add/level-5-utxo-pair
```

### Step 6 — Open a Pull Request

Go to `https://github.com/YOUR-USERNAME/satquest` and click **Compare & pull request**.

In the PR description:
- Explain **what** you changed and **why**
- For new content, list the new pairs you added
- For factual claims, link your sources
- For bug fixes, describe what was broken

The maintainer will review and either merge, request changes, or close with explanation.

> ⚠️ **Pull requests submitted directly from the main repository (not a fork) will be closed.**
> You must fork first.

---

## Where Level Content Lives

Levels are **not** bundled in the frontend. They are stored in the backend
database (a `levels` table that keeps each level as JSONB) and served by
`GET /api/levels`. The app caches them in IndexedDB for offline play.

The source you edit is the seed file
[`backend/src/levels/levels.seed.ts`](backend/src/levels/levels.seed.ts) (`LEVELS_SEED`).
This open-source repo ships only a few **demo levels** there. They show the shape
of each game type, not the production curriculum.

After editing the seed, load it into your local database:

```bash
cd backend
npm run seed:levels   # replaces the whole levels table
```

Reload the app. It sees the new content `version` hash and picks it up on the
next session. The field shapes for all five game types (`match`, `wordhunt`,
`crossover`, `scamspot`, `seedorder`) are in the
[root README](README.md#game-types).

---

## Adding Pairs to a Match Level

Each `match` level in `LEVELS_SEED` has a `pairs` array and a `reveals` array.

### Step 1 — Add the pair to `pairs[]`

```js
{
  id: 'unique_snake_case_id',       // unique within this level
  imgEmoji: '🏠',                   // picture side: a concrete visual thing
  imgLabel: 'Short picture description',  // aim under 50 chars
  wordEmoji: '📬',                  // word side: the Bitcoin/Lightning concept
  wordLabel: 'Short concept description', // aim under 50 chars
},
```

Rules:
- `id` must be **unique within the level** (cross-level duplicates are fine)
- `imgEmoji` and `wordEmoji` must not already be used elsewhere in the **same level**
- `imgLabel` = a concrete visual thing, ideally from everyday Nigerian life
- `wordLabel` = the Bitcoin/Lightning concept it maps to
- Aim for under 50 characters in each label — cards are small

### Step 2 — Add the reveal to `reveals[]`

One reveal per pair, in the same order as the pair:

```js
{
  naija: '🏠',       // optional — shown on the Reveal screen; should match imgEmoji
  btc:   '📬',       // optional — should match wordEmoji
  match: 'Short title of what this pair teaches',
  def:   'Educational explanation in 2-4 sentences. Factually accurate. Nigeria-relevant.',
  funny: '😂 "A short, punchy Nigerian-flavoured observation"',
},
```

Rules:
- If you set `naija` / `btc`, they must **exactly match** the pair's `imgEmoji` / `wordEmoji`
- `def` must be factually accurate — include source links in your PR description
- `funny` should feel natural and Nigerian-flavoured. If you cannot think of a good one, keep it mild

---

## Adding a New Level

1. **Copy an existing entry** of the same `type` in `LEVELS_SEED`
2. **Give it a unique `id`.** The array order is the play order; `badge` and `chapter` are display labels
3. **Set `stage`** (`1` or `2`). Levels unlock one after another in array order, so keep all Stage 1 entries before the Stage 2 entries
4. **For a match level, write 5-9 pairs** with matching reveals (early levels 4-5 pairs, later levels 7-9)
5. **Choose `points`.** Increase it gradually as levels get harder. The backend is authoritative for points credited; the client only displays the value
6. **Choose `hintColor`.** Any hex works; keep it readable on both dark and light themes
7. **Add `concepts`**, a list of short concept tags used for spaced-repetition review
8. **Run `npm run build` and `npm run seed:levels`** in `backend/`, then play the level in the frontend

**Topic ideas for new levels:**
- Bitcoin vs gold comparison
- Reading a block explorer
- Running a full node at home
- Nostr in depth
- Bitcoin and the environment
- Layer 2s beyond Lightning
- Bitcoin ETFs and what they mean for Africans

---

## Editing a Word Hunt Puzzle

Word Hunts are timed `wordhunt` entries in `LEVELS_SEED`:

```js
{
  id: 2, type: 'wordhunt', stage: 1,
  title: 'Word Hunt: Big words',
  story: 'Plenty Bitcoin words now mixed with bank and crypto words.',
  hint: 'Tap Bitcoin words only',
  hintColor: '#00FFB3',
  points: 2,
  timeLimit: 35,                                           // seconds
  real:  ['Seed Phrase', 'Private Key', 'Block', ...],    // tap these
  decoy: ['Password', 'Username', 'IBAN', 'SWIFT', ...],  // skip these
},
```

Rules:
- `real` must contain only Bitcoin-specific words (Wallet, Sats, Lightning, Block, ASIC, HODL, etc.)
- `decoy` must contain only **non-Bitcoin** finance words (ATM, IBAN, Stocks, Mortgage, eNaira, Crypto, NFT, etc.)
- 5-8 real words is a good range. Decoys can be slightly more
- `timeLimit` should leave a 1.5-2x buffer above a competent player's solve time
- Words taught in the preceding match levels should appear in `real`. This makes the puzzle feel like a review

---

## Adding an Avatar

Avatars are built in a loop in [`frontend/src/data/levels.js`](frontend/src/data/levels.js).
There are 19 female and 19 male round portraits, interleaved, with stable ids
(`avF1`, `avM1`, `avF2`, …).

1. Add the new image(s) to [`frontend/src/avatars/`](frontend/src/avatars/) using the
   existing naming pattern `Size_XXL__2048px______Avatar_<female|male>_<N>_____Round_no.webp`
   (transparent background, square)
2. Bump `AVATAR_COUNT` if you're adding a full female + male pair. Otherwise
   append a single entry to the list in `buildAvatars()`
3. **Never renumber existing ids.** Saved profiles reference them. Old `av1`–`av7`
   ids are mapped through `LEGACY_AVATAR_MAP`, so keep that map intact
4. That's it. The entry carousel, `ProfileEditor`, and the 3D `AvatarWalker` on the
   quest map all read from `AVATARS`

The `emoji` field is a fallback shown only if the image fails to load. If the
avatar should also appear on the marketing site, add it to `landing/src/avatars/`.

---

## Working on the Profile / Storage Layer

[`frontend/src/lib/storage.js`](frontend/src/lib/storage.js ) is the persistence layer.

```text
localStorage
├── satquest.profile   { username, avatarId, createdAt, updatedAt }
├── satquest.progress  { sats, unlockedUpTo, levels, deviceId, updatedAt }
├── satquest.deviceId  stable per-browser id (sent as x-device-id)
├── satquest.lang      chosen UI language (managed by src/i18n/index.js)
└── satquest.tourDone  '1' once the first-run tour is finished or skipped
```

If you change the schema:
- **Keep `loadProfile()` / `loadProgress()` backwards-compatible** — old players' data must keep working
- **Preserve the legacy-key migration** (`omosats.*` → `satquest.*`)
- **Update the doc comments** at the top of the file
- **Add a new field to `recordLevelResult()`** if tracking new per-level data

`syncProgress(progress, profile)` PUTs local progress to `/api/progress`. The backend merges it and queues rewards. It must never throw, because the game keeps working offline. Do not change its signature.

---

## Regenerating Home-Screen Icons

If you edit [`frontend/public/icon.svg`](frontend/public/icon.svg ):

```bash
cd frontend
npm run icons
```

This regenerates:

- `frontend/public/apple-touch-icon.png` (180×180, iPhone)
- `frontend/public/icon-192.png`, `frontend/public/icon-512.png` (Android)
- `frontend/public/icon-maskable-512.png` (Android adaptive, with safe-zone padding)
- `frontend/public/favicon-16.png`, `frontend/public/favicon-32.png`

Commit all generated PNGs alongside the SVG. They are referenced from [`frontend/index.html`](frontend/index.html ) and [`frontend/vite.config.js`](frontend/vite.config.js ) (PWA manifest).

---

## Fixing Bugs

1. Fork the repo (see above)
2. Create a fix branch: `git checkout -b fix/describe-the-bug`
3. Fix the issue
4. Run `npm run build` — it must pass with zero errors
5. Open a pull request with a clear description of what broke and how you fixed it

---

## Improving the UI

- All styles use **CSS Modules** — edit the `.module.css` file co-located with the component
- CSS custom properties (variables) are defined in [`frontend/src/index.css`](frontend/src/index.css ) — use them, do not hardcode hex values
- Several themes exist (see [`useTheme.jsx`](frontend/src/hooks/useTheme.jsx) / `ThemePicker`). Check your change in at least the dark and light themes
- The design targets **430px max-width** phone-first. Test at 375px (iPhone SE) and 390px (iPhone 14)
- Animations should use `cubic-bezier(.34,1.56,.64,1)` for the spring bounce feel
- **No hardcoded user-facing text.** Add a key to `frontend/src/i18n/en.js` and use `t('your.key')` (see [Translating](#translating))
- Fonts: Orbitron (display) and Sora (UI), with **Noto Sans** as fallback so Yorùbá diacritics (ẹ, ọ, ṣ, tone marks) render correctly

### Colour palette (current SatQuest)

Default dark theme:

| Variable | Hex | Use |
|---|---|---|
| `--bg-0` / `--bg-1` / `--bg-2` | `#050505` / `#0a0a0c` / `#101018` | Backgrounds, darkest to lightest |
| `--neon-blue` | `#2ad8ff` | Primary accent, info, glows |
| `--neon-purple` | `#9945ff` | Secondary accent, selected state |
| `--gold` | `#f7c948` | Sats, rewards, Bitcoin highlights |
| `--text-hi` | `#f4f7ff` | Primary text |
| `--text-mid` | `#aab2c8` | Secondary text |
| `--text-lo` | `#6c7390` | Tertiary text, labels |

Each theme redefines these variables under `[data-theme="…"]`, so components
only need the variable names.

### The first-run tour

New players get a spotlight walkthrough ([`frontend/src/ui/Tour.jsx`](frontend/src/ui/Tour.jsx)).
Steps are listed in `TOUR_STEPS` in [`App.jsx`](frontend/src/App.jsx). Each step points
at an element tagged `data-tour="<anchor>"`. If you move or rename a tagged element
(map, sats counter, bottom-nav tabs), keep its `data-tour` attribute, or the
tour falls back to a centred card. Step text lives under the `tour.*` i18n keys. To
replay the tour, delete `satquest.tourDone` from localStorage.

---

## Translating

SatQuest uses English with Nigerian cultural references. Translation has two
parts, and a language is only switched on for players when **both** are done.

| Language | Code | UI strings | Level content |
|---|---|---|---|
| English | `en` | ✅ | ✅ |
| Yorùbá | `yo` | ✅ drafted (`yo.js`) | ⏳ wanted |
| Hausa | `ha` | ⏳ wanted | ⏳ wanted |
| Igbo | `ig` | ⏳ wanted | ⏳ wanted |
| Naijá (Pidgin) | `pcm` | ⏳ wanted | ⏳ wanted |
| Français | `fr` | ⏳ wanted | ⏳ wanted |

To avoid duplicated effort, **open an issue** titled `[Translation] Yoruba` (or your language) before starting. A maintainer will assign it to you. Use a `translate/<language>` branch.

### UI strings

1. Copy [`frontend/src/i18n/en.js`](frontend/src/i18n/en.js) to `frontend/src/i18n/<code>.js` and translate the values. **Keep every key and every `{placeholder}` unchanged.** Plurals use `.one` / `.other` keys
2. Missing keys fall back to English, so you can submit a partial translation
3. Import the file and add it to `LOCALES` in [`frontend/src/i18n/index.js`](frontend/src/i18n/index.js)
4. **Leave `available: false`** for your language in `LANGUAGES`. It shows as "coming soon" in the Profile picker. Flip it to `true` locally to test, but don't commit that. A maintainer turns it on once the level content is translated too

### Level content

Level text (titles, stories, hints, pairs, reveals, questions, scam scenarios) is translated with a per-level `i18n` overlay in [`backend/src/levels/levels.seed.ts`](backend/src/levels/levels.seed.ts):

```js
{
  id: 1, type: 'match', title: 'Coin', /* …English fields… */
  i18n: {
    yo: {
      title: 'Owó',
      pairs:   [{ imgLabel: '…', wordLabel: '…' }, /* same order as English */],
      reveals: [{ match: '…', def: '…', funny: '…' }],
    },
  },
}
```

- Supply **text fields only**. Ids, answers, emojis, and points come from the English level
- Arrays of objects (`pairs`, `reveals`, `questions`, `scenarios`) merge **index by index**, so keep the same order
- Arrays of plain strings (`real`, `decoy`, quiz `options`) are **replaced whole**. Translate every item and keep the same order, because `answer` indexes into `options`
- Anything you leave out stays in English

---

## Content Guidelines

### What makes a good pair?

✅ **Good:**
```
imgLabel: "Piggy bank with a big hole in it"
wordLabel: "Your savings losing value while you sleep"
```
- Concrete Nigerian visual → abstract Bitcoin concept
- Short enough to fit in a card
- Teaches something specific

❌ **Bad:**
```
imgLabel: "Something about money"
wordLabel: "Bitcoin thing"
```
- Too vague
- Does not teach anything

### What makes a good reveal?

✅ **Good:**
```
def: "Nigerian inflation has been between 20 and 30 percent in recent years.
      That means 100,000 naira saved today is worth about 75,000 naira in
      real value by next year."

funny: '😂 "You saved all year and lost value without spending anything. Nigeria things!"'
```
- Specific numbers, verifiable
- Real Nigerian context
- Funny without being condescending

❌ **Bad:**
```
def: "Inflation is bad and Bitcoin fixes it."
funny: '😂 "haha"'
```

### Accuracy standards

- All factual claims must be verifiable — link sources in your PR description
- No Bitcoin price predictions
- Do not state opinions as facts
- Regulatory information must note it may vary by jurisdiction

---

## Pull Request Checklist

Before submitting, confirm:

- [ ] You forked the repo and are submitting from your fork (not a direct push)
- [ ] Your branch is named according to the convention (`add/`, `fix/`, `improve/`, `translate/`)
- [ ] `npm run build` passes with zero errors in every app you touched
- [ ] New match pairs have both a `pairs[]` entry and a matching `reveals[]` entry
- [ ] All emoji in a level are unique within that level
- [ ] Labels are under 50 characters
- [ ] Word Hunt `real[]` contains only Bitcoin-specific words, `decoy[]` only non-Bitcoin
- [ ] New user-facing text goes through `t()` with a key in `en.js` (no hardcoded strings)
- [ ] Translations keep every key and `{placeholder}` intact, and the language stays `available: false`
- [ ] If you changed [`icon.svg`](frontend/public/icon.svg ), you ran `npm run icons` and committed the PNGs
- [ ] Factual claims have sources linked in the PR description
- [ ] PR description explains what you changed and why

Pull requests that do not pass the build or skip the above checklist will be closed until fixed.

---

## Current Contributors

| Name | GitHub | Contribution |
|---|---|---|
| *(your name here)* | *(your GitHub handle)* | *(what you added or fixed)* |

Add yourself to this table in your first merged pull request.

---

*SatQuest is MIT licenced. All contributors retain credit in this file and in the git history.*
*Merge permission is held by maintainers only. Fork first. Always.*
