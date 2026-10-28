/*
  Words for The Bitcoin Mission (English). Like the chapter stories, this is
  game content rather than app chrome, so it lives beside the mission data.
  Simple words first; the grown-up word follows in the UI as a chip or in
  brackets.
*/
import { opLabel, KIT } from './kit'
import { txName } from './engine'
import { PLAYERS } from './mission'

const who = (id) => PLAYERS.find((p) => p.id === id)?.name || id

export const BRIEFING = [
  '👩🏾 Alice wants to send 50,000 sats to her friend Bob 👨🏾.',
  '🪙 A sat is a tiny piece of a bitcoin. 100,000,000 sats make 1 bitcoin! (Grown-ups say: satoshis.)',
  '🧺 You’ll play it just like the table game: fill in the card, pass it around, check it, mine a block, and fix the baskets.',
  '🎮 This is a pretend game. The sats, cards and blocks are not real Bitcoin, and you never need a real wallet or secret words.',
]

export const STAGE_INFO = {
  create: {
    icon: '✍️', title: 'Fill in the card', role: 'You are Alice',
    goal: 'Make a transaction card that pays Bob 50,000 sats.',
  },
  relay: {
    icon: '📡', title: 'Pass it on', role: 'You are the network',
    goal: 'Pass Alice’s card from computer to computer until everyone has it.',
  },
  validate: {
    icon: '🔍', title: 'Check the cards', role: 'You are a checker (node)',
    goal: 'Use the check sheet. Good cards go in the MEMPOOL basket. Cheats get rejected.',
  },
  build: {
    icon: '⛏️', title: 'Build & mine a block', role: 'You are a miner',
    goal: 'Put cards in your block, fill in the coinbase and header, then mine!',
  },
  blockcheck: {
    icon: '🧱', title: 'Check the blocks', role: 'You are a checker (node)',
    goal: 'Two blocks arrived. Use the block check sheet. Only good blocks join the chain.',
  },
  update: {
    icon: '🧺', title: 'After you check', role: 'You are a checker (node)',
    goal: 'Fix the baskets: take out spent coins, put in new coins, clear the MEMPOOL.',
  },
  confirm: {
    icon: '🎉', title: 'Bob gets paid', role: 'You are watching',
    goal: 'See Bob’s payment get confirmations.',
  },
}

export const TX_SHEET = [
  { q: 'coins', text: 'Is every coin in the UTXO SET basket — and not already used by a card in the MEMPOOL?' },
  { q: 'keys', text: 'Does each key sticker match the lock on the coin it opens?' },
  { q: 'sums', text: 'Do the coins going in add up to at least the coins going out? Does every output have a lock?' },
]

export const BLOCK_SHEET = [
  { q: 'prev', text: 'Does “prev block hash” match the last block? Does the tx commitment match the cards?' },
  { q: 'pow', text: 'Is the block’s hash smaller than the target?' },
  { q: 'txs', text: 'Is every card in the block a good card?' },
  { q: 'coinbase', text: 'Is the coinbase amount no more than the block reward + all the tips?' },
]

/** Feedback after an action: { title, body }. */
export function feedbackText(fb) {
  if (!fb) return null
  const f = fb
  switch (f.code) {
    case 'start': return { title: 'Let’s go!', body: 'Drag Alice’s coins from the UTXO SET basket into the card.' }
    case 'short': return { title: 'Not enough coins', body: `You need ${f.need.toLocaleString()} more sats. Add another of Alice’s coins.` }
    case 'wrong-payee': return { title: 'Wrong lock!', body: `That’s ${who(f.lock)}’s lock. Whoever owns the lock can spend the coin — so Bob’s 50,000 needs Bob’s green lock.` }
    case 'wrong-change': return { title: 'That change isn’t Alice’s', body: `The change comes back to Alice, so it needs Alice’s blue lock, not ${who(f.lock)}’s.` }
    case 'no-lock': return { title: 'An output has no lock', body: 'Every output needs a lock sticker, or nobody can ever open it.' }
    case 'unsigned': return { title: 'Sign every coin', body: `Put Alice’s key sticker on ${opLabel(f.op)}. The key shows Alice said “yes”. (Grown-ups say: signature.)` }
    case 'wrong-key': return { title: 'That coin isn’t Alice’s', body: `${opLabel(f.op)} has someone else’s lock. Alice’s key can’t open it — take it out.` }
    case 'missing': return { title: 'That coin is gone', body: `${opLabel(f.op)} isn’t in the UTXO SET basket any more.` }
    case 'double-spend': return { title: 'Already used!', body: `${opLabel(f.op)} is already on a card in the MEMPOOL.` }
    case 'overspend': case 'bad-amount': return { title: 'The numbers don’t add up', body: 'More is going out than coming in.' }
    case 'no-inputs': return { title: 'No coins yet', body: 'Drag Alice’s coins into the card first.' }
    case 'sent': return { title: 'Card sent! It’s not confirmed yet', body: 'A transaction card says “move these coins to Bob”. Sending it is only the start — it isn’t in a block yet. (Grown-ups say: unconfirmed.)' }
    case 'no-card': return { title: 'This computer doesn’t have the card yet', body: 'A computer can only pass on cards it already has. Start from a glowing one.' }
    case 'relayed': return { title: 'Everyone has it!', body: 'Alice wasn’t connected to Bob, but the card hopped from friend to friend. Each computer only talks to its neighbours. (Grown-ups say: peer-to-peer network.)' }
    case 'answer-all': return { title: 'Answer every question', body: 'Tick ✓ or ✗ for each line on the sheet.' }
    case 'sheet-wrong': return { title: 'Look again', body: `Check ${f.wrong.map((q) => `“${QUESTION_SHORT[q]}”`).join(' and ')} one more time.` }
    case 'tx-valid': return { title: 'Into the MEMPOOL basket ✅', body: 'This card follows the rules, so it waits in the MEMPOOL for a miner. Checkers don’t trust anyone — they check everything themselves.' }
    case 'tx-invalid': return {
      title: 'Rejected ❌',
      body: f.reason === 'double-spend'
        ? 'Sneaky! That coin was already used by a card in the MEMPOOL. The same coin can’t be spent twice. (Grown-ups say: double-spend.)'
        : f.reason === 'wrong-key'
          ? 'Forged! The key sticker doesn’t match the lock. Only the owner’s key can open a coin.'
          : 'This card breaks the rules, so it stays out of the MEMPOOL.',
    }
    case 'not-in-mempool': return { title: 'Not from the MEMPOOL', body: 'Only cards that passed the check sheet can go in a block. That one was rejected.' }
    case 'block-full': return { title: 'The block is full', body: 'A block only has room for a few cards. Take one out first.' }
    case 'greedy': return { title: 'Too greedy!', body: `You can claim at most ${f.max.toLocaleString()} (reward + tips). Other checkers would reject your whole block.` }
    case 'coinbase-lock': return { title: 'Use your own lock', body: 'The coinbase pays the miner — that’s you! Use the orange miner lock.' }
    case 'coinbase-first': return { title: 'Finish the coinbase first', body: 'The commitment is made from every card in the block, including the coinbase.' }
    case 'header-first': return { title: 'Fill in the header first', body: 'Write the prev block hash and the tx commitment before you load the miner.' }
    case 'not-yet': return { title: 'Keep mining!', body: 'The lowest hash still isn’t smaller than the target.' }
    case 'forgot-alice': return { title: 'Where’s Alice’s card?', body: 'Your mission is to get Alice’s payment into a block. Add her card!' }
    case 'block-incomplete': return { title: 'Almost there', body: 'Fill every blank on the header and write in your winning nonce.' }
    case 'shared': return { title: 'Block shared!', body: 'Miners build blocks and do the work, but they don’t decide alone — every checker checks the block for themselves. This mining is a pretend puzzle, not real Bitcoin mining.' }
    case 'block-ok': return { title: 'Good block ✅', body: 'It follows every rule, so it joins the chain.' }
    case 'block-bad': return { title: 'Bad block ❌', body: `${who(f.miner)} did the mining work, but paid itself too much. Mining doesn’t force checkers to say yes!` }
    case 'still-unspent': return { title: 'That coin wasn’t spent', body: `${opLabel(f.op)} isn’t used by any card in the block, so it stays in the UTXO SET.` }
    case 'still-waiting': return { title: 'That card isn’t in the block', body: 'It keeps waiting in the MEMPOOL.' }
    case 'updated': return { title: 'Baskets fixed! 1 confirmation', body: 'Alice’s card is in a block on the chain, so Bob’s payment has 1 confirmation.' }
    case 'second-conf': return { title: '2 confirmations!', body: 'Another block was built on top. Every new block makes Bob’s payment safer.' }
    default: return null
  }
}

export const QUESTION_SHORT = {
  coins: 'coins in the UTXO SET',
  keys: 'keys match the locks',
  sums: 'the numbers add up',
  prev: 'prev hash & commitment',
  pow: 'hash smaller than target',
  txs: 'every card is good',
  coinbase: 'coinbase not too big',
}

const allSigned = (m) => m.draft.inputs.length > 0 && m.draft.inputs.every((o) => m.draft.sigs[o])

/** Bitty's step-by-step lines per stage. done(m) => true moves to the next line. */
export function coachSteps(stage) {
  return {
    brief: [],
    create: [
      { say: 'Drag Alice’s blue-lock coins from the UTXO SET basket into the card. You need 50,000 for Bob plus a tip.', point: 'utxo', done: (m) => m.draft.inputs.length >= 2 },
      { say: 'Now stick Bob’s green lock on output zero, and Alice’s blue lock on the change.', point: 'locks', done: (m) => m.draft.locks[0] && m.draft.locks[1] },
      { say: 'Stick Alice’s key on every coin to sign it.', point: 'keys', done: allSigned },
      { say: 'Everything is filled in! Tap Send the card.', point: 'send', done: () => false },
    ],
    relay: [
      { say: 'Tap a computer that has the card to pass it to its neighbours. Keep going until Bob has it!', point: 'network', done: () => false },
    ],
    validate: [
      { say: 'Look at the card, look in the baskets, and tick ✓ or ✗ for each question. Then tap Done.', point: 'sheet', done: () => false },
    ],
    build: [
      { say: 'Drag cards from the MEMPOOL basket onto the block txids card. Don’t forget Alice’s!', point: 'mempool', done: (m) => m.build.picked.includes('talice') },
      { say: 'Now the coinbase: claim your reward, and stick your orange lock on it.', point: 'coinbase', done: (m) => m.build.coinbase.value != null && m.build.coinbase.lock },
      { say: 'Fill in the header: tap the blanks for prev block hash and tx commitment. Then load the miner.', point: 'header', done: (m) => m.build.loaded },
      { say: 'Tap MINE until the lowest hash is smaller than the target.', point: 'gadget', done: (m) => m.build.rig.lowest != null && m.build.rig.lowest < KIT.target },
      { say: 'You found one! Write the winning nonce on the header.', point: 'write', done: (m) => m.build.header.nonce != null },
      { say: 'Your block is ready. Share it with everyone!', point: 'share', done: () => false },
    ],
    blockcheck: [
      { say: 'Check this block with the sheet. Tap the buttons to find the hash and add up the tips.', point: 'sheet', done: () => false },
    ],
    update: [
      { say: 'Take the spent coins out of the UTXO SET, put the block’s new coins in, and clear its cards from the MEMPOOL.', point: 'baskets', done: () => false },
    ],
    confirm: [
      { say: 'Bob’s payment is in a block! Tap to wait for the next block.', point: 'confirm', done: (m) => m.confirm.extra },
      { say: 'Two confirmations! Tap Finish to see what you learned.', point: 'confirm', done: () => false },
    ],
  }[stage] || []
}

/** Mission recap — key ideas from the MVP learning objectives. */
export const RECAP = [
  { icon: '🪙', text: 'A sat is a tiny piece of a bitcoin: 100,000,000 sats = 1 bitcoin.', grown: 'satoshis' },
  { icon: '✍️', text: 'A transaction card moves coins: inputs are old coins, outputs are new coins with new locks.', grown: 'transaction' },
  { icon: '🔑', text: 'Only the owner’s key opens a coin’s lock.', grown: 'signature' },
  { icon: '📡', text: 'Computers pass cards to their neighbours until everyone has them.', grown: 'nodes, peer-to-peer' },
  { icon: '🧺', text: 'Checked cards wait in the MEMPOOL basket. Waiting is not the same as confirmed.', grown: 'mempool' },
  { icon: '🚫', text: 'The same coin can never be spent twice.', grown: 'double-spend' },
  { icon: '⛏️', text: 'Miners build blocks and do lots of tries to find a small hash — but checkers still check every block.', grown: 'proof-of-work' },
  { icon: '🧱', text: 'In a good block = 1 confirmation. Each block on top adds one more.', grown: 'confirmations' },
]

export const txLabel = (id) => txName(id)
