/*
  The Bitcoin Mission — Alice sends Bob 50,000 sats, played the way the paper
  LARP kit is played. Six stages, one reducer:

    create     → fill in the transaction card (coins, lock stickers, key stickers)
    relay      → pass the card from peer to peer until every node has it
    validate   → Transaction Validation sheet; good cards go in the MEMPOOL basket
    build      → block txids card, coinbase card, header card, handheld miner
    blockcheck → Block Validation sheet for two blocks (one breaks the rules)
    update     → After You Validate: fix the UTXO SET and MEMPOOL baskets
    confirm    → watch the payment get 1, then 2 confirmations
    done       → recap, XP and badge

  Everything is simulated game data. Mistakes never end the mission: they
  add to `mistakes`, explain what went wrong, and let the player try again.
  The whole state is plain JSON so it can be saved after every action and
  resumed later (lib/storage.js).
*/
import {
  KIT, makeWorld, checkTx, txSheetAnswers, relay, makeCoinbase, makeBlock, checkBlock,
  blockSheetAnswers, blockFees, utxoDiff, applyBlock, findNonce, grind, commitment, tipHash,
  addToMempool, height, inputSum,
} from './kit'

export const MISSION_ID = 'mission'
export const MISSION_VERSION = 1
export const PAY = 50000
export const FEES = [500, 1000, 2000]

export const STAGES = ['create', 'relay', 'validate', 'build', 'blockcheck', 'update', 'confirm']

export const PLAYERS = [
  { id: 'alice', name: 'Alice', emoji: '👩🏾', lock: { hex: '#2f6bff' } },
  { id: 'bob', name: 'Bob', emoji: '👨🏾', lock: { hex: '#22b573' } },
  { id: 'carol', name: 'Carol', emoji: '👩🏾‍🦱', lock: { hex: '#e5383b' } },
  { id: 'dave', name: 'Dave', emoji: '🧔🏾', lock: { hex: '#f2b418' } },
  { id: 'mallory', name: 'Mallory', emoji: '😈', lock: { hex: '#8e5cff' } },
  { id: 'miner', name: 'You (miner)', emoji: '⛏️', lock: { hex: '#ff8a1f' } },
  { id: 'sneaky', name: 'Sneaky Pool', emoji: '🦹🏾', lock: { hex: '#16c1c9' } },
  { id: 'other', name: 'Kano Pool', emoji: '🏭', lock: { hex: '#e83fd1' } },
]

/** The peer-to-peer network for the relay stage (x/y on a 100×60 board). */
export const NETWORK = {
  nodes: [
    { id: 'alice', label: 'Alice', x: 10, y: 30 },
    { id: 'n1', label: 'Lagos', x: 34, y: 10 },
    { id: 'n2', label: 'Abuja', x: 34, y: 50 },
    { id: 'n3', label: 'Ibadan', x: 62, y: 12 },
    { id: 'n4', label: 'Enugu', x: 62, y: 50 },
    { id: 'bob', label: 'Bob', x: 90, y: 30 },
  ],
  edges: [['alice', 'n1'], ['alice', 'n2'], ['n1', 'n3'], ['n2', 'n4'], ['n3', 'n4'], ['n3', 'bob']],
}

const START_COINS = [
  { txid: 'f1', n: 0, value: 30000, owner: 'alice' },
  { txid: 'f2', n: 1, value: 25000, owner: 'alice' },
  { txid: 'f3', n: 0, value: 8000, owner: 'alice' },
  { txid: 'f4', n: 0, value: 12000, owner: 'bob' },
  { txid: 'f5', n: 0, value: 40000, owner: 'carol' },
  { txid: 'f6', n: 1, value: 15000, owner: 'dave' },
]

/* ---------- other people's cards ---------- */

function sign(tx, signer) {
  return { ...tx, sigs: Object.fromEntries(tx.inputs.map((o) => [o, signer])) }
}

/** Dave → Bob, already waiting in the MEMPOOL when the mission starts. */
const DAVE_TX = sign({ id: 'tdave', inputs: ['f6:1'], outputs: [{ value: 6000, lock: 'bob' }, { value: 8500, lock: 'dave' }] }, 'dave')
/** Carol → Dave: honest. */
const CAROL_TX = sign({ id: 'tcarol', inputs: ['f5:0'], outputs: [{ value: 20000, lock: 'dave' }, { value: 19000, lock: 'carol' }] }, 'carol')
/** Mallory signs Bob's coin with her own key: a forgery. */
const FORGED_TX = sign({ id: 'tforge', inputs: ['f4:0'], outputs: [{ value: 11500, lock: 'mallory' }] }, 'mallory')

/** A second card spending one of the coins Alice already used — the double-spend. */
export function doubleSpendOf(world, aliceTx) {
  const o = aliceTx.inputs[0]
  const value = world.utxos[o].value - 500
  return sign({ id: 'tdouble', inputs: [o], outputs: [{ value, lock: 'mallory' }] }, 'alice')
}

/* ---------- state ---------- */

export function newMission() {
  let world = makeWorld({ players: PLAYERS, coins: START_COINS })
  world = addToMempool(world, DAVE_TX)
  return {
    version: MISSION_VERSION,
    stage: 'brief',
    world,
    draft: { inputs: [], locks: [null, null], sigs: {}, fee: 1000 },
    aliceTx: null,
    relay: { have: ['alice'], relays: 0 },
    validate: { queue: [], idx: 0, answers: {}, rejected: [] },
    build: freshBuild(),
    blockcheck: { blocks: [], idx: 0, answers: {}, revealed: {} },
    update: { removed: [], added: [], cleared: [], block: null },
    confirm: { extra: false },
    mistakes: Object.fromEntries(STAGES.map((s) => [s, 0])),
    feedback: null,
    choices: {},
  }
}

function freshBuild() {
  return {
    picked: [],
    coinbase: { value: null, lock: null },
    header: { prev: null, commit: null, time: null, nonce: null },
    loaded: false,
    rig: { tries: 0, lowest: null, bestNonce: null, next: 0 },
  }
}

/* ---------- derived ---------- */

/** The transaction card Alice is filling in right now (change is worked out for her). */
export function draftTx(m) {
  const { inputs, locks, sigs, fee } = m.draft
  const inSum = inputSum(m.world, { inputs })
  const change = inSum - PAY - fee
  const outputs = [{ value: PAY, lock: locks[0] }]
  if (change > 0) outputs.push({ value: change, lock: locks[1] })
  return { id: 'talice', inputs, outputs, sigs, change, inSum }
}

export function rewardFor(m) {
  const txs = m.build.picked.map((id) => m.world.txs[id])
  return KIT.subsidy + txs.reduce((n, t) => n + (inputSum(m.world, t) - t.outputs.reduce((a, o) => a + o.value, 0)), 0)
}

/** The block the player is building, as it stands. */
export function playerBlock(m) {
  const b = m.build
  const coinbase = makeCoinbase(height(m.world) + 1, b.coinbase.value ?? 0, b.coinbase.lock)
  const block = makeBlock(m.world, {
    txs: b.picked.map((id) => m.world.txs[id]), coinbase, time: b.header.time, nonce: b.header.nonce, miner: 'miner',
  })
  block.header = { ...block.header, prev: b.header.prev, commit: b.header.commit }
  return block
}

/** Sneaky Pool's block: a real proof-of-work, but it pays itself far too much. */
export function rivalBlock(world) {
  const coinbase = makeCoinbase(height(world) + 1, 20000, 'sneaky')
  const txs = world.mempool.filter((id) => id === 'tcarol').map((id) => world.txs[id])
  const block = makeBlock(world, { txs, coinbase, time: '12:31', miner: 'sneaky' })
  block.header.nonce = findNonce(block.header, 7)
  return block
}

/** Another miner's block on top, so Bob sees a second confirmation. */
function nextBlock(world) {
  const txs = world.mempool.slice(0, KIT.blockSlots).map((id) => world.txs[id])
  const fees = txs.reduce((n, t) => n + (inputSum(world, t) - t.outputs.reduce((a, o) => a + o.value, 0)), 0)
  const coinbase = makeCoinbase(height(world) + 1, KIT.subsidy + fees, 'other')
  const block = makeBlock(world, { txs, coinbase, time: '12:44', miner: 'other' })
  block.header.nonce = findNonce(block.header, 3)
  return applyBlock(world, block)
}

export const totalMistakes = (m) => Object.values(m.mistakes).reduce((a, b) => a + b, 0)

/** XP: 300 for a clean run, 20 less per mistake, never below 100. */
export function scoreOf(m) {
  return Math.max(100, 300 - 20 * totalMistakes(m))
}

/* ---------- reducer ---------- */

const oops = (m, stage, code, data) => ({
  ...m,
  mistakes: { ...m.mistakes, [stage]: m.mistakes[stage] + 1 },
  feedback: { tone: 'oops', code, ...data },
})
const say = (m, code, data) => ({ ...m, feedback: { tone: 'good', code, ...data } })

export function missionReduce(m, a) {
  switch (a.type) {
    case 'start':
      return m.stage === 'brief' ? say({ ...m, stage: 'create' }, 'start') : m
    case 'dismiss':
      return { ...m, feedback: null }
    case 'reset':
      return newMission()
    default:
      break
  }
  const handler = STAGE_HANDLERS[m.stage]
  return handler ? handler(m, a) : m
}

const STAGE_HANDLERS = {
  /* -------------------------------------------------------- 1. create */
  create(m, a) {
    const d = m.draft
    switch (a.type) {
      case 'addInput':
        if (d.inputs.includes(a.op) || !m.world.utxos[a.op]) return m
        return { ...m, draft: { ...d, inputs: [...d.inputs, a.op] }, feedback: null }
      case 'removeInput': {
        const { [a.op]: _, ...sigs } = d.sigs
        return { ...m, draft: { ...d, inputs: d.inputs.filter((o) => o !== a.op), sigs } }
      }
      case 'setLock': {
        const locks = [...d.locks]
        locks[a.out] = a.lock
        return { ...m, draft: { ...d, locks }, feedback: null }
      }
      case 'sign':
        if (!d.inputs.includes(a.op)) return m
        return { ...m, draft: { ...d, sigs: { ...d.sigs, [a.op]: a.signer } }, feedback: null }
      case 'setFee':
        return { ...m, draft: { ...d, fee: a.fee } }
      case 'send': {
        const tx = draftTx(m)
        if (tx.change < 0) return oops(m, 'create', 'short', { need: -tx.change })
        if (tx.outputs[0].lock && tx.outputs[0].lock !== 'bob') return oops(m, 'create', 'wrong-payee', { lock: tx.outputs[0].lock })
        if (tx.outputs[1] && tx.outputs[1].lock && tx.outputs[1].lock !== 'alice') return oops(m, 'create', 'wrong-change', { lock: tx.outputs[1].lock })
        const check = checkTx(m.world, tx)
        if (!check.ok) return oops(m, 'create', check.problems[0].code, check.problems[0])
        const { change, inSum, ...card } = tx
        return say(
          { ...m, stage: 'relay', aliceTx: card, choices: { ...m.choices, fee: d.fee, inputs: d.inputs.length, change } },
          'sent',
        )
      }
      default:
        return m
    }
  },

  /* --------------------------------------------------------- 2. relay */
  relay(m, a) {
    if (a.type !== 'relay') return m
    if (!m.relay.have.includes(a.node)) return oops(m, 'relay', 'no-card', { node: a.node })
    const have = relay(NETWORK, m.relay.have, a.node)
    const next = { ...m, relay: { have, relays: m.relay.relays + 1 }, feedback: null }
    if (have.length < NETWORK.nodes.length) return next
    const queue = [m.aliceTx, CAROL_TX, doubleSpendOf(m.world, m.aliceTx), FORGED_TX]
    return say({ ...next, stage: 'validate', validate: { queue, idx: 0, answers: {}, rejected: [] }, choices: { ...m.choices, relays: next.relay.relays } }, 'relayed')
  },

  /* ------------------------------------------------------ 3. validate */
  validate(m, a) {
    const v = m.validate
    const tx = v.queue[v.idx]
    switch (a.type) {
      case 'answer':
        return { ...m, validate: { ...v, answers: { ...v.answers, [a.q]: a.value } }, feedback: null }
      case 'decide': {
        const truth = txSheetAnswers(m.world, tx)
        const wrong = Object.keys(truth).filter((q) => v.answers[q] !== truth[q])
        if (Object.keys(truth).some((q) => v.answers[q] == null)) return { ...m, feedback: { tone: 'info', code: 'answer-all' } }
        if (wrong.length) {
          return oops({ ...m, validate: { ...v, answers: {} } }, 'validate', 'sheet-wrong', { wrong, txid: tx.id })
        }
        const valid = Object.values(truth).every(Boolean)
        const world = valid ? addToMempool(m.world, tx) : m.world
        const rejected = valid ? v.rejected : [...v.rejected, tx]
        const idx = v.idx + 1
        const stageDone = idx >= v.queue.length
        const next = {
          ...m,
          world,
          validate: { ...v, idx, answers: {}, rejected },
          stage: stageDone ? 'build' : 'validate',
          build: stageDone ? { ...freshBuild(), header: { ...freshBuild().header, time: '12:34' } } : m.build,
        }
        const reason = valid ? null : checkTx(m.world, tx).problems[0].code
        return say(next, valid ? 'tx-valid' : 'tx-invalid', { txid: tx.id, reason, stageDone })
      }
      default:
        return m
    }
  },

  /* --------------------------------------------------------- 4. build */
  build(m, a) {
    const b = m.build
    // Changing what's in the block changes the commitment, so old work no longer counts.
    const reworked = (patch) => ({
      ...m,
      build: { ...b, ...patch, header: { ...b.header, commit: null, nonce: null }, loaded: false, rig: { ...freshBuild().rig } },
      feedback: null,
    })
    switch (a.type) {
      case 'pick': {
        if (b.picked.includes(a.txid)) return m
        if (!m.world.mempool.includes(a.txid)) return oops(m, 'build', 'not-in-mempool', { txid: a.txid })
        if (b.picked.length >= KIT.blockSlots) return oops(m, 'build', 'block-full')
        return reworked({ picked: [...b.picked, a.txid], coinbase: { ...b.coinbase, value: null } })
      }
      case 'unpick':
        return reworked({ picked: b.picked.filter((id) => id !== a.txid), coinbase: { ...b.coinbase, value: null } })
      case 'claim': {
        const max = rewardFor(m)
        if (a.value > max) return oops(m, 'build', 'greedy', { max, value: a.value })
        return reworked({ coinbase: { ...b.coinbase, value: a.value } })
      }
      case 'lockCoinbase':
        if (a.lock !== 'miner') return oops(m, 'build', 'coinbase-lock', { lock: a.lock })
        return reworked({ coinbase: { ...b.coinbase, lock: a.lock } })
      case 'fillPrev':
        return { ...m, build: { ...b, header: { ...b.header, prev: tipHash(m.world) } } }
      case 'fillCommit': {
        if (b.coinbase.value == null || !b.coinbase.lock) return { ...m, feedback: { tone: 'info', code: 'coinbase-first' } }
        const txids = playerBlock(m).txids
        return { ...m, build: { ...b, header: { ...b.header, commit: commitment(txids) } } }
      }
      case 'load':
        if (b.header.prev == null || b.header.commit == null) return { ...m, feedback: { tone: 'info', code: 'header-first' } }
        return { ...m, build: { ...b, loaded: true }, feedback: null }
      case 'mine': {
        if (!b.loaded) return m
        const header = { ...playerBlock(m).header }
        const r = grind(header, b.rig.next, a.tries)
        const better = b.rig.lowest == null || r.lowest < b.rig.lowest
        return {
          ...m,
          build: {
            ...b,
            rig: {
              tries: b.rig.tries + r.tries,
              lowest: better ? r.lowest : b.rig.lowest,
              bestNonce: better ? r.bestNonce : b.rig.bestNonce,
              next: r.next,
            },
          },
        }
      }
      case 'writeNonce':
        if (b.rig.lowest == null || b.rig.lowest >= KIT.target) return oops(m, 'build', 'not-yet')
        return { ...m, build: { ...b, header: { ...b.header, nonce: b.rig.bestNonce } }, feedback: null }
      case 'share': {
        if (!b.picked.includes('talice')) return oops(m, 'build', 'forgot-alice')
        const mine = playerBlock(m)
        const check = checkBlock(m.world, mine)
        if (!check.ok) return { ...m, feedback: { tone: 'info', code: 'block-incomplete' } }
        return say(
          {
            ...m,
            stage: 'blockcheck',
            blockcheck: { blocks: [rivalBlock(m.world), mine], idx: 0, answers: {}, revealed: {} },
            choices: { ...m.choices, picked: b.picked.length, claimed: b.coinbase.value, tries: b.rig.tries },
          },
          'shared',
        )
      }
      default:
        return m
    }
  },

  /* ---------------------------------------------------- 5. blockcheck */
  blockcheck(m, a) {
    const c = m.blockcheck
    const block = c.blocks[c.idx]
    switch (a.type) {
      case 'reveal':
        return { ...m, blockcheck: { ...c, revealed: { ...c.revealed, [a.what]: true } } }
      case 'answer':
        return { ...m, blockcheck: { ...c, answers: { ...c.answers, [a.q]: a.value } }, feedback: null }
      case 'decide': {
        const truth = blockSheetAnswers(m.world, block)
        if (Object.keys(truth).some((q) => c.answers[q] == null)) return { ...m, feedback: { tone: 'info', code: 'answer-all' } }
        const wrong = Object.keys(truth).filter((q) => c.answers[q] !== truth[q])
        if (wrong.length) return oops({ ...m, blockcheck: { ...c, answers: {} } }, 'blockcheck', 'sheet-wrong', { wrong })
        const ok = checkBlock(m.world, block).ok
        const idx = c.idx + 1
        if (idx < c.blocks.length) {
          return say({ ...m, blockcheck: { ...c, idx, answers: {}, revealed: {} } }, ok ? 'block-ok' : 'block-bad', { miner: block.miner })
        }
        const accepted = c.blocks.find((bl) => checkBlock(m.world, bl).ok)
        return say(
          { ...m, stage: 'update', update: { removed: [], added: [], cleared: [], block: accepted } },
          ok ? 'block-ok' : 'block-bad',
          { miner: block.miner, stageDone: true },
        )
      }
      default:
        return m
    }
  },

  /* -------------------------------------------------------- 6. update */
  update(m, a) {
    const u = m.update
    const diff = utxoDiff(m.world, u.block)
    let next
    switch (a.type) {
      case 'removeUtxo':
        if (u.removed.includes(a.op)) return m
        if (!diff.remove.includes(a.op)) return oops(m, 'update', 'still-unspent', { op: a.op })
        next = { ...m, update: { ...u, removed: [...u.removed, a.op] }, feedback: null }
        break
      case 'addUtxo':
        if (u.added.includes(a.op)) return m
        if (!diff.add.some((c) => c.op === a.op)) return m
        next = { ...m, update: { ...u, added: [...u.added, a.op] }, feedback: null }
        break
      case 'clearMempool':
        if (u.cleared.includes(a.txid)) return m
        if (!diff.mempool.includes(a.txid)) return oops(m, 'update', 'still-waiting', { txid: a.txid })
        next = { ...m, update: { ...u, cleared: [...u.cleared, a.txid] }, feedback: null }
        break
      default:
        return m
    }
    const nu = next.update
    const done = nu.removed.length === diff.remove.length && nu.added.length === diff.add.length && nu.cleared.length === diff.mempool.length
    if (!done) return next
    return say({ ...next, stage: 'confirm', world: applyBlock(m.world, u.block) }, 'updated')
  },

  /* ------------------------------------------------------- 7. confirm */
  confirm(m, a) {
    if (a.type === 'nextBlock' && !m.confirm.extra) {
      return say({ ...m, world: nextBlock(m.world), confirm: { extra: true } }, 'second-conf')
    }
    if (a.type === 'finish' && m.confirm.extra) return { ...m, stage: 'done', feedback: null }
    return m
  },
}

/** Progress for the header: index of the current stage among STAGES. */
export function stageIndex(m) {
  if (m.stage === 'brief') return -1
  if (m.stage === 'done') return STAGES.length
  return STAGES.indexOf(m.stage)
}

export { blockFees, checkBlock, utxoDiff }
