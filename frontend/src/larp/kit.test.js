import { describe, it, expect } from 'vitest'
import {
  KIT, makeWorld, checkTx, txSheetAnswers, addToMempool, relay, makeCoinbase, makeBlock,
  checkBlock, applyBlock, utxoDiff, confirmations, findNonce, grind, headerHash, commitment,
} from './kit'

const players = ['alice', 'bob', 'carol', 'miner'].map((id) => ({ id, name: id, lock: { hex: '#000' } }))
const world0 = () => makeWorld({
  players,
  coins: [
    { txid: 'a', n: 0, value: 30000, owner: 'alice' },
    { txid: 'b', n: 1, value: 10000, owner: 'bob' },
  ],
})
const signed = (tx, who) => ({ ...tx, sigs: Object.fromEntries(tx.inputs.map((o) => [o, who])) })
const pay = signed({ id: 't1', inputs: ['a:0'], outputs: [{ value: 20000, lock: 'bob' }, { value: 9000, lock: 'alice' }] }, 'alice')

function mined(world, txs, claim, miner = 'miner') {
  const fees = txs.reduce((n, t) => n + checkTx(world, t, { ignoreMempool: true }).fee, 0)
  const block = makeBlock(world, { txs, coinbase: makeCoinbase(1, claim ?? KIT.subsidy + fees, miner), time: '12:00', miner })
  block.header.nonce = findNonce(block.header)
  return block
}

describe('transaction validation', () => {
  it('accepts a card whose coins exist, are signed by their owner and are not overspent', () => {
    const r = checkTx(world0(), pay)
    expect(r.ok).toBe(true)
    expect(r.fee).toBe(1000)
  })

  it('rejects a key sticker that does not match the lock (forgery)', () => {
    const r = checkTx(world0(), signed(pay, 'carol'))
    expect(r.ok).toBe(false)
    expect(r.problems.map((p) => p.code)).toContain('wrong-key')
  })

  it('rejects unsigned inputs, missing locks and coins that are not in the UTXO set', () => {
    expect(checkTx(world0(), { ...pay, sigs: {} }).problems[0].code).toBe('unsigned')
    expect(checkTx(world0(), { ...pay, outputs: [{ value: 100, lock: null }] }).problems.map((p) => p.code)).toContain('no-lock')
    expect(checkTx(world0(), signed({ ...pay, inputs: ['zz:0'] }, 'alice')).problems[0].code).toBe('missing')
  })

  it('rejects spending more than the inputs hold', () => {
    const r = checkTx(world0(), { ...pay, outputs: [{ value: 40000, lock: 'bob' }] })
    expect(r.problems.map((p) => p.code)).toContain('overspend')
  })

  it('always rejects a double-spend of a coin already used by a card in the mempool', () => {
    const w = addToMempool(world0(), pay)
    const again = signed({ id: 't2', inputs: ['a:0'], outputs: [{ value: 29000, lock: 'carol' }] }, 'alice')
    const r = checkTx(w, again)
    expect(r.ok).toBe(false)
    expect(r.problems.map((p) => p.code)).toContain('double-spend')
    expect(addToMempool(w, again).mempool).toEqual(['t1'])
    expect(txSheetAnswers(w, again)).toEqual({ coins: false, keys: true, sums: true })
  })

  it('rejects a coin that was already spent in a block', () => {
    const w = applyBlock(world0(), mined(world0(), [pay]))
    const again = signed({ id: 't3', inputs: ['a:0'], outputs: [{ value: 1000, lock: 'carol' }] }, 'alice')
    expect(checkTx(w, again).problems[0].code).toBe('missing')
  })
})

describe('relay', () => {
  const net = { edges: [['a', 'b'], ['b', 'c'], ['c', 'd']] }
  it('passes the card only to direct peers', () => {
    expect(relay(net, ['a'], 'a').sort()).toEqual(['a', 'b'])
    expect(relay(net, ['a', 'b'], 'b').sort()).toEqual(['a', 'b', 'c'])
  })
  it('does nothing from a node that does not have the card', () => {
    expect(relay(net, ['a'], 'c')).toEqual(['a'])
  })
})

describe('mining', () => {
  it('finds a nonce whose header hash is under the target', () => {
    const header = { prev: 1, commit: 2, time: '12:00', target: KIT.target, nonce: null }
    const nonce = findNonce(header)
    expect(headerHash({ ...header, nonce })).toBeLessThan(KIT.target)
  })
  it('grind reports the lowest hash and the nonce that made it', () => {
    const header = { prev: 1, commit: 2, time: '12:00', target: KIT.target }
    const r = grind(header, 0, 50)
    expect(headerHash({ ...header, nonce: r.bestNonce })).toBe(r.lowest)
    expect(r.next).toBe(50)
  })
})

describe('block validation', () => {
  it('accepts a valid block and updates the UTXO set, mempool and confirmations', () => {
    const w = addToMempool(world0(), pay)
    const block = mined(w, [pay])
    expect(checkBlock(w, block).ok).toBe(true)
    const after = applyBlock(w, block)
    expect(after.utxos['a:0']).toBeUndefined()
    expect(after.utxos['t1:0']).toMatchObject({ value: 20000, owner: 'bob' })
    expect(after.utxos[`${block.txids[0]}:0`].value).toBe(KIT.subsidy + 1000)
    expect(after.mempool).toEqual([])
    expect(confirmations(after, 't1')).toBe(1)
  })

  it('never accepts a block containing an invalid transaction', () => {
    const forged = signed(pay, 'carol')
    const block = mined(world0(), [forged], KIT.subsidy)
    const w = world0()
    expect(checkBlock(w, block).txs).toBe(false)
    expect(applyBlock(w, block)).toBe(w) // unchanged
    expect(applyBlock(w, block).chain).toHaveLength(1)
  })

  it('rejects two cards in one block spending the same coin', () => {
    const twin = signed({ id: 't9', inputs: ['a:0'], outputs: [{ value: 100, lock: 'carol' }] }, 'alice')
    expect(checkBlock(world0(), mined(world0(), [pay, twin], KIT.subsidy)).txs).toBe(false)
  })

  it('rejects a coinbase that claims more than reward + fees, even with valid proof-of-work', () => {
    const block = mined(world0(), [pay], KIT.subsidy + 1000 + 1)
    const c = checkBlock(world0(), block)
    expect(c.pow).toBe(true)
    expect(c.coinbase).toBe(false)
    expect(c.ok).toBe(false)
  })

  it('rejects bad proof-of-work, a wrong previous hash and a stale commitment', () => {
    const good = mined(world0(), [pay])
    const badNonce = { ...good, header: { ...good.header, nonce: [...Array(500).keys()].find((n) => headerHash({ ...good.header, nonce: n }) >= KIT.target) } }
    expect(checkBlock(world0(), badNonce).pow).toBe(false)
    expect(checkBlock(world0(), { ...good, header: { ...good.header, prev: 12345 } }).prev).toBe(false)
    expect(checkBlock(world0(), { ...good, header: { ...good.header, commit: (commitment(good.txids) + 1) % 100 } }).commit).toBe(false)
  })

  it('utxoDiff lists what to take out of and put into the baskets', () => {
    const w = addToMempool(world0(), pay)
    const block = mined(w, [pay])
    const d = utxoDiff(w, block)
    expect(d.remove).toEqual(['a:0'])
    expect(d.add.map((c) => c.op).sort()).toEqual([`${block.txids[0]}:0`, 't1:0', 't1:1'].sort())
    expect(d.mempool).toEqual(['t1'])
  })
})
