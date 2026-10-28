import { describe, it, expect } from 'vitest'
import {
  newMission, missionReduce, NETWORK, rewardFor, scoreOf, totalMistakes, utxoDiff, checkBlock,
} from './mission'
import { KIT, txSheetAnswers, blockSheetAnswers, confirmations } from './kit'

const run = (m, ...actions) => actions.reduce(missionReduce, m)

/** Fill Alice's card correctly: two coins, Bob's lock, Alice's change lock, both signed. */
function createDone() {
  let m = run(newMission(), { type: 'start' })
  m = run(m,
    { type: 'addInput', op: 'f1:0' }, { type: 'addInput', op: 'f2:1' },
    { type: 'setLock', out: 0, lock: 'bob' }, { type: 'setLock', out: 1, lock: 'alice' },
    { type: 'sign', op: 'f1:0', signer: 'alice' }, { type: 'sign', op: 'f2:1', signer: 'alice' },
    { type: 'send' })
  return m
}

function relayDone() {
  return run(createDone(), { type: 'relay', node: 'alice' }, { type: 'relay', node: 'n1' }, { type: 'relay', node: 'n3' })
}

/** Answer each sheet correctly. */
function validateDone() {
  let m = relayDone()
  while (m.stage === 'validate') {
    const truth = txSheetAnswers(m.world, m.validate.queue[m.validate.idx])
    m = run(m, ...Object.entries(truth).map(([q, value]) => ({ type: 'answer', q, value })), { type: 'decide' })
  }
  return m
}

function buildDone() {
  let m = validateDone()
  m = run(m, { type: 'pick', txid: 'talice' }, { type: 'pick', txid: 'tcarol' })
  m = run(m, { type: 'claim', value: rewardFor(m) }, { type: 'lockCoinbase', lock: 'miner' })
  m = run(m, { type: 'fillPrev' }, { type: 'fillCommit' }, { type: 'load' })
  for (let i = 0; i < 400 && (m.build.rig.lowest == null || m.build.rig.lowest >= KIT.target); i++) m = run(m, { type: 'mine', tries: 12 })
  return run(m, { type: 'writeNonce' }, { type: 'share' })
}

function blockcheckDone() {
  let m = buildDone()
  while (m.stage === 'blockcheck') {
    const truth = blockSheetAnswers(m.world, m.blockcheck.blocks[m.blockcheck.idx])
    m = run(m, ...Object.entries(truth).map(([q, value]) => ({ type: 'answer', q, value })), { type: 'decide' })
  }
  return m
}

describe('stage 1 — create', () => {
  it('sends a correct card and moves to relay', () => {
    const m = createDone()
    expect(m.stage).toBe('relay')
    expect(m.aliceTx.outputs).toEqual([{ value: 50000, lock: 'bob' }, { value: 4000, lock: 'alice' }])
    expect(totalMistakes(m)).toBe(0)
  })

  it('explains, counts a mistake and stays put when the card is wrong', () => {
    let m = run(newMission(), { type: 'start' }, { type: 'addInput', op: 'f1:0' }, { type: 'send' })
    expect(m.stage).toBe('create')
    expect(m.feedback.code).toBe('short')
    m = run(m, { type: 'addInput', op: 'f2:1' }, { type: 'setLock', out: 0, lock: 'carol' }, { type: 'send' })
    expect(m.feedback.code).toBe('wrong-payee')
    m = run(m, { type: 'setLock', out: 0, lock: 'bob' }, { type: 'setLock', out: 1, lock: 'alice' }, { type: 'send' })
    expect(m.feedback.code).toBe('unsigned')
    expect(m.mistakes.create).toBe(3)
  })

  it('rejects signing someone else’s coin with Alice’s key', () => {
    const m = run(newMission(), { type: 'start' },
      { type: 'addInput', op: 'f5:0' }, { type: 'addInput', op: 'f2:1' },
      { type: 'setLock', out: 0, lock: 'bob' }, { type: 'setLock', out: 1, lock: 'alice' },
      { type: 'sign', op: 'f5:0', signer: 'alice' }, { type: 'sign', op: 'f2:1', signer: 'alice' }, { type: 'send' })
    expect(m.stage).toBe('create')
    expect(m.feedback.code).toBe('wrong-key')
  })
})

describe('stage 2 — relay', () => {
  it('only spreads from nodes that have the card and finishes when every node has it', () => {
    let m = createDone()
    m = run(m, { type: 'relay', node: 'bob' })
    expect(m.feedback.code).toBe('no-card')
    m = run(m, { type: 'relay', node: 'alice' }, { type: 'relay', node: 'n1' })
    expect(m.stage).toBe('relay')
    m = run(m, { type: 'relay', node: 'n3' })
    expect(m.relay.have).toHaveLength(NETWORK.nodes.length)
    expect(m.stage).toBe('validate')
  })
})

describe('stage 3 — validate', () => {
  it('puts honest cards in the mempool and always keeps the double-spend out', () => {
    const m = validateDone()
    expect(m.stage).toBe('build')
    expect(m.world.mempool.sort()).toEqual(['talice', 'tcarol', 'tdave'])
    expect(m.validate.rejected.map((t) => t.id).sort()).toEqual(['tdouble', 'tforge'])
  })

  it('a wrong sheet is a safe mistake: the double-spend is never accepted', () => {
    let m = relayDone()
    // Alice's card is fine.
    m = run(m, ...['coins', 'keys', 'sums'].map((q) => ({ type: 'answer', q, value: true })), { type: 'decide' })
    // Carol's card is fine.
    m = run(m, ...['coins', 'keys', 'sums'].map((q) => ({ type: 'answer', q, value: true })), { type: 'decide' })
    // The double-spend — claim everything is fine.
    expect(m.validate.queue[m.validate.idx].id).toBe('tdouble')
    m = run(m, ...['coins', 'keys', 'sums'].map((q) => ({ type: 'answer', q, value: true })), { type: 'decide' })
    expect(m.feedback).toMatchObject({ tone: 'oops', code: 'sheet-wrong', wrong: ['coins'] })
    expect(m.world.mempool).not.toContain('tdouble')
    expect(m.validate.queue[m.validate.idx].id).toBe('tdouble')
  })
})

describe('stage 4 — build and mine', () => {
  it('refuses rejected cards and greedy coinbases, and resets the work when the block changes', () => {
    let m = validateDone()
    m = run(m, { type: 'pick', txid: 'tdouble' })
    expect(m.feedback.code).toBe('not-in-mempool')
    m = run(m, { type: 'pick', txid: 'talice' })
    m = run(m, { type: 'claim', value: rewardFor(m) + 1 })
    expect(m.feedback.code).toBe('greedy')
    m = run(m, { type: 'claim', value: rewardFor(m) }, { type: 'lockCoinbase', lock: 'miner' }, { type: 'fillPrev' }, { type: 'fillCommit' })
    expect(m.build.header.commit).not.toBeNull()
    m = run(m, { type: 'pick', txid: 'tcarol' })
    expect(m.build.header.commit).toBeNull()
    expect(m.build.coinbase.value).toBeNull()
  })

  it('will not share a block without Alice’s card or before a winning nonce', () => {
    let m = validateDone()
    m = run(m, { type: 'pick', txid: 'tcarol' }, { type: 'share' })
    expect(m.feedback.code).toBe('forgot-alice')
    m = run(m, { type: 'pick', txid: 'talice' }, { type: 'writeNonce' })
    expect(m.feedback.code).toBe('not-yet')
  })

  it('shares a valid block', () => {
    const m = buildDone()
    expect(m.stage).toBe('blockcheck')
    const [rival, mine] = m.blockcheck.blocks
    expect(checkBlock(m.world, mine).ok).toBe(true)
    const r = checkBlock(m.world, rival)
    expect(r.pow).toBe(true)
    expect(r.coinbase).toBe(false)
  })
})

describe('stages 5–7 — block check, update, confirm', () => {
  it('rejects the rival block, accepts ours, updates the baskets and confirms the payment', () => {
    let m = blockcheckDone()
    expect(m.stage).toBe('update')
    expect(m.update.block.miner).toBe('miner')

    const diff = utxoDiff(m.world, m.update.block)
    m = run(m, { type: 'removeUtxo', op: 'f3:0' })
    expect(m.feedback.code).toBe('still-unspent')
    m = run(m,
      ...diff.remove.map((op) => ({ type: 'removeUtxo', op })),
      ...diff.add.map((c) => ({ type: 'addUtxo', op: c.op })),
      ...diff.mempool.map((txid) => ({ type: 'clearMempool', txid })))
    expect(m.stage).toBe('confirm')
    expect(confirmations(m.world, 'talice')).toBe(1)
    expect(m.world.utxos['talice:0']).toMatchObject({ value: 50000, owner: 'bob' })

    m = run(m, { type: 'finish' })
    expect(m.stage).toBe('confirm') // must see the second confirmation first
    m = run(m, { type: 'nextBlock' })
    expect(confirmations(m.world, 'talice')).toBe(2)
    m = run(m, { type: 'finish' })
    expect(m.stage).toBe('done')
  })
})

describe('scoring', () => {
  it('awards 300 XP for a clean run, 20 less per mistake, never below 100', () => {
    const m = newMission()
    expect(scoreOf(m)).toBe(300)
    expect(scoreOf({ ...m, mistakes: { ...m.mistakes, create: 3 } })).toBe(240)
    expect(scoreOf({ ...m, mistakes: { ...m.mistakes, create: 50 } })).toBe(100)
  })

  it('a full clean run scores 300', () => {
    let m = blockcheckDone()
    const diff = utxoDiff(m.world, m.update.block)
    m = run(m,
      ...diff.remove.map((op) => ({ type: 'removeUtxo', op })),
      ...diff.add.map((c) => ({ type: 'addUtxo', op: c.op })),
      ...diff.mempool.map((txid) => ({ type: 'clearMempool', txid })),
      { type: 'nextBlock' }, { type: 'finish' })
    expect(m.stage).toBe('done')
    expect(scoreOf(m)).toBe(300)
  })

  it('state survives a JSON round-trip (save + resume)', () => {
    const m = buildDone()
    const resumed = JSON.parse(JSON.stringify(m))
    const truth = blockSheetAnswers(resumed.world, resumed.blockcheck.blocks[0])
    const next = run(resumed, ...Object.entries(truth).map(([q, value]) => ({ type: 'answer', q, value })), { type: 'decide' })
    expect(next.blockcheck.idx).toBe(1)
  })
})

describe('card nicknames', () => {
  it('every coin and card in the mission has a different nickname', async () => {
    const { txName } = await import('./engine')
    const m = blockcheckDone()
    const ids = new Set([
      ...Object.keys(m.world.utxos).map((o) => o.split(':')[0]),
      ...m.validate.queue.map((t) => t.id),
      ...m.blockcheck.blocks.flatMap((b) => b.txids),
      'cb2-other',
    ])
    const names = [...ids].map(txName)
    expect(new Set(names).size).toBe(names.length)
  })
})

describe('Bitty moves on', () => {
  it('points at Send once every input is signed, not at the key', async () => {
    const { coachSteps } = await import('./missionText')
    const currentStep = (steps, state) => steps.find((st) => !st.done(state, {}))
    let m = run(newMission(), { type: 'start' },
      { type: 'addInput', op: 'f1:0' }, { type: 'addInput', op: 'f2:1' },
      { type: 'setLock', out: 0, lock: 'bob' }, { type: 'setLock', out: 1, lock: 'alice' },
      { type: 'sign', op: 'f1:0', signer: 'alice' })
    expect(currentStep(coachSteps('create'), m).point).toBe('keys')
    m = run(m, { type: 'sign', op: 'f2:1', signer: 'alice' })
    expect(currentStep(coachSteps('create'), m).point).toBe('send')
  })
})
