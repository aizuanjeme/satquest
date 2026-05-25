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
  - [Adding Pairs to a Match Level](#adding-pairs-to-a-match-level)
    - [Step 1 — Add the pair to `pairs[]`](#step-1--add-the-pair-to-pairs)
    - [Step 2 — Add the reveal to `reveals[]`](#step-2--add-the-reveal-to-reveals)
  - [Adding a New Match Level](#adding-a-new-match-level)
  - [Editing a Word Hunt Puzzle](#editing-a-word-hunt-puzzle)
  - [Adding an Avatar](#adding-an-avatar)
  - [Working on the Profile / Storage Layer](#working-on-the-profile--storage-layer)
  - [Regenerating Home-Screen Icons](#regenerating-home-screen-icons)
  - [Fixing Bugs](#fixing-bugs)
  - [Improving the UI](#improving-the-ui)
    - [Colour palette (current SatQuest)](#colour-palette-current-satquest)
    - [Match colour palette (for matched pair badges)](#match-colour-palette-for-matched-pair-badges)
  - [Translating](#translating)
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

# Working on the API
cd backend
npm install
npm run build
```

### Step 5 — Commit and push to your fork

```bash
git add frontend/src/data/levels.js
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

## Adding Pairs to a Match Level

All game content lives in [`frontend/src/data/levels.js`](frontend/src/data/levels.js ). Each match level has a `pairs` array and a `reveals` array.

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
  naija: '🏠',       // must exactly match imgEmoji above
  btc:   '📬',       // must exactly match wordEmoji above
  match: 'Short title of what this pair teaches',
  def:   'Educational explanation in 2-4 sentences. Factually accurate. Nigeria-relevant.',
  funny: '😂 "A short, punchy Nigerian-flavoured observation"',
},
```

Rules:
- `naija` must **exactly match** the `imgEmoji` of its pair
- `btc` must **exactly match** the `wordEmoji` of its pair
- `def` must be factually accurate — include source links in your PR description
- `funny` should feel natural and Nigerian-flavoured. If you cannot think of a good one, keep it mild

---

## Adding a New Match Level

1. **Copy the structure** of an existing level in the `LEVELS` array (top half of [`levels.js`](frontend/src/data/levels.js ))
2. **Set `id`** and `badge` — but note these get **auto-renumbered** by `buildLevels()` at the bottom of the file (Word Hunts are spliced in every 3rd level), so use them as readable comments only
3. **Write 5-9 pairs** with matching reveals (early levels = 4-5 pairs, later levels = 7-9)
4. **Choose `sats`** — increase gradually as levels get harder
5. **Choose `hintColor`** — use one of the palette colours below
6. **Update `POSITIONS`** in [`frontend/src/components/LevelMap.jsx`](frontend/src/components/LevelMap.jsx ) if you added enough levels to overflow the existing zig-zag array
7. **Run `npm run build`** — verify the level count, sats total, and rendering are all good

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

Word Hunts are the timed puzzles that appear every 4th level. They live in the `WORD_HUNTS` array at the bottom of [`levels.js`](frontend/src/data/levels.js ).

```js
{
  title: 'Word Hunt: Big words',
  story: 'Plenty Bitcoin words now mixed with bank and crypto words.',
  hint: 'Tap Bitcoin words only',
  hintColor: '#00FFB3',
  sats: 25,
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
- Words taught in the preceding 3 match levels should appear in `real`. This makes the puzzle feel like a review

If you add a 7th Word Hunt, also add another entry to `WORD_HUNTS` — they auto-slot every 3 match levels via `buildLevels()`.

---

## Adding an Avatar

1. Add a new image file to [`frontend/src/avatars/`](frontend/src/avatars/ ) using the naming pattern `N_nobg.webp` (transparent background, square, ~256-512px)
2. Append a new entry to `AVATARS` in [`frontend/src/data/levels.js`](frontend/src/data/levels.js ):

   ```js
   { id: 'av8', img: avatarUrl(8), emoji: '👧🏾', name: 'Character 8' },
   ```

3. That's it — the avatar grid in [`AvatarPick.jsx`](frontend/src/components/AvatarPick.jsx ) and the [`ProfileEditor`](frontend/src/components/ProfileEditor.jsx ) modal both render the full `AVATARS` array, so the new character appears automatically

The `emoji` field is a fallback shown only if the image fails to load.

---

## Working on the Profile / Storage Layer

[`frontend/src/lib/storage.js`](frontend/src/lib/storage.js ) is the persistence layer.

```text
localStorage
├── satquest.profile   { username, avatarId, createdAt, updatedAt }
├── satquest.progress  { sats, unlockedUpTo, levels, deviceId, updatedAt }
└── satquest.deviceId  stable per-browser uuid
```

If you change the schema:
- **Keep `loadProfile()` / `loadProgress()` backwards-compatible** — old players' data must keep working
- **Preserve the legacy-key migration** (`omosats.*` → `satquest.*`)
- **Update the doc comments** at the top of the file
- **Add a new field to `recordLevelResult()`** if tracking new per-level data

The `syncProgress(progress, profile)` function is intentionally a no-op stub right now. When you wire a backend, replace its body with the real `fetch()` call. Do not change its signature.

---

## Regenerating Home-Screen Icons

If you edit [`frontend/public/icon.svg`](frontend/public/icon.svg ):

```bash
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
- The design targets **430px max-width** phone-first. Test at 375px (iPhone SE) and 390px (iPhone 14)
- Animations should use `cubic-bezier(.34,1.56,.64,1)` for the spring bounce feel
- Keep the SatQuest deep-violet theme (`--bg: #0b0030`) and vibrant arcade palette

### Colour palette (current SatQuest)

| Variable | Hex | Use |
|---|---|---|
| `--orange` | `#FF9500` | Bitcoin, primary actions, picture card stripe |
| `--yellow` | `#FFE600` | Lightning accents, brand gradient end |
| `--purple` | `#B845FF` | Selected state, word card stripe, hero gradient start |
| `--green`  | `#00FFB3` | Matched, success, timer-ok |
| `--pink`   | `#FF2D92` | Hot accents, brand gradient mid |
| `--cyan`   | `#00E5FF` | Wallet, info elements |
| `--red`    | `#FF5670` | Wrong answer, errors, time-running-out |
| `--text`   | `#FFF7FF` | Primary text |
| `--muted2` | `#B095E8` | Secondary text |
| `--muted`  | `#7A5DC9` | Tertiary text, labels |

### Match colour palette (for matched pair badges)

When a pair is matched, both cards in the pair get the same colour badge showing the match number. These colours cycle:

```
1 → #00FFB3  (mint)
2 → #00E5FF  (cyan)
3 → #B845FF  (purple)
4 → #FF9500  (orange)
5 → #FF2D92  (pink)
6 → #FFE600  (yellow)
7 → #38BDF8  (sky blue)
8 → #A3E635  (lime)
9 → #FB923C  (peach)
```

Defined in [`frontend/src/components/GameBoard.jsx`](frontend/src/components/GameBoard.jsx ) as `MATCH_COLORS`. Do not change these without a strong reason — they are the visual anchor for the match-identification system.

---

## Translating

SatQuest is currently English with Nigerian cultural references. Wanted:

- **Yoruba** — `story`, `hint`, `def`, `funny` fields per level
- **Igbo** — same fields
- **Hausa** — same fields
- **Pidgin English** — a full Pidgin version (many `def` fields are already close!)

To avoid duplicated effort, **open an issue** titled `[Translation] Yoruba` (or your language) before starting. A maintainer will assign it to you.

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
- [ ] `npm run build` passes with zero errors
- [ ] New match pairs have both a `pairs[]` entry and a matching `reveals[]` entry
- [ ] All emoji in a level are unique within that level
- [ ] Labels are under 50 characters
- [ ] Word Hunt `real[]` contains only Bitcoin-specific words, `decoy[]` only non-Bitcoin
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
