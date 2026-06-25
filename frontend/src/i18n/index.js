/*
  Minimal i18n runtime for SatQuest UI chrome.

  Usage:
    import { t } from '../i18n'
    t('reveal.continue')                  // -> "Continue →"
    t('done.title', { count: 37 })        // -> "You finished all 37 levels!"

  Adding a language:
    1. Create i18n/<code>.js exporting the same keys as en.js.
    2. Register it in LOCALES below.
    3. Call setLocale('<code>') (persists to localStorage).

  LEVEL CONTENT localisation (titles/questions/reveals) is a separate concern:
  content is served from the backend (GET /api/levels). To localise it, have the
  backend key its seed by locale and pick the set from an Accept-Language header
  or a ?lang= query, then pass the chosen locale through levelsSync.ensureLevels.
  The client cache (IndexedDB) should be keyed per locale so switching languages
  re-syncs the right set.
*/
import en from './en'

const LOCALES = { en }
const STORAGE_KEY = 'satquest.lang'

function detectLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && LOCALES[saved]) return saved
    const nav = (navigator.language || 'en').slice(0, 2).toLowerCase()
    return LOCALES[nav] ? nav : 'en'
  } catch {
    return 'en'
  }
}

let current = detectLocale()

export function getLocale() {
  return current
}

export function setLocale(code) {
  if (!LOCALES[code]) return
  current = code
  try { localStorage.setItem(STORAGE_KEY, code) } catch { /* ignore */ }
}

export function t(key, vars) {
  const dict = LOCALES[current] || en
  let str = dict[key] ?? en[key] ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
    }
  }
  return str
}
