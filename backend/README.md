# SatQuest Backend ⚡

NestJS + PostgreSQL API behind the SatQuest PWA. Handles profiles, progress
sync, the global leaderboard, level content, player feedback, server-authored
point rewards, and non-custodial Lightning wallets (one per player) via the
Breez SDK.

All routes are mounted under a global **`/api`** prefix.

## Stack

- **NestJS 10** (Express adapter) + **TypeScript 5**
- **TypeORM 0.3** + **PostgreSQL** (`pg`)
- **@nestjs/config** — typed env access (`ConfigService`)
- **class-validator** / **class-transformer** — strict DTO validation
- **Breez SDK — Spark** (`@breeztech/breez-sdk-spark`) — per-player non-custodial Lightning
- **bip39** — BIP-39 mnemonic generation for each wallet

## Quick start

```bash
cd backend
npm install
cp .env.example .env       # fill in DATABASE_URL, PROFILE_ENC_KEY, BREEZ_* …
npm run start:dev
```

The server listens on `http://localhost:3000/api` and prints the URL on boot.
With `DB_SYNCHRONIZE=true` (the default) TypeORM creates/updates tables from
the entities on startup.

> Levels are **not** seeded on boot. After the DB is up, load the bundled demo
> levels once with `npm run seed:levels` (see [Levels & seeding](#levels--seeding)).

## Environment

Configured entirely through `.env` (see [`.env.example`](.env.example) for the
full annotated list). Key variables:

| Variable | Purpose |
| --- | --- |
| `PORT` | Port to listen on (default `3000`) |
| `DATABASE_URL` | Postgres connection string (or use the discrete `DB_*` vars) |
| `DATABASE_SSL` | `true` for managed providers (Supabase / Neon / RDS / Render / Railway / Fly). Auto-detected for known hosts |
| `DB_SYNCHRONIZE` | Auto-sync schema from entities. Handy in dev, **never** in production — use migrations |
| `DB_LOGGING` | Log every SQL statement |
| `CORS_ORIGINS` | Comma-separated allowed browser origins. **Unset = reflect any origin (dev only)** |
| `PROFILE_ENC_KEY` | Key for at-rest mnemonic encryption (AES-256-GCM). 64 hex chars, 32-byte base64, or a passphrase (scrypt-stretched). **Unset = plaintext (dev only)** |
| `BREEZ_API_KEY` | Breez SDK key. Without it the Lightning endpoints return `503` and the rest of the API keeps working |
| `BREEZ_NETWORK` | `mainnet` or `regtest` |
| `BREEZ_STORAGE_DIR` | Where per-wallet SDK state is persisted (a subdir per username) |
| `BREEZ_SERVER_MNEMONIC` | BIP-39 mnemonic for the **server reward wallet** that funds reward payouts on `/claim` |
| `BREEZ_LNURL_DOMAIN` | LNURL-pay domain for each player's Lightning Address (default `breez.tips`) |

Generate a Breez key at <https://breez.technology/request-api-key/>.

## Security model

There is **no login** by design — identity is a username, and usernames are
public (the leaderboard lists them). The sensitive actions are protected
without auth:

- **One account per device.** Each `deviceId` may own at most one username.
  Creating a second account from the same device, or re-registering an existing
  username from a different device, is rejected (`409`). The device is bound on
  first use (trust-on-first-use).
- **Device-gated seed reveal.** `GET /api/profile/:username/seed` requires the
  `x-device-id` header to match the profile's bound device, otherwise `403`.
- **Device-gated Lightning send.** `POST /api/lightning/:username/send` calls
  `assertDeviceOwner()` before paying, so a wallet can't be drained by username
  alone.
- **Mnemonics encrypted at rest** (AES-256-GCM, format `enc.v1:iv.tag.cipher`)
  when `PROFILE_ENC_KEY` is set. The mnemonic is **never** returned except
  through the device-gated seed endpoint, and a SHA-256 `mnemonicHash` column
  enables restore-by-seed without querying ciphertext.
- **Strict validation.** A global `ValidationPipe` (`whitelist` +
  `forbidNonWhitelisted` + `transform`) rejects any field not declared on a DTO.
- **CORS lock.** Set `CORS_ORIGINS` in production to allow only known origins.

To encrypt mnemonics that were written before a key was configured, run the
idempotent migration once: `npm run encrypt:mnemonics`.

## Rewards flow (points → sats)

Gameplay accrues **points**, which convert to **sats** only at claim time:

1. When a level is first completed, `ProgressService` credits server-authored
   points via `RewardsService.addPending(username, levelId, points)`. The amount
   comes from the levels table — the client's reported amount is ignored.
2. The exchange rate lives in the `app_config` table (`POINTS_PER_SAT`, default
   **100 points = 1 sat**) and is read through `AppConfigService`.
3. `POST /api/rewards/:username/claim` sums unclaimed points
   (`floor(totalPoints / pointsPerSat)`), pays the player from the server
   reward wallet over Lightning, and only marks rows claimed after payment
   succeeds.

## Levels & seeding

This open-source repo ships **3 placeholder demo levels** in
[`src/levels/levels.seed.ts`](src/levels/levels.seed.ts) (one `match`, one
`wordhunt`, one `crossover`) so the app is runnable and contributors can see the
shape of each game type. It is **not** the production curriculum.

Seeding is a **manual action** — the server never seeds on boot, so it can't
silently rewrite or clear a live database:

```bash
npm run seed:levels
```

This runs [`src/levels/seed-levels.script.ts`](src/levels/seed-levels.script.ts),
which calls `LevelsService.seed()` to replace the whole `levels` table in a
transaction (and refuses to run if the seed array is empty). `GET /api/levels`
then serves the ordered set plus a content `version` hash that the frontend
caches in IndexedDB for offline play.

## Endpoints

| Method | Path | Headers / Body | Purpose |
| --- | --- | --- | --- |
| GET | `/api/health` | — | Liveness probe |
| GET | `/api/config` | — | List runtime config (e.g. `POINTS_PER_SAT`) |
| GET | `/api/config/:key` | — | Fetch one config value |
| PUT | `/api/config/:key` | `{ value }` | Update a config value |
| GET | `/api/levels` | — | Ordered level set + content `version` for offline caching |
| POST | `/api/profile` | `{ username, avatarId, deviceId? }` | Create a profile + mint a Lightning wallet |
| GET | `/api/profile/:username` | — | Fetch a profile (mnemonic excluded) |
| PATCH | `/api/profile/:username` | `{ avatarId?, deviceId? }` | Update avatar (username is immutable) |
| GET | `/api/profile/:username/seed` | `x-device-id` | Reveal the BIP-39 mnemonic for backup (device-gated) |
| POST | `/api/profile/restore` | `{ mnemonic }` | Re-import an account on a new device by seed phrase |
| PUT | `/api/progress` | progress object (`username`, `levels`, …) | Upsert progress (merged server-side) |
| GET | `/api/progress/:username` | — | Latest server progress |
| GET | `/api/leaderboard` | `?page=1&limit=20` | Paginated top players by sats |
| GET | `/api/rewards/:username` | — | Unclaimed points + exchange rate |
| POST | `/api/rewards/:username/claim` | — | Pay all pending rewards over Lightning |
| POST | `/api/rewards/:username/share` | — | Add a small share bonus |
| GET | `/api/lightning/:username/info` | — | Wallet balance + identity pubkey |
| POST | `/api/lightning/:username/invoice` | `{ description, amountSats?, expirySecs? }` | Generate a BOLT11 invoice |
| POST | `/api/lightning/:username/send` | `{ paymentRequest, amountSats? }` + `x-device-id` | Pay an invoice / address (device-gated) |
| GET | `/api/lightning/:username/events` | SSE | Real-time wallet event stream |
| POST | `/api/feedback` | `{ username, message, rating?, category? }` | Submit player feedback |
| GET | `/api/feedback` | `?username=` (optional) | List feedback, newest first |
| GET | `/api/feedback/:id` | — | Fetch one feedback entry |
| GET | `/api/rss/medium` | — | Proxy/parse the project's Medium feed |

Each player has a non-custodial wallet derived from a fresh BIP-39 mnemonic
generated on profile creation. The mnemonic never crosses the wire except via
the device-gated seed endpoint.

## Folder structure

```
backend/
├── src/
│   ├── main.ts                 # bootstrap, /api prefix, CORS, ValidationPipe
│   ├── app.module.ts           # module wiring (ConfigModule global)
│   ├── database/               # TypeORM + Postgres connection config
│   ├── app-config/             # runtime config table (POINTS_PER_SAT)
│   ├── health/                 # GET /api/health
│   ├── levels/                 # demo seed + manual seed action + GET /api/levels
│   ├── profile/                # profiles, device binding, mnemonic crypto, restore
│   ├── progress/               # progress merge + server-authored point crediting
│   ├── leaderboard/            # GET /api/leaderboard
│   ├── rewards/                # points → sats claim flow
│   ├── lightning/              # Breez SDK wrapper: info / invoice / send / events
│   ├── feedback/               # player feedback
│   └── rss/                    # Medium feed proxy
├── .env.example
├── tsconfig.json
├── nest-cli.json
├── Dockerfile
└── package.json
```

## Scripts

| Command | What it does |
| --- | --- |
| `npm run start:dev` | Watch mode (auto-reload) |
| `npm run start` | Run without watch |
| `npm run build` | Compile to `dist/` |
| `npm run start:prod` | Run the compiled bundle (`node dist/main`) |
| `npm run seed:levels` | Build, then load the bundled demo levels into the DB |
| `npm run encrypt:mnemonics` | Build, then encrypt existing plaintext mnemonics at rest |
| `npm run lint` | ESLint with auto-fix |
| `npm run test` | Jest unit tests |

## Production notes

- Set `CORS_ORIGINS` and `PROFILE_ENC_KEY`, and use `DB_SYNCHRONIZE=false` with
  real migrations.
- Keep `BREEZ_SERVER_MNEMONIC` and `PROFILE_ENC_KEY` secret and backed up —
  losing the encryption key makes existing encrypted wallets unrecoverable.
- A [`Dockerfile`](Dockerfile) is included for container deploys
  (Fly.io / Railway / Render).
