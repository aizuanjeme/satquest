/*
  Solo LARP campaign + Free Play.

  A chapter is data plus three small functions:
   - init(name)            -> a fresh engine state (players, coins, chain history)
   - script(state, tick)   -> extra actions this tick (story beats, node inbox…)
   - evaluate(state)       -> { status: 'playing'|'won'|'lost', objectives, reason? }

  `coach` is Bitty the owl's step-by-step guide: the first step whose
  done(state, ui) is false is shown (and read aloud), with a pointer at the
  element tagged data-coach='<point>'. `ui` holds what the panels report
  (coins in the card, signed, tip picked, block template size).

  `panels` tells the table which tools the player gets: wallet (UTXO basket +
  tx builder), mempool, miner (block template + hashing), node (tx inspector),
  merchant (incoming payment + hand-over button).

  `paper` links to a whitepaper section in larp/whitepaper.js so the debrief
  can say 'this is what Satoshi meant'.
*/
import {
  createState, reduceAll, mineNow, buildPayment, spendableCoins, sign, txBody, confirmations,
  teamBalance,
} from './engine'
import { botPayment } from './bots'

export const YOU = 'you'

const secret = () => Math.random().toString(36).slice(2)

function you(name, extra) {
  return { id: YOU, name: name || 'You', emoji: '🧑🏾', secret: secret(), ...extra }
}
function bot(id, name, emoji, extra) {
  return { id, name, emoji, isBot: true, secret: secret(), ...extra }
}
const minerBot = (id, name, extra) => bot(id, name, '⛏️', { role: 'miner', ...extra })

/** Txs sent by the player. */
const myTxs = (state) => Object.values(state.txs).filter((t) => t.from === YOU)
const sent = (state) => myTxs(state).some((t) => t.status !== 'rejected')
const mined = (state) => state.players[YOU].blocksMined
const paidTo = (state, to, min) =>
  myTxs(state).filter((t) => t.outputs.some((o) => o.to === to && o.value >= min))

export const CHAPTERS = [
  /* ------------------------------------------------------------------ 1 */
  {
    id: 'coins',
    emoji: '🪙',
    title: 'Ada’s First Coins',
    tagline: 'Pay Mama Titi with your coins and get change back.',
    role: 'holder',
    panels: ['wallet', 'mempool'],
    paper: 'transactions',
    xp: 50,
    traffic: 'calm',
    task: { to: 'titi', amount: 3000 },
    story: [
      '🧵 Mama Titi sells pretty fabric at the market. It costs 3,000 sats.',
      '🪙 Your money is a bag of coins. You can’t cut a coin in half! So you give a BIG coin, and Mama Titi’s change comes back to you as a new coin.',
      '🔒 Every coin has a padlock with its owner’s colour. Your locks are BLUE. Only your blue key 🔑 can open them.',
    ],
    lesson: [
      'Your money is a bag of coins. (Grown-ups call them UTXOs.)',
      'You pay with whole coins, and the extra comes back to you as change.',
      'A little bit is left as a tip for the miner. (Grown-ups say: fee.)',
      'Only YOUR key opens YOUR lock. That’s how everyone knows you said yes. (Grown-ups say: signature.)',
    ],
    coach: [
      { say: 'Hi, I’m Bitty the owl! 🦉 Let’s buy fabric from Mama Titi. Drag a BIG coin into the card. Or just tap it!', point: 'coins', done: (state, ui) => ui.ready },
      { say: 'Well done! See? 3,000 goes into Mama Titi’s pink lock, and your change goes back into YOUR blue lock. Now drag your blue key onto the card.', point: 'key', done: (state, ui) => ui.signed || sent(state) },
      { say: 'Click! Your key opened your locks. Now tap the big button to shout it out to everyone!', point: 'shout', done: (state, ui) => sent(state) },
      { say: 'Your payment is in the waiting room. A miner will put it in a block. Watch the chain of blocks at the top!', point: 'chain', done: (state, ui) => false },
    ],
    init: (name) => createState({
      difficulty: 2,
      players: [
        you(name, { coins: [6000, 2500, 1500] }),
        bot('titi', 'Mama Titi', '👩🏾‍🦱', { quiet: true, coins: [8000] }),
        bot('bisi', 'Bisi', '👩🏾', { coins: [20000, 15000] }),
        minerBot('m1', 'Lagos Pool'),
        minerBot('m2', 'Kano Pool'),
      ],
    }),
    evaluate: (state) => {
      const sent = paidTo(state, 'titi', 3000)
      const confirmed = sent.some((t) => t.status === 'confirmed')
      return {
        status: confirmed ? 'won' : 'playing',
        objectives: [
          { key: 'larp.obj.sign', done: sent.some((t) => t.status !== 'rejected') },
          { key: 'larp.obj.confirm', done: confirmed },
        ],
      }
    },
  },

  /* ------------------------------------------------------------------ 2 */
  {
    id: 'mempool',
    emoji: '🚦',
    title: 'The Busy Waiting Room',
    tagline: 'Lots of people are waiting. Bigger tips go first!',
    role: 'holder',
    panels: ['wallet', 'mempool'],
    paper: 'incentive',
    xp: 75,
    traffic: 'busy',
    task: { to: 'emeka', amount: 5000 },
    story: [
      '🛒 Emeka needs 5,000 sats from you, fast — before 3 blocks go by!',
      '🚦 But the waiting room is FULL. Each block only has space for a few cards.',
      '⛏️ Miners pick the cards with the biggest tips first. A tiny tip 🐢 might wait for a long time. If you get stuck, you can give a bigger tip!',
    ],
    lesson: [
      'The waiting room holds payments that aren’t in a block yet. (Grown-ups say: mempool.)',
      'Blocks are small, so miners pick the biggest tips first.',
      'Stuck? Send the same coins again with a bigger tip. (Grown-ups say: replace-by-fee.)',
    ],
    coach: [
      { say: 'Emeka needs 5,000 sats! Drag a coin into the card.', point: 'coins', done: (state, ui) => ui.ready },
      { say: 'Look how busy the waiting room is! Pick a tip. The rocket 🚀 is fast, the turtle 🐢 is slow.', point: 'tip', done: (state, ui) => ui.tipPicked || sent(state) },
      { say: 'Now drag your blue key onto the card to sign it.', point: 'key', done: (state, ui) => ui.signed || sent(state) },
      { say: 'Tap the big button to shout it out!', point: 'shout', done: (state, ui) => sent(state) },
      { say: 'Are you stuck in the waiting room? Tap Bigger tip to jump the line!', point: 'mytx', done: (state, ui) => false },
    ],
    init: (name) => rushHour(createState({
      difficulty: 2,
      blockVb: 600,
      players: [
        you(name, { coins: [12000, 4000] }),
        bot('emeka', 'Emeka', '👨🏾‍🔧', { quiet: true, coins: [3000] }),
        ...['Bisi', 'Tunde', 'Ngozi', 'Femi', 'Zainab'].map((n, i) =>
          bot(`b${i}`, n, ['👩🏾', '👨🏾', '👩🏾‍🦱', '🧔🏾', '🧕🏾'][i], { coins: Array(8).fill(30000) })),
        minerBot('m1', 'Lagos Pool'),
        minerBot('m2', 'Kano Pool'),
      ],
    })),
    script: (state) => {
      const first = myTxs(state).find((t) => t.status !== 'rejected')
      if (first && state.flags.sentAt == null) return [{ type: 'flag', key: 'sentAt', value: state.height }]
      return []
    },
    evaluate: (state) => {
      const sentAt = state.flags.sentAt
      const confirmedTx = paidTo(state, 'emeka', 5000).find((t) => t.status === 'confirmed')
      const deadline = sentAt == null ? null : sentAt + 3
      const inTime = confirmedTx && confirmedTx.blockHeight <= deadline
      const late = deadline != null && state.height >= deadline && !inTime
      return {
        status: inTime ? 'won' : late ? 'lost' : 'playing',
        reason: late ? 'larp.lose.late' : undefined,
        blocksLeft: deadline == null ? 3 : Math.max(0, deadline - state.height),
        objectives: [
          { key: 'larp.obj.sendEmeka', done: sentAt != null },
          { key: 'larp.obj.in3', done: !!inTime },
        ],
      }
    },
  },

  /* ------------------------------------------------------------------ 3 */
  {
    id: 'miner',
    emoji: '⛏️',
    title: 'Be a Miner!',
    tagline: 'Fill your block, then tap to mine!',
    role: 'miner',
    panels: ['miner', 'mempool'],
    paper: 'pow',
    xp: 100,
    traffic: 'busy',
    story: [
      '⛏️ Now YOU are a miner, in Group 1! Group 2 is racing you.',
      '🧺 First, fill your block with payment cards from the waiting room. Big tips = more sats for you!',
      '🔢 Then mine: tap the big button. Each tap tries new numbers. You win when you find a number SMALLER than the target. Win 2 blocks before Group 2 wins 4!',
    ],
    lesson: [
      'Miners fill blocks with payments and get the tips.',
      'Finding a winning number takes LOTS of tries, but checking it takes one look. (Grown-ups say: proof-of-work.)',
      'The winner also gets brand-new coins. (Grown-ups say: block reward.)',
      'When someone else wins, everybody starts the next block on top of theirs.',
    ],
    coach: [
      { say: 'You’re a miner! Drag a card from the waiting room into your block. Pick big tips!', point: 'mempool', done: (state, ui) => ui.template > 0 },
      { say: 'Now tap the big MINE button again and again! Look for a number smaller than the target.', point: 'rig', done: (state, ui) => mined(state) > 0 },
      { say: 'Hooray, you found a block! 🎉 Fill a new block and mine one more!', point: 'rig', done: (state, ui) => false },
    ],
    init: (name) => createState({
      difficulty: 2.3,
      blockVb: 600,
      players: [
        you(name, { role: 'miner', team: 'g1' }),
        minerBot('g2pool', 'Group 2 Pool', { team: 'g2', favourTeam: true, hashrate: 1.1 }),
        ...['Bisi', 'Tunde', 'Ngozi', 'Femi'].map((n, i) =>
          bot(`b${i}`, n, ['👩🏾', '👨🏾', '👩🏾‍🦱', '🧔🏾'][i], { team: i % 2 ? 'g2' : 'g1', coins: Array(8).fill(30000) })),
      ],
    }),
    evaluate: (state) => {
      const mine = state.players[YOU].blocksMined
      const theirs = state.players.g2pool.blocksMined
      return {
        status: mine >= 2 ? 'won' : theirs >= 4 ? 'lost' : 'playing',
        reason: theirs >= 4 ? 'larp.lose.outmined' : undefined,
        objectives: [
          { key: 'larp.obj.fill', done: state.chain.some((b) => b.miner === YOU && b.txids.length > 0) },
          { key: 'larp.obj.mine2', done: mine >= 2, count: `${mine}/2` },
        ],
        score: { g1: mine, g2: theirs },
      }
    },
  },

  /* ------------------------------------------------------------------ 4 */
  {
    id: 'node',
    emoji: '🛡️',
    title: 'Catch the Cheater',
    tagline: 'Check every card. Catch the cheaters!',
    role: 'node',
    panels: ['node'],
    paper: 'network',
    xp: 100,
    traffic: 'none',
    story: [
      '🛡️ You are a checker for the whole town. (Grown-ups call it a node.)',
      '🔍 For every card ask: Does the KEY colour match the LOCK colour? Is the coin still there? Is anyone making coins out of nothing?',
      '✅ Say yes to honest cards. ❌ Say no to cheats. Check 8 cards and make no more than 1 mistake.',
    ],
    lesson: [
      'Checkers look at every rule themselves. Nobody has to trust anybody.',
      'Wrong key colour, a coin already spent, or more coins out than in: say NO!',
      'Even miners can’t sneak a cheat past the checkers.',
    ],
    coach: [
      { say: 'Look at the card. Do the key and the lock have the SAME colour? Is the coin still there? Are coins out not more than coins in? Then tap Yes or No!', point: 'node', done: (state, ui) => state.nodeVerdicts.length >= 3 },
      { say: 'You’re a great checker! Keep going!', point: 'node', done: (state, ui) => false },
    ],
    init: (name) => {
      let state = createState({
        difficulty: 2,
        players: [
          you(name, { role: 'node' }),
          bot('ada', 'Ada', '👩🏾', { coins: [9000, 7000, 5000] }),
          bot('bayo', 'Bayo', '👨🏾', { coins: [8000, 6000, 4000] }),
          bot('chi', 'Chioma', '👩🏾‍🦱', { coins: [10000, 3000] }),
          minerBot('m1', 'Lagos Pool'),
        ],
      })
      // Some history so there are already-spent coins to try double-spending.
      for (const id of ['ada', 'bayo', 'chi']) {
        const tx = botPayment(state, state.players[id], { rate: 3 })
        if (tx) state = reduceAll(state, { type: 'broadcast', tx })
      }
      return mineNow(state, 'm1')
    },
    script: (state, tick) => {
      if (state.inbox.length || tick % 6 !== 0) return []
      const judged = state.nodeVerdicts.length
      if (judged >= 8) return []
      const kind = NODE_SEQUENCE[judged]
      const tx = nodeCase(state, kind) || nodeCase(state, 'valid')
      return tx ? [{ type: 'inbox', tx }] : []
    },
    evaluate: (state) => {
      const v = state.nodeVerdicts
      const wrong = v.filter((x) => !x.correct).length
      return {
        status: wrong >= 2 ? 'lost' : v.length >= 8 ? 'won' : 'playing',
        reason: wrong >= 2 ? 'larp.lose.mistakes' : undefined,
        objectives: [
          { key: 'larp.obj.judge8', done: v.length >= 8, count: `${v.length}/8` },
          { key: 'larp.obj.mistakes', done: v.length >= 8 && wrong <= 1, count: `${wrong}/1` },
        ],
      }
    },
  },

  /* ------------------------------------------------------------------ 5 */
  {
    id: 'doublespend',
    emoji: '📱',
    title: 'Dayo’s Sneaky Trick',
    tagline: 'Don’t give the phone away too early!',
    role: 'merchant',
    panels: ['merchant', 'mempool'],
    paper: 'calculations',
    xp: 125,
    traffic: 'calm',
    story: [
      '📱 You sell phones. Dayo wants one for 12,000 sats. He says, “I paid!”',
      '🚦 His payment is only in the waiting room. That’s just a promise! He could send the SAME coin back to himself with a bigger tip.',
      '🧱 Once his payment is inside a block, it’s safe. Wait for a block before you hand over the phone!',
    ],
    lesson: [
      'A payment in the waiting room is only a promise.',
      'Once it’s in a block, nobody can spend that coin again.',
      'Every block on top makes it even safer. (Grown-ups say: confirmations.)',
    ],
    coach: [
      { say: 'Wait for Dayo to pay…', point: 'merchant', done: (state, ui) => !!state.flags.payTx },
      { say: 'Dayo says he paid! But it’s still in the waiting room. Wait until there’s a block on top. Then tap Give the phone.', point: 'merchant', done: (state, ui) => state.flags.handedAt != null },
      { say: 'Let’s see what Dayo does…', point: 'chain', done: (state, ui) => false },
    ],
    init: (name) => createState({
      difficulty: 2,
      players: [
        you(name, { role: 'merchant', coins: [2000] }),
        bot('dayo', 'Dayo', '😏', { quiet: true, coins: [20000] }),
        bot('bisi', 'Bisi', '👩🏾', { coins: [20000, 20000] }),
        minerBot('m1', 'Lagos Pool'),
        minerBot('m2', 'Kano Pool'),
      ],
    }),
    script: (state, tick) => {
      const { flags } = state
      const dayo = state.players.dayo
      if (!flags.payTx && tick >= 8) {
        const tx = botPayment(state, dayo, { to: YOU, amount: 12000, rate: 2 })
        return [{ type: 'broadcast', tx: { ...tx, id: 'dayopay' } }, { type: 'flag', key: 'payTx', value: 'dayopay' }]
      }
      if (flags.handedAt != null && !flags.attacked) {
        // Dayo tries to take his coin back: same input, paid to himself, big fee.
        const orig = state.txs.dayopay
        const coin = state.utxos[orig.inputs[0]]
        const draft = { from: 'dayo', inputs: orig.inputs, outputs: [{ to: 'dayo', value: coin.value - 140 * 40 }] }
        const tx = { ...draft, fee: 140 * 40, size: 140, sig: sign(dayo.secret, txBody(draft)), id: 'dayosteal' }
        return [{ type: 'broadcast', tx }, { type: 'flag', key: 'attacked', value: true }]
      }
      return []
    },
    evaluate: (state) => {
      const pay = state.txs.dayopay
      const { handedAt, attacked } = state.flags
      const lostPay = pay && ['replaced', 'dropped'].includes(pay.status)
      const safe = attacked && pay?.status === 'confirmed' && state.txs.dayosteal?.status === 'rejected'
      return {
        status: handedAt != null && lostPay ? 'lost' : safe ? 'won' : 'playing',
        reason: lostPay ? 'larp.lose.doublespent' : undefined,
        objectives: [
          { key: 'larp.obj.waitConf', done: handedAt != null && handedAt >= 1 },
          { key: 'larp.obj.handover', done: handedAt != null },
        ],
      }
    },
  },
]

/** Fill the mempool before the player arrives: everyone's paying 6–30 sat/vB. */
function rushHour(state) {
  const bots = Object.values(state.players).filter((p) => p.isBot && p.role !== 'miner' && p.id !== 'emeka')
  for (let i = 0; i < 14; i++) {
    const tx = botPayment(state, bots[i % bots.length], { rate: 6 + Math.round(Math.random() * 24) })
    if (tx) state = reduceAll(state, { type: 'broadcast', tx })
  }
  return state
}

/* ---------- node chapter cases ---------- */

const NODE_SEQUENCE = ['valid', 'forged', 'valid', 'overspend', 'spent', 'valid', 'forged', 'spent']

/** Build a transaction of the given kind for the node to judge. */
function nodeCase(state, kind) {
  const holders = ['ada', 'bayo', 'chi'].map((id) => state.players[id])
  const withCoins = holders.filter((p) => spendableCoins(state, p.id).length)
  if (!withCoins.length) return null
  const sender = withCoins[Math.floor(Math.random() * withCoins.length)]
  const payee = holders.find((p) => p.id !== sender.id)

  if (kind === 'spent') {
    const spent = Object.values(state.utxos).find((u) => u.spentIn && state.players[u.owner]?.isBot && u.owner !== 'm1')
    if (!spent) return null
    const owner = state.players[spent.owner]
    const to = holders.find((p) => p.id !== owner.id)
    const tx = buildPayment(state, {
      from: owner.id, inputs: [spent.id], to: to.id, amount: Math.floor(spent.value / 2), rate: 3, secret: owner.secret,
    })
    return { ...tx, signedBy: owner.id }
  }

  const coin = spendableCoins(state, sender.id)[0]
  const amount = Math.floor(coin.value / 2 / 100) * 100

  if (kind === 'forged') {
    // Someone ELSE tries to spend sender's coin, signing with their own key.
    const thief = payee
    const tx = buildPayment(state, { from: sender.id, inputs: [coin.id], to: thief.id, amount, rate: 3, secret: thief.secret })
    return { ...tx, signedBy: thief.id }
  }

  if (kind === 'overspend') {
    // Signed correctly, but pays out more than the coin holds.
    const draft = { from: sender.id, inputs: [coin.id], outputs: [{ to: payee.id, value: coin.value + 5000 }] }
    return { ...draft, fee: -5000, size: 110, sig: sign(sender.secret, txBody(draft)), signedBy: sender.id }
  }

  const tx = buildPayment(state, { from: sender.id, inputs: [coin.id], to: payee.id, amount, rate: 3, secret: sender.secret })
  return { ...tx, signedBy: sender.id }
}

/* ---------- free play ---------- */

export const FREE_PLAY = {
  id: 'free',
  emoji: '🎲',
  title: 'Group 1 vs Group 2',
  tagline: 'Two teams, eight blocks. The team with the most sats wins!',
  role: 'free',
  panels: ['wallet', 'miner', 'mempool'],
  paper: 'incentive',
  traffic: 'busy',
  story: [
    '🎲 Two teams! You and Kemi are Group 1. Tunde and Zara are Group 2.',
    '⛏️ Mine blocks to win new coins and tips for your team. Tunde’s team is strong, so tap fast!',
    '✂️ Every 4 blocks the new-coin prize gets cut in half. After 8 blocks, the team with the most sats wins!',
  ],
  lesson: [
    'Mining is a race. The winner gets new coins plus all the tips.',
    'The new-coin prize gets cut in half on a schedule. (Grown-ups say: halving.)',
    'Miners choose which cards to put in. If one miner skips yours, a hungry miner will take it.',
  ],
  coach: [
    { say: 'Tap Best tips to fill your block, then tap MINE as fast as you can!', point: 'rig', done: (state, ui) => mined(state) > 0 },
    { say: 'Great! Keep mining for Group 1!', point: 'rig', done: (state, ui) => false },
  ],
  init: (name) => createState({
    difficulty: 2.5,
    blockVb: 600,
    subsidy: 10000,
    halvingEvery: 4,
    maxBlocks: 8,
    players: [
      you(name, { team: 'g1', coins: [15000, 8000] }),
      minerBot('kemi', 'Kemi', { emoji: '👩🏾‍💻', team: 'g1', favourTeam: true, hashrate: 0.6 }),
      bot('bisi', 'Bisi', '👩🏾', { team: 'g1', loyal: true, coins: Array(6).fill(20000) }),
      minerBot('tunde', 'Tunde Pool', { emoji: '🏭', team: 'g2', favourTeam: true, hashrate: 1.8 }),
      bot('zara', 'Zara', '🧕🏾', { team: 'g2', loyal: true, coins: Array(6).fill(20000) }),
      bot('obi', 'Obi', '👨🏾', { team: 'g2', loyal: true, coins: [23000] }),
    ],
  }),
  evaluate: (state) => {
    const g1 = teamBalance(state, 'g1')
    const g2 = teamBalance(state, 'g2')
    const over = state.height >= state.maxBlocks
    return {
      status: over ? (g1 > g2 ? 'won' : 'lost') : 'playing',
      reason: over && g1 <= g2 ? 'larp.lose.team' : undefined,
      blocksLeft: state.maxBlocks - state.height,
      score: { g1, g2 },
      objectives: [
        { key: 'larp.obj.mineOne', done: state.players[YOU].blocksMined > 0 },
        { key: 'larp.obj.teamLead', done: g1 > g2 },
      ],
    }
  },
}

/** XP for a finished free-play round. */
export function freePlayXp(state, won) {
  return state.players[YOU].blocksMined * 20 + (won ? 60 : 10)
}

export const findChapter = (id) => (id === FREE_PLAY.id ? FREE_PLAY : CHAPTERS.find((c) => c.id === id))

export { confirmations }
