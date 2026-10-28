import { describe, it, expect } from 'vitest'
import {
  createState, reduce, buildPayment, sign, txBody, checkTx, mineNow, spendableCoins, meetsTarget,
  headerOf, blockHash, confirmations,
} from './engine'

const world = () => createState({
  difficulty: 2,
  players: [
    { id: 'a', name: 'A', secret: 'sa', coins: [10000] },
    { id: 'b', name: 'B', secret: 'sb', coins: [5000] },
    { id: 'm', name: 'M', secret: 'sm', role: 'miner' },
  ],
})
const pay = (s, from, secret, rate = 5) =>
  buildPayment(s, { from, inputs: [spendableCoins(s, from)[0].id], to: 'b', amount: 4000, rate, secret })

describe('practice-round engine', () => {
  it('accepts an owner-signed payment and rejects a forgery', () => {
    const s = world()
    expect(checkTx(s, pay(s, 'a', 'sa')).ok).toBe(true)
    expect(checkTx(s, pay(s, 'a', 'sb')).reason).toBe('bad-signature')
  })

  it('replace-by-fee: a higher-fee card for the same coin replaces the first', () => {
    let s = world()
    s = reduce(s, { type: 'broadcast', tx: { ...pay(s, 'a', 'sa', 2), id: 'low' } })
    const coin = s.txs.low.inputs[0]
    const high = buildPayment(s, { from: 'a', inputs: [coin], to: 'b', amount: 4000, rate: 20, secret: 'sa' })
    s = reduce(s, { type: 'broadcast', tx: { ...high, id: 'high' } })
    expect(s.txs.low.status).toBe('replaced')
    expect(s.mempool).toEqual(['high'])
  })

  it('a block must meet the target, and spends become unspendable', () => {
    let s = world()
    s = reduce(s, { type: 'broadcast', tx: { ...pay(s, 'a', 'sa'), id: 't1' } })
    const header = headerOf(s, 'm', ['t1'])
    const bad = [...Array(200).keys()].find((n) => !meetsTarget(blockHash(header, n), s.difficulty))
    expect(reduce(s, { type: 'block', miner: 'm', txids: ['t1'], nonce: bad })).toBe(s)
    s = mineNow(s, 'm', ['t1'])
    expect(confirmations(s, 't1')).toBe(1)
    const again = { from: 'a', inputs: s.txs.t1.inputs, outputs: [{ to: 'a', value: 100 }] }
    expect(checkTx(s, { ...again, sig: sign('sa', txBody(again)) }).reason).toBe('spent-input')
  })
})
