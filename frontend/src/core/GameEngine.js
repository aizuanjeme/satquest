/*
  GameEngine — pure, render-agnostic helpers shared by the 3D boards.

  The authoritative game state machine is useGame() (copied from the original
  frontend, unchanged). These engines only compute layout + derived display
  values from that state, keeping logic cleanly separated from rendering.
*/

/* ---------- MatchEngine ---------- */
export const MatchEngine = {
  /** Fraction of pairs matched (0..1) for the progress ring. */
  progress: (matchedCount, totalPairs) =>
    totalPairs ? matchedCount / totalPairs : 0,

  /** Should this pair attempt resolve as a match? */
  isMatch: (imgId, wordId) => imgId === wordId,

  /** Grid columns that keep the board balanced for N cards. */
  columns: (n) => (n <= 4 ? 2 : 3),
}

/* ---------- WordEngine ---------- */
export const WordEngine = {
  progress: (found, total) => (total ? found / total : 0),

  isReal: (word, realSet) => realSet.has(word),

  /** Timer urgency for colour/pulse decisions. */
  urgency: (timeLeft, limit) => {
    if (!limit) return 0
    const r = timeLeft / limit
    if (r <= 0.15) return 2 // critical
    if (r <= 0.35) return 1 // warning
    return 0
  },
}

/* ---------- QuizEngine ---------- */
export const QuizEngine = {
  progress: (current, total) => (total ? current / total : 0),

  passing: (total, passMark) => Math.ceil(total * passMark),

  didPass: (correct, total, passMark) => correct >= Math.ceil(total * passMark),
}
