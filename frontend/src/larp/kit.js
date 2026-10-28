/*
  The Bitcoin Table — rules for the kit mission, modelled on the paper LARP
  kit: a UTXO SET basket, a MEMPOOL basket, transaction cards whose inputs
  point at "txid #n" and carry a key sticker (signature), outputs that carry
  a lock sticker (who can spend it), a coinbase card, a "block txids" card,
  a block header card and a handheld miner.

  Pure functions only (no React, no timers, no randomness), so every rule the
  mission relies on is unit-tested in kit.test.js.

  This is an educational model. Real Bitcoin validation, signatures and
  proof-of-work are far more involved; the game says so on screen.
*/
import { hash, hashNumber, txName } from './engine'

export const KIT = {
  subsidy: 5000, // new coins a block may create (block reward)
  target: 400, // a block's hash must be smaller than this (out of 100,000)
  blockSlots: 3, // transaction cards that fit on the "block txids" card
}

/* ---------- outpoints: "txid #n" ---------- */

export const op = (txid, n) => `${txid}:${n}`
export function parseOp(o) {
  const i = o.lastIndexOf(':')
  return { txid: o.slice(0, i), n: Number(o.slice(i + 1)) }
}
/** How an outpoint is written on a card, e.g. "lion42 #0". */
export function opLabel(o) {
  const { txid, n } = parseOp(o)
  return `${txName(txid)} #${n}`
}

/* ---------- world ---------- */

/**
 * players: [{ id, name, emoji, lock: { hex } }]
 * coins:   [{ txid, n, value, owner }]   — the starting UTXO set
 */
export function makeWorld({ players, coins }) {
  const world = { players: {}, utxos: {}, txs: {}, mempool: [], chain: [] }
  for (const p of players) world.players[p.id] = p
  for (const c of coins) {
    const o = op(c.txid, c.n)
    world.utxos[o] = { op: o, value: c.value, owner: c.owner }
  }
  world.chain.push({ height: 0, hash: hashNumber(hash('genesis')), txids: [], header: null, miner: null })
  return world
}

export const tip = (world) => world.chain[world.chain.length - 1]
export const tipHash = (world) => tip(world).hash
export const height = (world) => tip(world).height

/* ---------- transactions ---------- */

/**
 * tx: { id, inputs: [outpoint], outputs: [{ value, lock: playerId }], sigs: { [outpoint]: playerId } }
 * A key sticker (sigs[outpoint]) is valid only if it belongs to the coin's owner.
 */
export function inputSum(world, tx) {
  return tx.inputs.reduce((n, o) => n + (world.utxos[o]?.value || 0), 0)
}
export const outputSum = (tx) => tx.outputs.reduce((n, o) => n + (Number(o.value) || 0), 0)
export const txFee = (world, tx) => inputSum(world, tx) - outputSum(tx)

/**
 * Check a card against the UTXO SET (and, unless told otherwise, the MEMPOOL).
 * Returns { ok, problems: [{ code, op?, out? }], inSum, outSum, fee }.
 * codes: no-inputs | missing | double-spend | unsigned | wrong-key | no-lock | bad-amount | overspend
 */
export function checkTx(world, tx, { ignoreMempool = false } = {}) {
  const problems = []
  if (!tx.inputs.length) problems.push({ code: 'no-inputs' })
  const used = new Set(
    ignoreMempool ? [] : world.mempool.filter((id) => id !== tx.id).flatMap((id) => world.txs[id].inputs),
  )
  for (const o of tx.inputs) {
    const coin = world.utxos[o]
    if (!coin) { problems.push({ code: 'missing', op: o }); continue }
    if (used.has(o)) problems.push({ code: 'double-spend', op: o })
    const signer = tx.sigs?.[o]
    if (!signer) problems.push({ code: 'unsigned', op: o })
    else if (signer !== coin.owner) problems.push({ code: 'wrong-key', op: o })
  }
  tx.outputs.forEach((out, i) => {
    if (!out.lock) problems.push({ code: 'no-lock', out: i })
    if (!(Number(out.value) > 0)) problems.push({ code: 'bad-amount', out: i })
  })
  const inSum = inputSum(world, tx)
  const outSum = outputSum(tx)
  if (tx.inputs.length && outSum > inSum) problems.push({ code: 'overspend' })
  return { ok: problems.length === 0, problems, inSum, outSum, fee: inSum - outSum }
}

/** The right answers to the Transaction Validation sheet for this card. */
export function txSheetAnswers(world, tx) {
  const codes = new Set(checkTx(world, tx).problems.map((p) => p.code))
  return {
    coins: !codes.has('missing') && !codes.has('double-spend') && !codes.has('no-inputs'),
    keys: !codes.has('unsigned') && !codes.has('wrong-key'),
    sums: !codes.has('overspend') && !codes.has('bad-amount') && !codes.has('no-lock'),
  }
}

/* ---------- relay (peer-to-peer gossip) ---------- */

/** Pass the card from `node` to all of its peers. Nodes without the card can't relay. */
export function relay(network, have, node) {
  if (!have.includes(node)) return have
  const peers = network.edges
    .filter(([a, b]) => a === node || b === node)
    .map(([a, b]) => (a === node ? b : a))
  return [...new Set([...have, ...peers])]
}

export const peersOf = (network, node) =>
  network.edges.filter(([a, b]) => a === node || b === node).map(([a, b]) => (a === node ? b : a))

/* ---------- blocks ---------- */

/** The "tx commitment" written on the header: a short fingerprint of the block's txids. */
export function commitment(txids) {
  return hashNumber(hash(txids.join(','))) % 100
}

export function headerHash(header) {
  return hashNumber(hash(`${header.prev}|${header.commit}|${header.time}|${header.nonce}`))
}

/**
 * The handheld miner: try `tries` nonces starting at `from`.
 * Returns { tries, lowest, bestNonce, next } — lowest is the smallest hash seen.
 */
export function grind(header, from, tries) {
  let lowest = Infinity
  let bestNonce = null
  for (let nonce = from; nonce < from + tries; nonce++) {
    const h = headerHash({ ...header, nonce })
    if (h < lowest) { lowest = h; bestNonce = nonce }
  }
  return { tries, lowest, bestNonce, next: from + tries }
}

/** Grind until a winning nonce is found (used for bot blocks). */
export function findNonce(header, from = 0) {
  for (let nonce = from; nonce < from + 1e6; nonce++) {
    if (headerHash({ ...header, nonce }) < header.target) return nonce
  }
  return null
}

export function makeCoinbase(h, value, lock) {
  return { id: `cb${h}-${lock}`, coinbase: true, inputs: [], outputs: [{ value, lock }], sigs: {} }
}

/**
 * Build a block from cards. `txs` excludes the coinbase; the coinbase comes first in txids.
 * header.nonce may be null until mined.
 */
export function makeBlock(world, { txs, coinbase, time, nonce = null, miner }) {
  const txids = [coinbase.id, ...txs.map((t) => t.id)]
  const byId = Object.fromEntries([coinbase, ...txs].map((t) => [t.id, t]))
  return {
    miner,
    txids,
    txs: byId,
    header: { prev: tipHash(world), commit: commitment(txids), time, target: KIT.target, nonce },
  }
}

/** Fees of the non-coinbase cards in a block, measured against the UTXO set before it. */
export function blockFees(world, block) {
  return block.txids.slice(1).reduce((n, id) => n + txFee(world, block.txs[id]), 0)
}

/**
 * The Block Validation sheet.
 * Returns { prev, pow, commit, txs, coinbase, fees, reward, claimed, hash, ok }.
 */
export function checkBlock(world, block) {
  const cb = block.txs[block.txids[0]]
  const cards = block.txids.slice(1).map((id) => block.txs[id])
  const seen = new Set()
  let txsOk = cards.length <= KIT.blockSlots
  for (const tx of cards) {
    if (!tx || tx.coinbase || !checkTx(world, tx, { ignoreMempool: true }).ok) txsOk = false
    for (const o of tx?.inputs || []) {
      if (seen.has(o)) txsOk = false // two cards in one block spending the same coin
      seen.add(o)
    }
  }
  const fees = txsOk ? blockFees(world, block) : 0
  const reward = KIT.subsidy + fees
  const claimed = cb?.coinbase ? outputSum(cb) : Infinity
  const h = block.header.nonce == null ? null : headerHash(block.header)
  const result = {
    prev: block.header.prev === tipHash(world),
    pow: h != null && block.header.target === KIT.target && h < KIT.target,
    commit: block.header.commit === commitment(block.txids),
    txs: txsOk,
    coinbase: !!cb?.coinbase && claimed <= reward && cb.outputs.every((o) => o.lock),
    fees,
    reward,
    claimed,
    hash: h,
  }
  result.ok = result.prev && result.pow && result.commit && result.txs && result.coinbase
  return result
}

/** The right answers to the Block Validation sheet. */
export function blockSheetAnswers(world, block) {
  const c = checkBlock(world, block)
  return { prev: c.prev && c.commit, pow: c.pow, txs: c.txs, coinbase: c.coinbase }
}

/**
 * "After you validate": which coins leave the UTXO SET, which new coins go in,
 * and which cards leave the MEMPOOL.
 */
export function utxoDiff(world, block) {
  const remove = []
  const add = []
  for (const id of block.txids) {
    const tx = block.txs[id]
    remove.push(...tx.inputs)
    tx.outputs.forEach((out, n) => add.push({ op: op(id, n), value: Number(out.value), owner: out.lock }))
  }
  const spent = new Set(remove)
  const included = new Set(block.txids)
  // Cards still waiting that spend a coin this block used are now invalid too.
  const mempool = world.mempool.filter(
    (id) => included.has(id) || world.txs[id].inputs.some((o) => spent.has(o)),
  )
  return { remove, add, mempool }
}

/** Accept a valid block: update the UTXO SET, MEMPOOL and chain. Invalid blocks change nothing. */
export function applyBlock(world, block) {
  if (!checkBlock(world, block).ok) return world
  const diff = utxoDiff(world, block)
  const utxos = { ...world.utxos }
  for (const o of diff.remove) delete utxos[o]
  for (const c of diff.add) utxos[c.op] = { op: c.op, value: c.value, owner: c.owner }
  const h = height(world) + 1
  const txs = { ...world.txs }
  for (const id of block.txids) txs[id] = { ...block.txs[id], blockHeight: h }
  return {
    ...world,
    utxos,
    txs,
    mempool: world.mempool.filter((id) => !diff.mempool.includes(id)),
    chain: [...world.chain, { height: h, hash: headerHash(block.header), txids: block.txids, header: block.header, miner: block.miner }],
  }
}

export function confirmations(world, txid) {
  const tx = world.txs[txid]
  if (!tx || tx.blockHeight == null) return 0
  return height(world) - tx.blockHeight + 1
}

/** Put a validated card into the MEMPOOL basket. */
export function addToMempool(world, tx) {
  if (!checkTx(world, tx).ok) return world
  return { ...world, txs: { ...world.txs, [tx.id]: tx }, mempool: [...world.mempool, tx.id] }
}
