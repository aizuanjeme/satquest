import { t } from '../i18n'
import { LEVELS, AVATARS, TOTAL_SATS, resolveAvatarId, levelsMeta } from '../data/levels'

/*
  LevelManager — read-only helpers over the canonical LEVELS data.

  LEVELS is a single mutable array reference that is swapped in place when the
  remote/cached question set loads (see data/levels.js applyLevels). The derived
  values below are getters so they always reflect the currently-loaded set.
*/
export const LevelManager = {
  all: LEVELS,
  get total() { return LEVELS.length },
  get totalSats() { return levelsMeta.totalSats },
  get stage1Count() { return levelsMeta.stage1Count },

  get: (idx) => LEVELS[idx],

  isUnlocked: (idx, unlockedUpTo) => idx <= unlockedUpTo,

  isComplete: (idx, progress) => Boolean(progress?.levels?.[idx]?.completedAt),

  /** A human chapter/stage marker for the HUD. */
  stageLabel: (idx) => {
    const lv = LEVELS[idx]
    if (!lv) return ''
    if (['crossover', 'wordhunt', 'scamspot', 'seedorder'].includes(lv.type)) return t(`type.${lv.type}`)
    return lv.chapter || t('type.step', { n: idx + 1 })
  },

  /** Overall completion ratio for progress rings. */
  completionRatio: (unlockedUpTo) =>
    Math.max(0, Math.min(1, unlockedUpTo / LEVELS.length)),
}

export { AVATARS, resolveAvatarId, TOTAL_SATS }
