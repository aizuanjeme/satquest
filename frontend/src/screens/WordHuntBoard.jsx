import { useEffect, useRef } from 'react'
import { WordEngine } from '../core/GameEngine'
import { sound } from '../audio/SoundManager'
import GameFrame from './GameFrame'
import s from './WordHuntBoard.module.css'

/*
  WordHuntBoard — timed word-selection level rendered as glowing 3D-style
  chips floating in the cinematic space. Logic stays in useGame.
*/
export default function WordHuntBoard({ game, onMapPress }) {
  const {
    level, levelIdx, sats,
    huntWords, huntPicked, huntTimeLeft, huntRunning,
    huntRealFound, huntRealTotal, pickHuntWord,
  } = game

  const urgency = WordEngine.urgency(huntTimeLeft, level.timeLimit)
  const lastTick = useRef(huntTimeLeft)
  useEffect(() => {
    if (huntTimeLeft !== lastTick.current && huntTimeLeft <= 5 && huntTimeLeft > 0) sound.tick()
    lastTick.current = huntTimeLeft
  }, [huntTimeLeft])

  const timer = (
    <div className={`${s.timerRow} ${urgency === 2 ? s.crit : urgency === 1 ? s.warn : ''}`}>
      <span className={s.timerLabel}>TIME</span>
      <span className={s.timerVal}>{huntTimeLeft}s</span>
      <span className={s.found}>{huntRealFound}/{huntRealTotal} found</span>
    </div>
  )

  const handlePick = (word) => {
    if (!huntRunning || huntPicked[word]) return
    pickHuntWord(word)
    // feedback based on whether it was real
    const real = (level.real || []).includes(word)
    real ? sound.correct() : sound.wrong()
  }

  return (
    <GameFrame
      level={level}
      levelIdx={levelIdx}
      sats={sats}
      onMapPress={onMapPress}
      progress={WordEngine.progress(huntRealFound, huntRealTotal)}
      progressLabel={`${huntRealFound}/${huntRealTotal}`}
      timer={timer}
    >
      <p className={s.hint} style={{ color: level.hintColor }}>{level.hint}</p>
      <div className={s.cloud}>
        {huntWords.map((word, i) => {
          const picked = huntPicked[word]
          return (
            <button
              key={word}
              className={`${s.chip} ${picked === 'right' ? s.right : ''} ${picked === 'wrong' ? s.wrong : ''}`}
              onMouseEnter={() => !picked && sound.hover()}
              onClick={() => handlePick(word)}
              disabled={!!picked || !huntRunning}
              style={{ animationDelay: `${i * 0.03}s` }}
            >
              {word}
              {picked === 'right' && <span className={s.mark}>✓</span>}
              {picked === 'wrong' && <span className={s.mark}>✕</span>}
            </button>
          )
        })}
      </div>
    </GameFrame>
  )
}
