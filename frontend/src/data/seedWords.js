/*
  A small pool of real BIP39 recovery words used by the Seed-phrase Order
  level. We pick a handful at random each play so the exercise stays fresh and
  teaches the idea — "a seed phrase is a list of ordinary words in a fixed
  order" — without ever showing a real wallet's phrase.

  These are all genuine words from the BIP39 English wordlist, but the random
  selection is NOT a valid/secure wallet seed (and is never meant to be one).
*/
export const SEED_WORD_POOL = [
  'ribbon', 'silver', 'jungle', 'rocket', 'mango', 'velvet',
  'copper', 'planet', 'tiger', 'ocean', 'pencil', 'kingdom',
  'orange', 'guitar', 'shadow', 'forest', 'pepper', 'marble',
  'desert', 'dragon', 'candle', 'meadow', 'canyon', 'pigeon',
  'lemon', 'bridge', 'thunder', 'garden', 'window', 'island',
  'castle', 'wisdom', 'sunset', 'mirror', 'pocket', 'harvest',
  'engine', 'lantern', 'pumpkin', 'cherry', 'walnut', 'turtle',
  'jacket', 'puzzle', 'salmon', 'feather', 'cabbage', 'monkey',
]

/** Pick `count` distinct random words from the pool. */
export function pickSeedWords(count = 12) {
  const pool = [...SEED_WORD_POOL]
  // Fisher–Yates partial shuffle, then take the first `count`.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, Math.min(count, pool.length))
}
