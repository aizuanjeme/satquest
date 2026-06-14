import { useEffect, useRef, useState } from 'react'
import { LevelManager } from '../core/LevelManager'
import { QuestWorld } from '../rendering/QuestWorld'
import { sound } from '../audio/SoundManager'
import Avatar from '../ui/Avatar'
import ScoreDisplay from '../ui/ScoreDisplay'
import NeonButton from '../ui/NeonButton'
import s from './LevelMap.module.css'

const TYPE_META = {
  match: { tag: 'MATCH', color: '#2ad8ff' },
  wordhunt: { tag: 'WORD HUNT', color: '#f7c948' },
  crossover: { tag: 'FINAL TRIAL', color: '#b07bff' },
}

/*
  LevelMap — the quest hub rendered as an explorable 3D road. A winding neon
  highway carries gold sats-coins (transactions) past a Bitcoin "vault"
  building for every level. Drag / scroll to travel the road; tap a building
  to inspect a level, then launch it.
*/
export default function LevelMap({ avatar, username, sats, unlockedUpTo, progress, onSelect }) {
  const canvasRef = useRef(null)
  const worldRef = useRef(null)
  const [selected, setSelected] = useState(null)
  const [bridgeWelcome, setBridgeWelcome] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return undefined
    const world = new QuestWorld(canvasRef.current, {
      levels: LevelManager.all,
      unlockedUpTo,
      isComplete: (i) => LevelManager.isComplete(i, progress),
      stage2Start: LevelManager.stage1Count,
    })
    world.onPick((i) => {
      sound.select()
      setSelected(i)
      world.setSelected(i)
      world.focusLevel(i)
    })
    world.onBridgePick(() => {
      sound.select()
      setBridgeWelcome(true)
    })
    world.start()

    // Auto-show bridge welcome once when Stage 2 first unlocked
    const stage2Key = 'satquest.stage2welcomed'
    if (unlockedUpTo >= LevelManager.stage1Count && !localStorage.getItem(stage2Key)) {
      localStorage.setItem(stage2Key, '1')
      setTimeout(() => setBridgeWelcome(true), 1200)
    }

    // Apply saved theme immediately
    const savedTheme = localStorage.getItem('satquest.theme')
    if (savedTheme) world.setTheme(savedTheme)

    // Re-apply when user switches themes while map is visible
    const onTheme = (e) => world.setTheme(e.detail)
    window.addEventListener('satquest:theme', onTheme)

    worldRef.current = world
    return () => {
      world.dispose()
      worldRef.current = null
      window.removeEventListener('satquest:theme', onTheme)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stage2Active = unlockedUpTo >= LevelManager.stage1Count
  const nearBridge = LevelManager.stage1Count > 0 && unlockedUpTo >= LevelManager.stage1Count - 4

  const lv = selected != null ? LevelManager.all[selected] : null
  const meta = lv ? (TYPE_META[lv.type] || TYPE_META.match) : null
  const selUnlocked = selected != null && selected <= unlockedUpTo
  const selDone = selected != null && LevelManager.isComplete(selected, progress)

  return (
    <div className={s.root}>
      <canvas ref={canvasRef} className={s.canvas} />

      <header className={s.header}>
        <div className={s.userRow}>
          <Avatar avatar={avatar} size={42} />
          <div className={s.userMeta}>
            <span className={s.hello}>@{username}</span>
            <span className={s.prog}>{Math.round(LevelManager.completionRatio(unlockedUpTo) * 100)}% complete</span>
          </div>
        </div>
        <ScoreDisplay sats={sats} />
      </header>

      <div className={s.titleBlock}>
        <p className={s.kicker}>YOUR JOURNEY</p>
        <h2 className={s.title}>The Quest Map</h2>
      </div>

      {nearBridge && selected == null && (
        <div className={`${s.urgencyBanner} ${stage2Active ? s.urgencyActive : s.urgencyAwaits}`}>
          {stage2Active ? '⚡ STAGE 2 ACTIVE — YOU’RE IN!' : '🌉 STAGE 2 AWAITS — Cross the bridge →'}
        </div>
      )}

      {selected == null && (
        <div className={s.hint}>
          <span className={s.hintDot} />
          Drag to travel · tap a vault to begin
        </div>
      )}

      {lv && (
        <div className={s.card} key={selected}>
          <button className={s.cardClose} onClick={() => { sound.tap(); setSelected(null) }} aria-label="Close">✕</button>
          <span className={s.cardTag} style={{ color: meta.color }}>
            {meta.tag} · {String(selected + 1).padStart(2, '0')}
            {selDone && <span className={s.doneBadge}>CLEARED</span>}
          </span>
          <h3 className={s.cardTitle}>{lv.title || lv.chapter}</h3>
          {lv.story && <p className={s.cardStory}>{lv.story}</p>}
          <div className={s.cardFoot}>
            <span className={s.cardSats}>⚡ {lv.sats} sats</span>
            {selUnlocked ? (
              <NeonButton variant={selDone ? 'gold' : 'blue'} onClick={() => onSelect(selected)}>
                {selDone ? 'Replay →' : 'Enter Quest →'}
              </NeonButton>
            ) : (
              <span className={s.locked}>🔒 Locked</span>
            )}
          </div>
        </div>
      )}

      {bridgeWelcome && (
        <div className={s.bridgeOverlay} onClick={() => { sound.tap(); setBridgeWelcome(false) }}>
          <div className={s.bridgeCard} onClick={(e) => e.stopPropagation()}>
            <button className={s.cardClose} onClick={() => { sound.tap(); setBridgeWelcome(false) }} aria-label="Close">✕</button>
            <div className={s.bridgeIcon}>🌉</div>
            <p className={s.bridgeKicker}>YOU MADE IT</p>
            <h3 className={s.bridgeTitle}>Welcome to Stage 2</h3>
            <p className={s.bridgeBody}>
              You've crossed the bridge. Stage 1 proved you understand the basics — Bitcoin, wallets, keys, and transactions.
            </p>
            <p className={s.bridgeBody}>
              Stage 2 goes deeper: Lightning Network, Layer 2, advanced security, and the philosophy of sound money. The road ahead is longer and harder.
            </p>
            <p className={s.bridgeBody}>
              ⚡ Stage 2 is live — keep scrolling past the bridge to unlock new challenges!
            </p>
            <NeonButton variant="blue" onClick={() => { sound.tap(); setBridgeWelcome(false) }}>
              {stage2Active ? 'Enter Stage 2 →' : 'Back to Quest →'}
            </NeonButton>
          </div>
        </div>
      )}
    </div>
  )
}
