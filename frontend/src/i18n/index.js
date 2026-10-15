/*
  Minimal i18n runtime for SatQuest.

  Usage:
    import { t, tn } from '../i18n'
    t('reveal.continue')                  // -> "Continue →"
    t('done.title', { count: 37 })        // -> "You finished all 37 levels!"
    tn('lb.total', 3)                     // -> picks 'lb.total.one' / 'lb.total.other'

  Components re-render on a language switch because <Game> calls useLocale()
  (see App.jsx) — any component rendered under it picks up the new strings.

  Adding a language:
    1. Create i18n/<code>.js exporting the same keys as en.js. Missing keys
       fall back to English, so a partial translation is safe.
    2. Register it in LOCALES. Leave `available: false` in LANGUAGES below
       until the level content (served by the backend) is translated too —
       until then it shows as "coming soon" and can't be selected. Flip it
       locally to test, but don't commit that.

  LEVEL CONTENT (titles/questions/reveals) is localised per level: a level may
  carry an `i18n: { yo: { …partial level… } }` overlay that is merged over the
  English fields for the active locale (see data/levels.js). Anything the
  overlay omits stays in English.
*/
import { useSyncExternalStore } from 'react'
import en from './en'
import yo from './yo'

const LOCALES = { en, yo }
const STORAGE_KEY = 'satquest.lang'

/** Languages offered in the Profile picker. Unavailable ones show "coming soon". */
export const LANGUAGES = [
  { id: 'en', label: 'English', available: true },
  { id: 'yo', label: 'Yorùbá', available: false },
  { id: 'ha', label: 'Hausa', available: false },
  { id: 'ig', label: 'Igbo', available: false },
  { id: 'pcm', label: 'Naijá (Pidgin)', available: false },
  { id: 'fr', label: 'Français', available: false },
]

/** A locale is usable only when its strings exist AND it's switched on above. */
const isEnabled = (code) => Boolean(LOCALES[code]) && LANGUAGES.some((l) => l.id === code && l.available)

function detectLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && isEnabled(saved)) return saved
    const nav = (navigator.language || 'en').slice(0, 2).toLowerCase()
    return isEnabled(nav) ? nav : 'en'
  } catch {
    return 'en'
  }
}

let current = detectLocale()
const listeners = new Set()

function syncHtmlLang() {
  try { document.documentElement.lang = current } catch { /* ignore */ }
}
syncHtmlLang()

export function getLocale() {
  return current
}

export function setLocale(code) {
  if (!isEnabled(code) || code === current) return
  current = code
  try { localStorage.setItem(STORAGE_KEY, code) } catch { /* ignore */ }
  syncHtmlLang()
  listeners.forEach((fn) => fn(code))
}

/** Subscribe to locale changes. Returns an unsubscribe function. */
export function onLocaleChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

/** React hook — re-renders the caller (and its subtree) on a language switch. */
export function useLocale() {
  return useSyncExternalStore(onLocaleChange, getLocale, getLocale)
}

function interpolate(str, vars) {
  if (!vars || typeof str !== 'string') return str
  for (const [k, v] of Object.entries(vars)) {
    str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v))
  }
  return str
}

/** Translate a key. Values may be strings or arrays (e.g. a list of praise lines). */
export function t(key, vars) {
  const dict = LOCALES[current] || en
  return interpolate(dict[key] ?? en[key] ?? key, vars)
}

/**
 * Plural-aware translate: uses `<key>.one` when n === 1, else `<key>.other`.
 * Languages without plural forms (e.g. Yorùbá) only need `<key>.other`.
 * `{n}` is always available as a placeholder.
 */
export function tn(key, n, vars) {
  const dict = LOCALES[current] || en
  const form = n === 1 ? 'one' : 'other'
  const str = dict[`${key}.${form}`] ?? dict[`${key}.other`] ?? en[`${key}.${form}`] ?? en[`${key}.other`] ?? key
  return interpolate(str, { n, ...vars })
}
