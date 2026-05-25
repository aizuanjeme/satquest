# SatQuest Backend ⚡

NestJS API that powers the SatQuest PWA's profile sync, progress merging, and global leaderboard.

## Stack

- **NestJS 10** (Express adapter)
- **TypeScript 5**
- **class-validator** for DTO validation
- **Breez SDK — Spark** (`@breeztech/breez-sdk-spark`) for non-custodial Lightning per player
- **bip39** for BIP-39 mnemonic generation
- In-memory store (swap with Postgres / MongoDB / Supabase later — service interfaces are stable)

## Quick start

```bash
cd backend
npm install
cp .env.example .env
npm run start:dev
```

The server listens on `http://localhost:3000/api`.

## Endpoints

### Core

| Method | Path                       | Purpose                                          |
| ------ | -------------------------- | ------------------------------------------------ |
| GET    | `/api/health`              | Liveness probe                                   |
| POST   | `/api/profile`             | Create a profile (also mints a Lightning wallet) |
| GET    | `/api/profile/:username`   | Fetch a profile (mnemonic stripped)              |
| PATCH  | `/api/profile/:username`   | Update avatar                                    |
| PUT    | `/api/progress`            | Upsert progress (server merges per-level)        |
| GET    | `/api/progress/:username`  | Latest server progress                           |
| GET    | `/api/leaderboard?limit=N` | Top players by sats                              |

### Lightning (Breez SDK — Spark)

| Method | Path                               | Purpose                                                 |
| ------ | ---------------------------------- | ------------------------------------------------------- |
| GET    | `/api/lightning/:username/info`    | Balance + Spark identity pubkey                         |
| POST   | `/api/lightning/:username/invoice` | Generate a BOLT11 invoice the player can share          |
| POST   | `/api/lightning/:username/send`    | Pay a BOLT11 invoice, Bitcoin address, or Spark address |

Each player has their own non-custodial wallet derived from a fresh BIP-39
mnemonic generated server-side on profile creation. The mnemonic is **never**
returned over the wire — the profile controller strips it before responding.

The DTOs mirror the localStorage shapes used by the frontend
(`frontend/src/lib/storage.js`), so plugging real sync into
`syncProgress()` is a one-line `fetch` call.

### Configure Breez

1. Request an API key: https://breez.technology/request-api-key/
2. Set the env vars in `backend/.env`:

   ```
   BREEZ_API_KEY=<your key>
   BREEZ_NETWORK=mainnet      # or `regtest` for dev
   BREEZ_STORAGE_DIR=./.breez
   ```

3. Restart `npm run start:dev`. If `BREEZ_API_KEY` is missing the server still
   boots — the Lightning endpoints just return `503 Service Unavailable` and the
   rest of the API works fine.

> **Security:** in this demo each player's mnemonic is stored in memory in
> plaintext. Before going to production, persist it in a database with at-rest
> encryption (e.g. AES-GCM with a key from AWS KMS / GCP KMS / Hashicorp Vault,
> pgcrypto for Postgres, or libsodium secretbox).

## Folder structure

```
backend/
├── src/
│   ├── main.ts                 # bootstrap, global /api prefix, validation
│   ├── app.module.ts
│   ├── health/                 # GET /api/health
│   ├── profile/                # POST / GET / PATCH /api/profile (+ mnemonic mint)
│   ├── progress/               # PUT / GET /api/progress (merge logic here)
│   ├── leaderboard/            # GET /api/leaderboard
│   └── lightning/              # Breez SDK wrapper — invoice / send / info
├── .env.example              # BREEZ_API_KEY + network + storage dir
├── tsconfig.json
├── nest-cli.json
├── package.json
└── README.md
```

## Scripts

| Command              | What it does                               |
| -------------------- | ------------------------------------------ |
| `npm run start:dev`  | Watch mode (auto-reload on file changes)   |
| `npm run build`      | Compile to `dist/`                         |
| `npm run start:prod` | Run the compiled bundle (`node dist/main`) |
| `npm run lint`       | ESLint with auto-fix                       |
| `npm run test`       | Run Jest unit tests                        |

## Next steps

- Wire a real database (suggested: Postgres + Prisma, or Supabase for hosted)
- Add JWT auth so a player can sync from a second device
- Add a `/api/leaderboard?period=week` filter
- Containerise with a `Dockerfile` for deploy to Fly.io / Railway / Render
