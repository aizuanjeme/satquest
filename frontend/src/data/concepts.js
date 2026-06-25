/*
  Spaced-repetition "review" helpers.

  Levels tag themselves with `concepts: ['self-custody', ...]` in the content
  (served from the DB). When a player gets a match / question / scam-spot wrong,
  those concept ids gain review weight (stored in progress.missedConcepts and
  synced to the backend). The Reveal screen shows the player which to brush up
  on. Labels are derived from the id itself — no hardcoded content here.
*/

/** Human label for a concept id, e.g. 'self-custody' -> 'Self Custody'. */
export function conceptLabel(id) {
  return String(id).replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * Top concepts a player should review, highest weight first.
 * @param {Record<string, number>} missedConcepts
 * @param {number} limit
 */
export function topReviewConcepts(missedConcepts = {}, limit = 3) {
  return Object.entries(missedConcepts || {})
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id]) => id)
}
