/*
  Levels sync — bridges the backend question database and the offline cache.

  The app ships with NO bundled questions; the level set lives in the backend
  database and is downloaded once, then replayed offline from IndexedDB.

  Boot flow (called once, before the game mounts):
   1. If IndexedDB already has a cached set → apply it instantly (fast, offline)
      and refresh the cache in the background for the *next* launch. We never
      hot-swap mid-session, so gameplay state stays stable.
   2. If there is no cache yet → fetch from the backend, apply + cache it. If the
      device is offline on this very first launch there is nothing to play yet,
      and the app shows a "connect once" prompt (see App.jsx).
*/

import { levelsApi } from './api'
import { getCachedLevels, cacheLevels } from './levelStore'
import { applyLevels, LEVELS } from '../data/levels'

let _ready = null

/** Idempotent — safe to call from multiple places; resolves once.
 *  Pass force=true to re-run after a failed first load (e.g. a retry button). */
export function ensureLevels(force = false) {
  if (force && !_hasLevels()) _ready = null
  if (!_ready) _ready = sync()
  return _ready
}

function _hasLevels() {
  return Array.isArray(LEVELS) && LEVELS.length > 0
}

async function sync() {
  const cached = await getCachedLevels().catch(() => null)

  if (cached?.levels?.length) {
    applyLevels(cached.levels)
    // Update the cache for next time without disturbing this session.
    refreshInBackground(cached.version)
    return { source: 'cache', version: cached.version }
  }

  // First launch (no cache yet): pull the question set from the DB.
  try {
    const payload = await fetchWithTimeout()
    if (payload?.levels?.length) {
      applyLevels(payload.levels)
      await cacheLevels(payload)
      return { source: 'network', version: payload.version }
    }
  } catch {
    /* offline on first launch — nothing cached yet; App.jsx shows a prompt */
  }
  return { source: 'empty' }
}

async function refreshInBackground(currentVersion) {
  try {
    const payload = await fetchWithTimeout()
    if (payload?.levels?.length && payload.version !== currentVersion) {
      await cacheLevels(payload)
    }
  } catch {
    /* offline / server down — keep the cache we have */
  }
}

function fetchWithTimeout(ms = 8000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return levelsApi.all(controller.signal).finally(() => clearTimeout(timer))
}
