/*
  SatQuest local storage layer.

  Two top-level keys:
   - satquest.profile  : { username, avatarId, createdAt }
   - satquest.progress : {
       sats, unlockedUpTo,
       levels: { [levelIdx]: { sats, bestTimeMs, attempts, completedAt } },
       updatedAt,
       deviceId,
     }

  Designed so a future backend can:
   - POST profile on signup
   - PATCH progress on every level completion
   - Pull latest progress on login from another device
   - Merge by `updatedAt` per-level (last write wins)
*/

const PROFILE_KEY  = 'satquest.profile'
const PROGRESS_KEY = 'satquest.progress'
const DEVICE_KEY   = 'satquest.deviceId'

// Legacy keys (read for one-time migration so existing players keep their data)
const LEGACY_PROFILE_KEY  = 'omosats.profile'
const LEGACY_PROGRESS_KEY = 'omosats.progress'
const LEGACY_DEVICE_KEY   = 'omosats.deviceId'

function readWithLegacy(key, legacyKey) {
  try {
    let raw = localStorage.getItem(key)
    if (raw) return raw
    // Migrate from old OmoSats key if present
    raw = localStorage.getItem(legacyKey)
    if (raw) {
      localStorage.setItem(key, raw)
      localStorage.removeItem(legacyKey)
    }
    return raw
  } catch {
    return null
  }
}

/* ---------- Profile ---------- */

export function loadProfile() {
  try {
    const raw = readWithLegacy(PROFILE_KEY, LEGACY_PROFILE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveProfile(profile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify({
      ...profile,
      updatedAt: Date.now(),
    }))
  } catch (e) {
    console.warn('saveProfile failed', e)
  }
}

export function clearProfile() {
  localStorage.removeItem(PROFILE_KEY)
  localStorage.removeItem(PROGRESS_KEY)
  localStorage.removeItem(LARP_KEY)
  localStorage.removeItem('satquest.larp.mission')
}

/* ---------- First-run walkthrough flag ---------- */

const TOUR_KEY = 'satquest.tourDone'

export function isTourDone() {
  try { return localStorage.getItem(TOUR_KEY) === '1' } catch { return false }
}

export function markTourDone() {
  try { localStorage.setItem(TOUR_KEY, '1') } catch { /* ignore */ }
}

/* ---------- Bitcoin LARP progress ----------
   Kept apart from quest progress on purpose: LARP XP never converts to sats.
   satquest.larp : { xp, chapters: { [id]: { doneAt, plays } }, freeBest, freeWins, badges }
   ------------------------------------------- */

const LARP_KEY = 'satquest.larp'

const emptyLarp = () => ({ xp: 0, chapters: {}, freeBest: 0, freeWins: 0, badges: [] })

export function loadLarp() {
  try {
    const raw = localStorage.getItem(LARP_KEY)
    return raw ? { ...emptyLarp(), ...JSON.parse(raw) } : emptyLarp()
  } catch {
    return emptyLarp()
  }
}

/**
 * Record a finished LARP round. Story chapters award XP on first clear only;
 * free play awards XP every round. Returns { progress, xpGained }.
 */
export function recordLarpResult({ id, won, xp }) {
  const prev = loadLarp()
  const next = { ...prev, chapters: { ...prev.chapters } }
  let xpGained = 0
  if (id === 'free') {
    xpGained = xp
    next.freeBest = Math.max(prev.freeBest, xp)
    if (won) next.freeWins = prev.freeWins + 1
  } else {
    const ch = prev.chapters[id] || { doneAt: null, plays: 0 }
    if (won && !ch.doneAt) xpGained = xp
    next.chapters[id] = { doneAt: ch.doneAt || (won ? Date.now() : null), plays: ch.plays + 1 }
  }
  next.xp = prev.xp + xpGained
  try { localStorage.setItem(LARP_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  return { progress: next, xpGained }
}

/* Kit mission in progress — saved after every action so the player can resume. */
const MISSION_KEY = 'satquest.larp.mission'

export function loadMission(version) {
  try {
    const m = JSON.parse(localStorage.getItem(MISSION_KEY) || 'null')
    return m && m.version === version ? m : null
  } catch {
    return null
  }
}

export function saveMission(m) {
  try { localStorage.setItem(MISSION_KEY, JSON.stringify(m)) } catch { /* ignore */ }
}

export function clearMission() {
  try { localStorage.removeItem(MISSION_KEY) } catch { /* ignore */ }
}

/** Wipe LARP XP, chapters, badges and any saved mission. Quest progress and sats are untouched. */
export function resetLarp() {
  try {
    localStorage.removeItem(LARP_KEY)
    localStorage.removeItem(MISSION_KEY)
  } catch { /* ignore */ }
  return loadLarp()
}

/** Record the mission badge (kept with LARP progress). */
export function awardBadge(id) {
  const prev = loadLarp()
  if (prev.badges?.includes(id)) return prev
  const next = { ...prev, badges: [...(prev.badges || []), id] }
  try { localStorage.setItem(LARP_KEY, JSON.stringify(next)) } catch { /* ignore */ }
  return next
}

/* ---------- Device id (stable per-browser identifier) ---------- */

export function getDeviceId() {
  let id = readWithLegacy(DEVICE_KEY, LEGACY_DEVICE_KEY)
  if (!id) {
    id = 'dev_' + Math.random().toString(36).slice(2) + Date.now().toString(36)
    localStorage.setItem(DEVICE_KEY, id)
  }
  return id
}

/* ---------- Progress ---------- */

const emptyProgress = () => ({
  sats: 0,
  unlockedUpTo: 0,
  levels: {},
  missedConcepts: {},
  deviceId: getDeviceId(),
  updatedAt: Date.now(),
})

export function loadProgress() {
  try {
    const raw = readWithLegacy(PROGRESS_KEY, LEGACY_PROGRESS_KEY)
    if (!raw) return emptyProgress()
    const parsed = JSON.parse(raw)
    return { ...emptyProgress(), ...parsed }
  } catch {
    return emptyProgress()
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({
      ...progress,
      updatedAt: Date.now(),
    }))
  } catch (e) {
    console.warn('saveProgress failed', e)
  }
}

/*
  Record a finished level — merges into existing levels record.
  performance: { sats, timeMs, attempts }
*/
export function recordLevelResult(progress, levelIdx, performance) {
  const prev = progress.levels[levelIdx] || { sats: 0, bestTimeMs: null, attempts: 0 }

  const merged = {
    sats:        Math.max(prev.sats, performance.sats || 0), // keep best
    bestTimeMs:  prev.bestTimeMs == null
                   ? (performance.timeMs ?? null)
                   : performance.timeMs != null
                     ? Math.min(prev.bestTimeMs, performance.timeMs)
                     : prev.bestTimeMs,
    attempts:    prev.attempts + 1,
    completedAt: Date.now(),
    lastSats:    performance.sats || 0,
    lastTimeMs:  performance.timeMs ?? null,
  }

  return {
    ...progress,
    levels: { ...progress.levels, [levelIdx]: merged },
    updatedAt: Date.now(),
  }
}

/*
  Spaced repetition: fold a level's session misses into the player's running
  review map. Concepts answered wrong gain weight; concepts the player just
  practiced cleanly (and didn't miss) decay by one toward mastery.
*/
export function mergeMissedConcepts(prev = {}, sessionMisses = {}, practicedConcepts = []) {
  const out = { ...(prev || {}) }
  for (const [concept, n] of Object.entries(sessionMisses || {})) {
    if (!concept) continue
    out[concept] = (out[concept] || 0) + n
  }
  for (const concept of practicedConcepts || []) {
    if (!sessionMisses?.[concept] && out[concept]) {
      out[concept] = Math.max(0, out[concept] - 1)
      if (out[concept] === 0) delete out[concept]
    }
  }
  return out
}

/* ---------- Cloud sync (NestJS backend) ----------
   - syncProgress: PUT the local progress; backend merges and queues rewards
                   for any newly-completed level.
   - pullProgress: GET the latest server-side progress (for cross-device login).
   ------------------------------------------------- */

import { progressApi } from './api'

/**
 * Convert local progress (with levels keyed by string idx) into the shape
 * the backend's UpsertProgressDto expects, then PUT it.
 * Always resolves \u2014 network errors are swallowed so the game keeps working
 * offline; the local copy is the source of truth until next sync.
 */
export async function syncProgress(progress, profile) {
  if (!profile?.username) return progress
  window.dispatchEvent(new CustomEvent('satquest:sync', { detail: 'start' }))
  try {
    const dto = {
      username: profile.username,
      sats: progress.sats || 0,
      unlockedUpTo: progress.unlockedUpTo || 0,
      deviceId: progress.deviceId || getDeviceId(),
      levels: Object.fromEntries(
        Object.entries(progress.levels || {}).map(([idx, l]) => [
          String(idx),
          {
            sats: l.sats || 0,
            bestTimeMs: l.bestTimeMs ?? 0,
            attempts: l.attempts || 1,
            completedAt: l.completedAt || Date.now(),
          },
        ]),
      ),
      missedConcepts: progress.missedConcepts || {},
    }
    await progressApi.upsert(dto)
    window.dispatchEvent(new CustomEvent('satquest:sync', { detail: 'done' }))
    return progress
  } catch (e) {
    if (import.meta.env.DEV) console.warn('syncProgress failed', e)
    window.dispatchEvent(new CustomEvent('satquest:sync', { detail: 'fail' }))
    return progress
  }
}

/** Pull the latest server-side progress (for fresh logins). */
export async function pullProgress(profile) {
  if (!profile?.username) return null
  try {
    return await progressApi.get(profile.username)
  } catch {
    return null
  }
}

/* ---------- Online/offline helper ---------- */

export function onOnline(handler) {
  window.addEventListener('online', handler)
  return () => window.removeEventListener('online', handler)
}
