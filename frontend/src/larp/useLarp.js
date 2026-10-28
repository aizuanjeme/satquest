import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { reduceAll, headerOf, blockHash, meetsTarget, hashNumber } from './engine'
import { botTick } from './bots'
import { YOU } from './chapters'

const TICK_MS = 250
const AUTO_ATTEMPTS = 8 // nonces per tick while the auto-miner is on
const TAP_ATTEMPTS = 12 // nonces per tap on the big mine button
const BOT_ATTEMPTS = 6

const freshRig = () => ({ last: null, lastNonce: null, tries: 0, lowest: null, bestNonce: null })

/*
  useLarp — runs one LARP session for a chapter.

  Holds the engine state, ticks bots + the chapter script while `running`,
  and grinds nonces for the player — either on every tap of the mine button
  or continuously with auto-mine on. The player's block template is kept here
  (not in the engine) because it's private until a block is found.

  `rig` mirrors the handheld miner from the paper LARP kit:
  last hash tried, tries, lowest hash so far and the nonce that made it.
*/
export function useLarp(chapter, { name, running }) {
  const [state, dispatch] = useReducer(reduceAll, null, () => chapter.init(name))
  const stateRef = useRef(state)
  stateRef.current = state

  const [template, setTemplate] = useState([])
  const [mining, setMining] = useState(false)
  const [rig, setRig] = useState(freshRig)
  const miningRef = useRef(mining)
  miningRef.current = mining
  const tickRef = useRef(0)
  const nonceRef = useRef(0)

  // Txs the player picked that are still in the mempool (others got mined or replaced).
  const liveTemplate = useMemo(
    () => template.filter((id) => state.mempool.includes(id)),
    [template, state.mempool],
  )
  const liveRef = useRef(liveTemplate)
  liveRef.current = liveTemplate

  const outcome = chapter.evaluate(state)
  const playing = running && outcome.status === 'playing'
  const playingRef = useRef(playing)
  playingRef.current = playing

  // A new block means a new tip: the player's old work no longer counts.
  useEffect(() => { setRig(freshRig()) }, [state.height])
  useEffect(() => { if (!playing) setMining(false) }, [playing])

  /** Try `n` nonces on the player's block. Returns a block action if one wins. */
  const grind = useCallback((s, n) => {
    const txids = liveRef.current
    const header = headerOf(s, YOU, txids)
    let last = null
    let lastNonce = null
    let best = null
    let found = null
    for (let i = 0; i < n; i++) {
      const nonce = nonceRef.current++
      const h = blockHash(header, nonce)
      last = h
      lastNonce = nonce
      if (!best || hashNumber(h) < hashNumber(best.h)) best = { h, nonce }
      if (meetsTarget(h, s.difficulty)) { found = { type: 'block', miner: YOU, txids, nonce }; break }
    }
    setRig((r) => {
      const lower = r.lowest == null || hashNumber(best.h) < r.lowest
      return {
        last, lastNonce, tries: r.tries + (found ? 0 : n),
        lowest: lower ? hashNumber(best.h) : r.lowest,
        bestNonce: lower ? best.nonce : r.bestNonce,
      }
    })
    return found
  }, [])

  useEffect(() => {
    if (!playing) return undefined
    const id = setInterval(() => {
      const s = stateRef.current
      const tick = tickRef.current++
      const actions = [
        ...(chapter.script?.(s, tick) || []),
        ...botTick(s, { traffic: chapter.traffic, attempts: BOT_ATTEMPTS }),
      ]
      if (miningRef.current) {
        const found = grind(s, AUTO_ATTEMPTS)
        // Player's block goes first so a bot can't win the same tick.
        if (found) actions.unshift(found)
      }
      if (actions.length) dispatch(actions)
    }, TICK_MS)
    return () => clearInterval(id)
  }, [playing, chapter, grind])

  /** One tap on the big mine button. */
  const mineTap = useCallback(() => {
    if (!playingRef.current) return false
    const found = grind(stateRef.current, TAP_ATTEMPTS)
    if (found) dispatch(found)
    return !!found
  }, [grind])

  const act = useCallback((a) => dispatch(a), [])
  const addToTemplate = useCallback((txid) => setTemplate((t) => (t.includes(txid) ? t : [...t, txid])), [])
  const removeFromTemplate = useCallback((txid) => setTemplate((t) => t.filter((x) => x !== txid)), [])

  return {
    state, outcome, act,
    template: liveTemplate, addToTemplate, removeFromTemplate, setTemplate,
    mining, setMining, rig, mineTap,
  }
}
