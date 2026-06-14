import { useState, useEffect } from 'react'
import gsap from 'gsap'
import { LevelManager } from '../core/LevelManager'
import { sound } from '../audio/SoundManager'
import LevelIndicator from '../ui/LevelIndicator'
import ScoreDisplay from '../ui/ScoreDisplay'
import NeonButton from '../ui/NeonButton'
import s from './GameFrame.module.css'

/*
  GameFrame — shared cinematic chrome for every in-game board.

  Renders: a top HUD (map button, level indicator, score), a progress bar,
  an optional timer slot, the board children, and a one-time "briefing"
  overlay that shows the level story before play begins.
*/
export default function GameFrame({
  level, levelIdx, sats, onMapPress, progress = 0, progressLabel, timer, children,
}) {
  const [briefing, setBriefing] = useState(true)

  // Re-show the briefing whenever the level changes.
  useEffect(() => { setBriefing(true) }, [levelIdx])

  useEffect(() => {
    if (briefing) {
      gsap.fromTo(`.${s.briefCard}`,
        { y: 40, opacity: 0, scale: 0.96 },
        { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'power3.out' })
    }
  }, [briefing, levelIdx])

  return (
    <div className={s.frame}>
      <header className={s.hud}>
        <button className={s.mapBtn} onMouseEnter={() => sound.hover()} onClick={() => { sound.tap(); onMapPress() }}>
          ‹ Map
        </button>
        <LevelIndicator
          index={levelIdx}
          total={LevelManager.total}
          label={LevelManager.stageLabel(levelIdx)}
          type={level.type}
        />
        <ScoreDisplay sats={sats} compact />
      </header>

      <div className={s.barRow}>
        <div className={s.bar}>
          <div className={s.barFill} style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        {progressLabel && <span className={s.barLabel}>{progressLabel}</span>}
      </div>

      {timer}

      <div className={s.content}>{children}</div>

      {briefing && (
        <div className={s.briefBackdrop}>
          <div className={s.briefCard}>
            <p className={s.briefTag} style={{ color: level.hintColor }}>
              {LevelManager.stageLabel(levelIdx)} · LEVEL {levelIdx + 1}
            </p>
            <h2 className={s.briefTitle}>{level.title || level.chapter}</h2>
            <p className={s.briefStory}>{level.story}</p>
            <div className={s.briefReward}>
              <span>Reward</span>
              <strong>⚡ {level.sats} sats</strong>
            </div>
            <NeonButton variant="blue" full onClick={() => { sound.select(); setBriefing(false) }}>
              Begin →
            </NeonButton>
          </div>
        </div>
      )}
    </div>
  )
}
