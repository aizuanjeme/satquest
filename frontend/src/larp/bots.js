/*
  Bot players for solo LARP. Each tick they may:
   - send a payment to someone (holders), at a fee rate drawn from the
     chapter's traffic profile — this is what fills the mempool;
   - grind nonces on their own block template (miners), at their hashrate.

  Bots only ever produce engine actions; the engine still validates them.
*/
import {
  spendableCoins, buildPayment, bestTemplate, headerOf, blockHash, meetsTarget,
} from './engine'

const rand = (min, max) => min + Math.random() * (max - min)
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]

/** Mempool traffic presets: chance a bot sends per tick, and its fee-rate range. */
export const TRAFFIC = {
  none: { chance: 0, rate: [1, 1] },
  calm: { chance: 0.02, rate: [2, 8] },
  busy: { chance: 0.07, rate: [6, 30] },
}

let nonceSeed = 0

/** One bot payment, or null if the bot can't afford one. */
export function botPayment(state, bot, { rate, to, amount } = {}) {
  const coins = spendableCoins(state, bot.id).sort((a, b) => b.value - a.value)
  if (!coins.length) return null
  const others = Object.values(state.players).filter((p) => p.id !== bot.id)
  // Loyal bots mostly trade inside their own group (free play teams).
  const sameTeam = others.filter((p) => p.team === bot.team)
  const payee = to || (bot.loyal && sameTeam.length && Math.random() < 0.8 ? pick(sameTeam) : pick(others))?.id
  if (!payee) return null
  const coin = coins[0]
  const r = rate ?? Math.round(rand(...TRAFFIC.calm.rate))
  const fee = Math.ceil(140 * r)
  const want = amount ?? Math.round(rand(0.15, 0.6) * coin.value / 100) * 100
  const value = Math.min(want, coin.value - fee - 400)
  if (value < 500) return null
  return buildPayment(state, { from: bot.id, inputs: [coin.id], to: payee, amount: value, rate: r, secret: bot.secret })
}

/**
 * Produce this tick's actions for all bots.
 *   traffic: key of TRAFFIC
 *   attempts: nonces each bot miner tries per tick (its hashrate)
 */
export function botTick(state, { traffic = 'calm', attempts = 6 } = {}) {
  const actions = []
  const profile = TRAFFIC[traffic] || TRAFFIC.calm
  const bots = Object.values(state.players).filter((p) => p.isBot)

  for (const bot of bots) {
    // Story characters (`quiet`) only act when their chapter's script says so.
    if (bot.role !== 'miner' && !bot.quiet && Math.random() < profile.chance) {
      const tx = botPayment(state, bot, { rate: Math.round(rand(...profile.rate)) })
      if (tx) actions.push({ type: 'broadcast', tx })
    }
  }

  // Miners: a pool shares one template; each bot miner is its own lottery ticket.
  for (const bot of bots.filter((b) => b.role === 'miner')) {
    const txids = bestTemplate(state, { prefer: bot.favourTeam ? bot.team : undefined })
    const header = headerOf(state, bot.id, txids)
    const tries = Math.round(attempts * (bot.hashrate || 1))
    for (let i = 0; i < tries; i++) {
      const nonce = nonceSeed++
      if (meetsTarget(blockHash(header, nonce), state.difficulty)) {
        actions.push({ type: 'block', miner: bot.id, txids, nonce })
        return actions // one block per tick is plenty
      }
    }
  }
  return actions
}
