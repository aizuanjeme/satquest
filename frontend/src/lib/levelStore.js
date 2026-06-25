/*
  SatQuest offline level cache (IndexedDB).

  Questions/levels live in the backend database. On first launch the app fetches
  them once and stores the whole payload here in IndexedDB — NOT localStorage —
  so the game replays fully offline and survives reloads. A `version` field on
  the payload lets us refresh the cache only when the server content changes.

  IndexedDB is used (rather than localStorage) because the level set is large,
  structured JSON and may grow well past localStorage's ~5 MB string limit.
*/

const DB_NAME = 'satquest'
const DB_VERSION = 1
const STORE = 'levels'
const PAYLOAD_KEY = 'payload'

function openDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE)
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error || new Error('IndexedDB open failed'))
  })
}

function tx(db, mode, fn) {
  return new Promise((resolve, reject) => {
    const store = db.transaction(STORE, mode).objectStore(STORE)
    const req = fn(store)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

/** Read the cached levels payload, or null if nothing is stored yet. */
export async function getCachedLevels() {
  try {
    const db = await openDb()
    const payload = await tx(db, 'readonly', (s) => s.get(PAYLOAD_KEY))
    db.close()
    return payload ?? null
  } catch {
    return null
  }
}

/** Persist the levels payload for offline play. Returns true on success. */
export async function cacheLevels(payload) {
  try {
    const db = await openDb()
    await tx(db, 'readwrite', (s) => s.put(payload, PAYLOAD_KEY))
    db.close()
    return true
  } catch {
    return false
  }
}

/** Wipe the cached levels (used when resetting the app). */
export async function clearCachedLevels() {
  try {
    const db = await openDb()
    await tx(db, 'readwrite', (s) => s.delete(PAYLOAD_KEY))
    db.close()
  } catch {
    /* ignore */
  }
}
