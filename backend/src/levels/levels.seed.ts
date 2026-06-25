/* eslint-disable */
/**
 * SatQuest DEMO level data.
 *
 * This open-source repository ships a tiny set of placeholder levels so the
 * project is runnable out of the box and contributors can see the expected
 * shape of each game type. It is NOT the production curriculum — replace it
 * with your own content for a real deployment.
 *
 * Seeding is a manual ACTION (the server never seeds on boot):
 *   npm run seed:levels            # from backend/ — load these demo levels
 *
 * To author your own content, edit this array (or generate it) and re-run the
 * seed action. `seed:levels` replaces the whole `levels` table.
 */
export interface RawLevel {
  id: number;
  type: 'match' | 'wordhunt' | 'crossover' | 'scamspot' | 'seedorder';
  stage?: number;
  [key: string]: unknown;
}

export const LEVELS_SEED: RawLevel[] = [
  {
    id: 1,
    type: 'match',
    stage: 1,
    badge: '1',
    chapter: 'Demo',
    title: 'Demo — Match the pairs',
    story: 'A simple matching level. Tap a picture, then its meaning.',
    hint: 'Match the picture to the meaning',
    hintColor: '#F7931A',
    points: 1,
    pairs: [
      {
        id: 'a',
        imgEmoji: '🪙',
        imgLabel: 'Coin',
        wordEmoji: '💰',
        wordLabel: 'Money you can hold',
      },
      {
        id: 'b',
        imgEmoji: '📱',
        imgLabel: 'Phone',
        wordEmoji: '💸',
        wordLabel: 'Send value anywhere',
      },
      {
        id: 'c',
        imgEmoji: '🔒',
        imgLabel: 'Lock',
        wordEmoji: '🛡️',
        wordLabel: 'Keep your funds safe',
      },
    ],
    reveals: [
      {
        match: 'Coin = money',
        def: 'Placeholder explanation for the first pair.',
        funny: '😄 Demo content!',
      },
      {
        match: 'Phone = send',
        def: 'Placeholder explanation for the second pair.',
        funny: '😄 Demo content!',
      },
      {
        match: 'Lock = safety',
        def: 'Placeholder explanation for the third pair.',
        funny: '😄 Demo content!',
      },
    ],
    concepts: ['demo'],
  },
  {
    id: 2,
    type: 'wordhunt',
    stage: 1,
    badge: '2',
    chapter: 'Demo',
    title: 'Demo — Word hunt',
    story: 'Tap only the real words before the timer runs out.',
    hint: 'Pick the real words, skip the fakes',
    hintColor: '#3FB950',
    points: 2,
    timeLimit: 30,
    real: ['bitcoin', 'wallet', 'satoshi'],
    decoy: ['blorptcoin', 'walleto', 'satoasi'],
    concepts: ['demo'],
  },
  {
    id: 3,
    type: 'crossover',
    stage: 1,
    badge: '3',
    chapter: 'Demo',
    title: 'Demo — Quiz gate',
    story: 'Answer the quiz to finish the demo.',
    hint: 'Choose the correct option',
    hintColor: '#A371F7',
    points: 3,
    timeLimit: 90,
    passMark: 0.7,
    questions: [
      {
        q: 'This is a demo question. Pick option A.',
        options: ['Option A', 'Option B', 'Option C'],
        answer: 0,
      },
      {
        q: 'Another demo question. Pick option B.',
        options: ['Option A', 'Option B', 'Option C'],
        answer: 1,
      },
    ],
    concepts: ['demo'],
  },
];
