import { LEVELS, AVATARS, TOTAL_SATS, resolveAvatarId, STAGE1_COUNT } from '../data/levels'

/*
  LevelManager — read-only helpers over the canonical LEVELS data (copied
  verbatim from the original frontend). Pure derivations only; all mutable
  game state lives in the useGame state machine.
*/
export const LevelManager = {
  all: LEVELS,
  total: LEVELS.length,
  totalSats: TOTAL_SATS,
  stage1Count: STAGE1_COUNT,

  get: (idx) => LEVELS[idx],

  isUnlocked: (idx, unlockedUpTo) => idx <= unlockedUpTo,

  isComplete: (idx, progress) => Boolean(progress?.levels?.[idx]?.completedAt),

  /** A human chapter/stage marker for the HUD. */
  stageLabel: (idx) => {
    const lv = LEVELS[idx]
    if (!lv) return ''
    if (lv.type === 'crossover') return 'FINAL TRIAL'
    if (lv.type === 'wordhunt') return 'WORD HUNT'
    return lv.chapter || `STEP ${idx + 1}`
  },

  /** Overall completion ratio for progress rings. */
  completionRatio: (unlockedUpTo) =>
    Math.max(0, Math.min(1, unlockedUpTo / LEVELS.length)),
}

export { AVATARS, resolveAvatarId, TOTAL_SATS }
