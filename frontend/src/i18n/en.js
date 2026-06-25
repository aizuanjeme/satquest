/*
  English UI strings (default locale).

  SCOPE: this file holds the app *chrome* — buttons, status, and recap labels
  that are baked into the client. LEVEL CONTENT (titles, stories, questions,
  reveals, scam scenarios) is NOT here: it lives in the database and is authored
  in frontend/content/levels.source.mjs. To localise content, add a translated
  level set keyed by locale on the backend and serve it from GET /api/levels
  based on an Accept-Language / ?lang query (documented in i18n/index.js).

  Keys use dot.namespaces. Interpolate with {name} placeholders, e.g.
    t('done.title', { count: 37 })
*/
export default {
  // Boot / connectivity
  'boot.loading': 'Loading SatQuest…',
  'boot.offline': 'Connect to the internet once to download SatQuest, then play offline anytime.',
  'boot.retry': 'Try again',

  // Generic navigation
  'nav.map': '‹ Map',
  'nav.backToMap': 'Back to map',

  // Reveal recap
  'reveal.secretUnlocked': 'Secret Unlocked',
  'reveal.allSecrets': 'All Secrets Revealed',
  'reveal.continue': 'Continue →',
  'reveal.playAgain': 'Play Again',
  'reveal.review': '🔁 Worth a review',
  'reveal.learnMore': 'Learn more',
  'reveal.hideDetails': 'Hide details',

  // Done screen
  'done.title': 'You finished all {count} levels!',
}
