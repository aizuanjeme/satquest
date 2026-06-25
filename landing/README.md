# SatQuest Landing ⚡

The public marketing site for SatQuest (`satquests.com`) — a single-page React
app with an animated Three.js backdrop. It introduces the game, shows a live
leaderboard and player feedback pulled from the backend, lists recent blog posts,
and links players to the app at `app.satquests.com`.

## Stack

- **React 18** + **react-router-dom 7**
- **Vite 6**
- **Three.js 0.176** — animated starfield/nebula background (`rendering/BgScene.js`)

## Quick start

```bash
cd landing
npm install
npm run dev
```

Opens at `http://localhost:5180`. The live data widgets call `/api/*`, proxied to
the backend at `http://localhost:3000` in dev.

## Configuration

- **`VITE_API_BASE`** — base path/URL for backend calls. Defaults to `/api`
  (relative, using the dev proxy). Set it for production if the API lives on a
  different origin.

## Routes

| Path | Page |
| --- | --- |
| `/` | Main landing page (hero, stats, how-it-works, leaderboard, feedback, blog, community, footer) |
| `/tournament` | Tournament "coming soon" page |

## Data sources

| Section | Call | Fallback |
| --- | --- | --- |
| Leaderboard widget | `GET /api/leaderboard?limit=10&page=1` | mock top-10 |
| Feedback carousel | `GET /api/feedback` | static quotes |
| Blog feed | Medium RSS via `api.rss2json.com` (external) | static posts |

Every data section degrades gracefully to static content if the request fails,
so the page always renders.

## Project structure

```
landing/
├── public/                     # robots, sitemap, redirects
├── src/
│   ├── main.jsx                # entry; wraps App in BrowserRouter
│   ├── App.jsx                 # routes + landing section composition
│   ├── index.css
│   ├── avatars/                # avatar webp images (leaderboard/feedback/hero)
│   ├── rendering/
│   │   └── BgScene.js           # Three.js animated background (stars, nebula, shards)
│   ├── components/
│   │   ├── Nav.jsx              # top nav + "Play Free" → app.satquests.com
│   │   ├── Hero.jsx             # headline, orbiting avatars, primary CTA
│   │   ├── Stats.jsx            # key metrics
│   │   ├── HowItWorks.jsx       # gameplay overview
│   │   ├── Leaderboard.jsx      # live top-10 widget
│   │   ├── Feedback.jsx         # player reviews carousel
│   │   ├── Blog.jsx             # Medium blog feed
│   │   ├── Community.jsx        # community / social links
│   │   ├── Tournament.jsx       # tournament teaser section
│   │   └── Footer.jsx
│   └── pages/
│       └── TournamentPage.jsx   # /tournament route
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
| `npm run dev` | Dev server on port 5180 (proxies `/api` to the backend) |
| `npm run build` | Production build → `dist/` |
| `npm run preview` | Preview the production build locally |

## Deploy

`dist/` is a static bundle deployable to Netlify (`netlify.toml` included) or via
Nginx (`nginx.conf` / `Dockerfile`). Set `VITE_API_BASE` at build time if the API
is on a different origin.
