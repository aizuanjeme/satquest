/*
  SatQuest backend client.

  All calls use a relative `/api/...` URL. In dev the Vite proxy forwards them
  to http://localhost:3000; in production set VITE_API_URL at build time and
  Netlify (or your host) serves the same path from the deployed API.
*/

const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

function url(path) {
  return `${BASE}/api${path}`
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const res = await fetch(url(path), {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  })
  const text = await res.text()
  const json = text ? safeJson(text) : null
  if (!res.ok) {
    const err = new Error(json?.message || `${res.status} ${res.statusText}`)
    err.status = res.status
    err.body = json
    throw err
  }
  return json
}

function safeJson(text) {
  try { return JSON.parse(text) } catch { return null }
}

/* ---------- Profile ---------- */

export const profileApi = {
  create: (dto) => request('/profile', { method: 'POST', body: dto }),
  get:    (username) => request(`/profile/${encodeURIComponent(username)}`),
  update: (username, patch) =>
    request(`/profile/${encodeURIComponent(username)}`, { method: 'PATCH', body: patch }),
  /** Reveal the 12-word mnemonic so the user can back it up. */
  seed:    (username) => request(`/profile/${encodeURIComponent(username)}/seed`),
  /** Restore an account on a new device using its 12-word mnemonic. */
  restore: (mnemonic) => request('/profile/restore', { method: 'POST', body: { mnemonic } }),
}

/* ---------- Progress ---------- */

export const progressApi = {
  upsert: (dto) => request('/progress', { method: 'PUT', body: dto }),
  get:    (username) => request(`/progress/${encodeURIComponent(username)}`),
}

/* ---------- Rewards (deferred Lightning payouts) ---------- */

export const rewardsApi = {
  pending:  (username) => request(`/rewards/${encodeURIComponent(username)}`),
  claim:    (username) =>
    request(`/rewards/${encodeURIComponent(username)}/claim`, { method: 'POST' }),
  addShare: (username) =>
    request(`/rewards/${encodeURIComponent(username)}/share`, { method: 'POST' }),
}

/* ---------- Lightning wallet (per player) ---------- */

export const lightningApi = {
  info: (username) => request(`/lightning/${encodeURIComponent(username)}/info`),
  invoice: (username, dto) =>
    request(`/lightning/${encodeURIComponent(username)}/invoice`, { method: 'POST', body: dto }),
  send: (username, dto) =>
    request(`/lightning/${encodeURIComponent(username)}/send`, { method: 'POST', body: dto }),
}

/* ---------- Leaderboard ---------- */

export const leaderboardApi = {
  top: (limit = 50) => request(`/leaderboard?limit=${limit}`),
}

/* ---------- Health ---------- */

export const healthApi = {
  ping: () => request('/health'),
}
