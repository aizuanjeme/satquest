/*
  Bitcoin LARP engine — a tiny, honest model of the Bitcoin network.

  Everything here is PURE: `reduce(state, action) -> state`, no timers, no
  randomness, no DOM. Bots, chapter scripts and the UI produce actions; the
  engine decides what's valid. That keeps solo play deterministic and lets the
  future multiplayer server run this exact file as the authority for a room.

  Model (simplified, but every rule maps to a real one):
   - Coins are UTXOs: { id, owner, value }. You can't spend half a coin —
     you spend the whole thing and pay yourself the rest back as "change".
   - A transaction spends inputs (UTXO ids) into outputs. Whatever is left over
     is the miner's fee. Size is measured in virtual bytes (vB) with real-ish
     P2WPKH weights, so fee RATE (sats/vB) is what miners rank by.
   - Every input must be signed by its owner's key. Signing with the wrong key
     (a forgery) is rejected by every honest node.
   - The mempool holds broadcast-but-unconfirmed transactions. A later
     transaction spending the same coin with a higher fee REPLACES the earlier
     one (replace-by-fee) — which is exactly why 0-confirmation payments are risky.
   - Miners fill a block (limited vB) and grind nonces until the block hash
     starts with N zeros (proof-of-work). The winner gets subsidy + fees.
*/

export const TX_OVERHEAD_VB = 11
export const INPUT_VB = 68
export const OUTPUT_VB = 31

/* ---------- hashing ---------- */

// cyrb53-style 64-bit string hash (16 hex chars). Not SHA-256, but
// it behaves the same way for the game: unpredictable output, so the only way
// to find a hash with leading zeros is to keep trying nonces.
export function hash(str) {
  let h1 = 0xdeadbeef
  let h2 = 0x41c6ce57
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return (h2 >>> 0).toString(16).padStart(8, '0') + (h1 >>> 0).toString(16).padStart(8, '0')
}

/** The block header a miner grinds on: previous hash, height, its txs, its payout. */
export function headerOf(state, minerId, txids) {
  return `${tipHash(state)}|${state.height + 1}|${minerId}|${txids.join(',')}`
}

export function blockHash(header, nonce) {
  return hash(`${header}|${nonce}`)
}

/**
 * Like Bitcoin, a block is valid when its hash is numerically BELOW a target.
 * `difficulty` d means roughly one in 16^d hashes wins (d may be fractional).
 */
export function targetOf(difficulty) {
  return Math.floor(2 ** 32 / 16 ** difficulty)
}

export function targetHex(difficulty) {
  return targetOf(difficulty).toString(16).padStart(8, '0')
}

/**
 * Hashes and targets shown as plain numbers from 0 to 99,999 (like the paper
 * LARP kit) so a child can play "find a number smaller than the target".
 */
export const HASH_SPACE = 100000

export function hashNumber(h) {
  return Math.floor((parseInt(h.slice(0, 8), 16) / 2 ** 32) * HASH_SPACE)
}

export function targetNumber(difficulty) {
  return Math.max(1, Math.floor((targetOf(difficulty) / 2 ** 32) * HASH_SPACE))
}

export function meetsTarget(h, difficulty) {
  return hashNumber(h) < targetNumber(difficulty)
}

/* ---------- friendly names + lock colours ---------- */

const ANIMALS = [
  'eagle', 'lion', 'zebra', 'tiger', 'panda', 'koala', 'otter', 'shark',
  'whale', 'camel', 'gecko', 'parrot', 'turtle', 'rabbit', 'monkey', 'hippo',
  'falcon', 'gorilla', 'cheetah', 'dolphin', 'beaver', 'goat', 'owl', 'crab',
  'snail', 'llama', 'bison', 'moose', 'puffin', 'lemur', 'hyena', 'frog',
]

/** Every transaction gets a nickname, like "eagle33" on the paper cards. */
export function txName(id) {
  const n = parseInt(hash(String(id)).slice(0, 6), 16)
  return `${ANIMALS[n % ANIMALS.length]}${(n % 90) + 10}`
}

/**
 * Each player's padlock colour stands for their public key; the matching key
 * is their private key. Only your colour key opens your colour lock.
 */
export const LOCK_COLORS = [
  { id: 'blue', hex: '#2f6bff' },
  { id: 'pink', hex: '#e83fd1' },
  { id: 'red', hex: '#e5383b' },
  { id: 'yellow', hex: '#f2b418' },
  { id: 'green', hex: '#22b573' },
  { id: 'purple', hex: '#8e5cff' },
  { id: 'orange', hex: '#ff8a1f' },
  { id: 'teal', hex: '#16c1c9' },
]

export function tipHash(state) {
  return state.chain.length ? state.chain[state.chain.length - 1].hash : '0'.repeat(16)
}

/* ---------- keys & signatures ---------- */

/** Sign a tx body with a player's secret key. */
export function sign(secret, body) {
  return hash(`${secret}::${body}`)
}

export function txBody({ from, inputs, outputs }) {
  return `${from}|${inputs.join(',')}|${outputs.map((o) => `${o.to}:${o.value}`).join(',')}`
}

export function txSize(nIn, nOut) {
  return TX_OVERHEAD_VB + INPUT_VB * nIn + OUTPUT_VB * nOut
}

/* ---------- state ---------- */

/**
 * Build a fresh world.
 * players: [{ id, name, emoji, team?, isBot, role, secret, coins: [values] }]  (team: 'g1' | 'g2' in team modes)
 */
export function createState({
  players, difficulty = 2, blockVb = 600, subsidy = 10000, halvingEvery = 0, maxBlocks = 0,
}) {
  const state = {
    height: 0,
    difficulty,
    blockVb,
    subsidy,
    baseSubsidy: subsidy,
    halvingEvery,
    maxBlocks,
    players: {},
    utxos: {},
    txs: {},
    mempool: [],
    inbox: [],
    chain: [],
    log: [],
    seq: 0,
    nodeVerdicts: [],
    flags: {},
  }
  players.forEach((p, i) => {
    const { coins = [], ...rest } = p
    state.players[p.id] = {
      role: 'holder', team: null, isBot: false, blocksMined: 0, lock: LOCK_COLORS[i % LOCK_COLORS.length], ...rest,
    }
    for (const value of coins) {
      const id = `g${state.seq++}`
      state.utxos[id] = { id, owner: p.id, value, height: 0, spentIn: null }
    }
  })
  return state
}

/* ---------- queries ---------- */

/** Coins a player can drag into a new transaction right now. */
export function spendableCoins(state, pid) {
  const pending = new Set(state.mempool.flatMap((id) => state.txs[id].inputs))
  return Object.values(state.utxos).filter(
    (u) => u.owner === pid && !u.spentIn && !pending.has(u.id),
  )
}

export function balanceOf(state, pid) {
  return Object.values(state.utxos)
    .filter((u) => u.owner === pid && !u.spentIn)
    .reduce((n, u) => n + u.value, 0)
}

export function teamBalance(state, team) {
  return Object.values(state.players)
    .filter((p) => p.team === team)
    .reduce((n, p) => n + balanceOf(state, p.id), 0)
}

export function confirmations(state, txid) {
  const tx = state.txs[txid]
  if (!tx || tx.blockHeight == null) return 0
  return state.height - tx.blockHeight + 1
}

export function feeRate(tx) {
  return tx.size ? tx.fee / tx.size : 0
}

/** Mempool txs, best fee rate first. */
export function sortedMempool(state) {
  return state.mempool.map((id) => state.txs[id]).sort((a, b) => feeRate(b) - feeRate(a))
}

/**
 * Check a transaction against the confirmed chain.
 * Returns { ok: true } or { ok: false, reason } where reason is one of:
 *   'empty' | 'missing-input' | 'spent-input' | 'bad-signature' | 'overspend' | 'dust'
 */
export function checkTx(state, tx) {
  if (!tx.inputs.length || !tx.outputs.length) return { ok: false, reason: 'empty' }
  let inSum = 0
  for (const id of tx.inputs) {
    const coin = state.utxos[id]
    if (!coin) return { ok: false, reason: 'missing-input' }
    if (coin.spentIn) return { ok: false, reason: 'spent-input' }
    const owner = state.players[coin.owner]
    if (!owner || tx.sig !== sign(owner.secret, txBody(tx))) return { ok: false, reason: 'bad-signature' }
    inSum += coin.value
  }
  if (tx.outputs.some((o) => !(o.value > 0))) return { ok: false, reason: 'dust' }
  const outSum = tx.outputs.reduce((n, o) => n + o.value, 0)
  if (outSum > inSum) return { ok: false, reason: 'overspend' }
  return { ok: true }
}

/** Mempool txs that spend any of the same coins as `tx`. */
function conflictsOf(state, tx) {
  const mine = new Set(tx.inputs)
  return state.mempool.filter((id) => id !== tx.id && state.txs[id].inputs.some((i) => mine.has(i)))
}

/**
 * Pick the most profitable set of mempool txs that fits in a block.
 * Greedy by fee rate; `prefer` lets a pool favour its own team's senders
 * (the "collect my transaction, not theirs" choice).
 */
export function bestTemplate(state, { prefer } = {}) {
  const ranked = sortedMempool(state).sort((a, b) => {
    if (prefer) {
      const pa = state.players[a.from]?.team === prefer ? 1 : 0
      const pb = state.players[b.from]?.team === prefer ? 1 : 0
      if (pa !== pb) return pb - pa
    }
    return feeRate(b) - feeRate(a)
  })
  const picked = []
  let used = 0
  for (const tx of ranked) {
    if (used + tx.size > state.blockVb) continue
    picked.push(tx.id)
    used += tx.size
  }
  return picked
}

export function templateStats(state, txids) {
  const txs = txids.map((id) => state.txs[id]).filter(Boolean)
  return {
    vb: txs.reduce((n, t) => n + t.size, 0),
    fees: txs.reduce((n, t) => n + t.fee, 0),
  }
}

/* ---------- tx construction (used by UI + bots) ---------- */

/**
 * Build and sign a payment.
 *   inputs: coin ids, to: player id, amount, rate: sats/vB.
 * Change goes back to the sender automatically; if the change would be
 * tiny it's dropped into the fee (like real wallets do with dust).
 */
export function buildPayment(state, { from, inputs, to, amount, rate, secret }) {
  const inSum = inputs.reduce((n, id) => n + (state.utxos[id]?.value || 0), 0)
  let size = txSize(inputs.length, 2)
  let fee = Math.ceil(size * rate)
  let change = inSum - amount - fee
  const outputs = [{ to, value: amount }]
  if (change > 300) {
    outputs.push({ to: from, value: change, change: true })
  } else {
    size = txSize(inputs.length, 1)
    fee = inSum - amount
    change = 0
  }
  const draft = { from, inputs, outputs }
  return {
    ...draft,
    fee: inSum - outputs.reduce((n, o) => n + o.value, 0),
    size,
    sig: secret ? sign(secret, txBody(draft)) : null,
    shortBy: Math.max(0, amount + Math.ceil(txSize(inputs.length, 1) * rate) - inSum),
  }
}

/* ---------- reducer ---------- */

function log(state, kind, data) {
  state.log = [...state.log.slice(-59), { at: state.seq++, kind, ...data }]
}

function addToMempool(state, tx) {
  const conflicts = conflictsOf(state, tx)
  if (conflicts.length) {
    const beaten = conflicts.every((id) => tx.fee > state.txs[id].fee)
    if (!beaten) {
      log(state, 'rejected', { txid: tx.id, from: tx.from, reason: 'conflict' })
      state.txs[tx.id] = { ...tx, status: 'rejected', reason: 'conflict' }
      return false
    }
    for (const id of conflicts) {
      state.txs[id] = { ...state.txs[id], status: 'replaced', replacedBy: tx.id }
      log(state, 'replaced', { txid: id, by: tx.id, from: state.txs[id].from })
    }
    state.mempool = state.mempool.filter((id) => !conflicts.includes(id))
  }
  state.txs[tx.id] = { ...tx, status: 'mempool', seenAt: state.height }
  state.mempool = [...state.mempool, tx.id]
  log(state, 'broadcast', { txid: tx.id, from: tx.from })
  return true
}

function applyBlock(state, minerId, txids, nonce, h) {
  const height = state.height + 1
  let fees = 0
  for (const id of txids) {
    const tx = state.txs[id]
    for (const inp of tx.inputs) state.utxos[inp] = { ...state.utxos[inp], spentIn: id }
    tx.outputs.forEach((o, i) => {
      const uid = `${id}:${i}`
      state.utxos[uid] = { id: uid, owner: o.to, value: o.value, height, spentIn: null, change: !!o.change }
    })
    state.txs[id] = { ...tx, status: 'confirmed', blockHeight: height }
    fees += tx.fee
  }
  const reward = state.subsidy + fees
  const cb = `cb${height}`
  state.utxos[cb] = { id: cb, owner: minerId, value: reward, height, spentIn: null, coinbase: true }
  state.chain = [...state.chain, {
    height, miner: minerId, txids, nonce, hash: h, fees, subsidy: state.subsidy, reward,
    prevHash: tipHash(state),
  }]
  state.height = height
  state.players[minerId] = { ...state.players[minerId], blocksMined: state.players[minerId].blocksMined + 1 }

  // Anything left in the mempool that now spends a confirmed-spent coin is dead.
  const included = new Set(txids)
  state.mempool = state.mempool.filter((id) => {
    if (included.has(id)) return false
    const tx = state.txs[id]
    if (tx.inputs.some((i) => state.utxos[i]?.spentIn)) {
      state.txs[id] = { ...tx, status: 'dropped', reason: 'spent-input' }
      log(state, 'dropped', { txid: id, from: tx.from })
      return false
    }
    return true
  })

  log(state, 'block', { height, miner: minerId, count: txids.length, reward })

  if (state.halvingEvery && height % state.halvingEvery === 0) {
    state.subsidy = Math.floor(state.subsidy / 2)
    log(state, 'halving', { subsidy: state.subsidy })
  }
}

/**
 * Actions:
 *   { type: 'broadcast', tx }                    — submit a signed tx to the network
 *   { type: 'inbox', tx }                        — queue a tx for a human node to judge
 *   { type: 'verdict', txid, verdict: 'valid'|'invalid' }
 *   { type: 'block', miner, txids, nonce }       — claim a mined block
 *   { type: 'flag', key, value }                 — chapter script bookkeeping
 */
export function reduce(prev, action) {
  const state = { ...prev, txs: { ...prev.txs }, utxos: { ...prev.utxos }, players: { ...prev.players } }

  switch (action.type) {
    case 'broadcast': {
      const tx = { ...action.tx, id: action.tx.id || `t${state.seq++}` }
      const check = checkTx(state, tx)
      if (!check.ok) {
        state.txs[tx.id] = { ...tx, status: 'rejected', reason: check.reason }
        log(state, 'rejected', { txid: tx.id, from: tx.from, reason: check.reason })
        return state
      }
      addToMempool(state, tx)
      return state
    }

    case 'inbox': {
      const tx = { ...action.tx, id: action.tx.id || `t${state.seq++}` }
      state.txs[tx.id] = { ...tx, status: 'inbox' }
      state.inbox = [...state.inbox, tx.id]
      return state
    }

    case 'verdict': {
      const tx = state.txs[action.txid]
      if (!tx || !state.inbox.includes(tx.id)) return prev
      state.inbox = state.inbox.filter((id) => id !== tx.id)
      const check = checkTx(state, tx)
      const truth = check.ok ? 'valid' : 'invalid'
      state.nodeVerdicts = [...state.nodeVerdicts, {
        txid: tx.id, verdict: action.verdict, truth, reason: check.reason, correct: action.verdict === truth,
      }]
      if (check.ok) addToMempool(state, tx)
      else state.txs[tx.id] = { ...tx, status: 'rejected', reason: check.reason }
      return state
    }

    case 'block': {
      if (state.maxBlocks && state.height >= state.maxBlocks) return prev
      const txids = action.txids.filter((id) => state.mempool.includes(id))
      const { vb } = templateStats(state, txids)
      if (vb > state.blockVb) return prev
      const h = blockHash(headerOf(prev, action.miner, action.txids), action.nonce)
      // Header must commit to exactly the txs we're including and meet the target.
      if (txids.length !== action.txids.length || !meetsTarget(h, state.difficulty)) return prev
      state.chain = [...prev.chain]
      applyBlock(state, action.miner, txids, action.nonce, h)
      return state
    }

    case 'flag':
      state.flags = { ...state.flags, [action.key]: action.value }
      return state

    default:
      return prev
  }
}

/** Apply one action or a list of them in order. */
export function reduceAll(state, actions) {
  return Array.isArray(actions) ? actions.reduce(reduce, state) : reduce(state, actions)
}

/** Grind a block immediately (used to give a chapter some chain history). */
export function mineNow(state, minerId, txids = bestTemplate(state)) {
  const header = headerOf(state, minerId, txids)
  for (let nonce = 0; nonce < 1e6; nonce++) {
    if (meetsTarget(blockHash(header, nonce), state.difficulty)) {
      return reduce(state, { type: 'block', miner: minerId, txids, nonce })
    }
  }
  return state
}
