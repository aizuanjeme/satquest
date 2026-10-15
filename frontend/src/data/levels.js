import { getLocale, onLocaleChange } from '../i18n'

export function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/*
  AVATARS — image-based.
  Image files live in /src/avatars/ and are imported via Vite using new URL()
  so they are bundled and hashed correctly in production.

  We have 19 female + 19 male round avatars (38 total). They are interleaved
  female/male so the picker grid feels balanced. The id scheme is stable
  (`avF1`, `avM1`, `avF2`, …) so existing saved profiles keep their avatar
  even when the order changes.
*/
const avatarUrl = (gender, n) =>
  new URL(
    `../avatars/Size_XXL__2048px______Avatar_${gender}_${n}_____Round_no.webp`,
    import.meta.url,
  ).href

const AVATAR_COUNT = 19 // per gender

const buildAvatars = () => {
  const list = []
  for (let n = 1; n <= AVATAR_COUNT; n++) {
    list.push({
      id: `avF${n}`,
      img: avatarUrl('female', n),
      emoji: '👩🏾',
      name: 'Character',
    })
    list.push({
      id: `avM${n}`,
      img: avatarUrl('male', n),
      emoji: '🧑🏿',
      name: 'Character',
    })
  }
  return list
}

export const AVATARS = buildAvatars()

/*
  Back-compat: the old build shipped 7 avatars with ids `av1`..`av7`.
  Map those legacy ids onto the first 7 new avatars so anyone with a saved
  profile still resolves to a real character on next launch.
*/
const LEGACY_AVATAR_MAP = {
  av1: 'avF1',
  av2: 'avM1',
  av3: 'avF2',
  av4: 'avM2',
  av5: 'avF3',
  av6: 'avM3',
  av7: 'avF4',
}

export const resolveAvatarId = (id) => LEGACY_AVATAR_MAP[id] || id

/* ============================================================================
   LEVELS — the question set.
   ----------------------------------------------------------------------------
   The level content now lives in the backend database (table `levels`). At
   runtime it is fetched once from `GET /api/levels`, cached in IndexedDB, and
   applied here for fully-offline replay (see lib/levelStore.js +
   lib/levelsSync.js). `ensureLevels()` runs before the game mounts.

   LEVELS starts empty and is filled in place by applyLevels() so that every
   existing `import { LEVELS }` keeps a stable array reference.

   Each level object has a `type`:
    - 'match'     : tap a picture, tap its meaning
    - 'wordhunt'  : timed puzzle — tap the real Bitcoin words among decoys
    - 'crossover' : the Stage 1 quiz gate
   Stage 2 levels carry `stage: 2`.
   ============================================================================ */

export const LEVELS = []

/* ----------------------------------------------------------------------------
   Content localisation. A level may carry translations as a partial overlay:
     { title: 'Coin', …, i18n: { yo: { title: 'Owó', pairs: [{ imgLabel: '…' }] } } }
   Objects merge key by key and arrays of objects merge index by index, so a
   translator only supplies the text fields — ids, answers, emojis and points
   stay put. Arrays of plain strings (word-hunt words, quiz options) are
   replaced whole. Anything missing stays in English.
   ---------------------------------------------------------------------------- */
let _raw = []

function mergeOverlay(base, over) {
  if (Array.isArray(base) && Array.isArray(over) && base.some((v) => v && typeof v === 'object')) {
    return base.map((v, i) => (i < over.length && over[i] != null ? mergeOverlay(v, over[i]) : v))
  }
  if (base && over && typeof base === 'object' && typeof over === 'object' && !Array.isArray(over)) {
    const out = { ...base }
    for (const k of Object.keys(over)) out[k] = mergeOverlay(base[k], over[k])
    return out
  }
  return over === undefined ? base : over
}

function localizeLevel(level, locale) {
  const over = level?.i18n?.[locale]
  return over ? mergeOverlay(level, over) : level
}

// Re-localise the live set in place when the player switches language.
onLocaleChange((locale) => {
  if (!_raw.length) return
  _raw.forEach((l, i) => { LEVELS[i] = localizeLevel(l, locale) })
})

export let TOTAL_SATS = 0

function _computeStage1Count(list) {
  const i = list.findIndex(l => l.stage === 2)
  return i === -1 ? list.length : i
}

/** Live, mutable derived counts. LevelManager reads these so they stay correct
    after the remote/cached set is applied. */
export const levelsMeta = {
  stage1Count: 0,
  totalSats: 0,
}

/**
 * Replace the live LEVELS array in place with the remote/cached set.
 * Returns true if applied, false if the input was empty/invalid.
 */
export function applyLevels(rawLevels) {
  if (!Array.isArray(rawLevels) || rawLevels.length === 0) return false
  _raw = rawLevels
  LEVELS.length = 0
  rawLevels.forEach(l => LEVELS.push(localizeLevel(l, getLocale())))
  TOTAL_SATS = LEVELS.reduce((sum, l) => sum + (l.points ?? l.sats ?? 0), 0)
  levelsMeta.stage1Count = _computeStage1Count(LEVELS)
  levelsMeta.totalSats = TOTAL_SATS
  return true
}
