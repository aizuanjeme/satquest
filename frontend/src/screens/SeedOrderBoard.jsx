import { useEffect, useRef } from 'react'
import { sound } from '../audio/SoundManager'
import GameFrame from './GameFrame'
import s from './SeedOrderBoard.module.css'

/*
  SeedOrderBoard — rebuild a recovery phrase in the correct order.

  The player taps the shuffled words back into sequence. Tapping the wrong next
  word flashes red. This drills the muscle memory that your seed phrase order
  matters and is yours alone to guard. Logic lives in useGame.
*/
export default function SeedOrderBoard({ game, onMapPress }) {
  const {
    level, levelIdx, sats,
    seedShuffled, seedPlaced, seedWrong, seedResult, seedTotal,
    seedStudying, seedTarget, startSeedArrange,
    pickSeedWord, undoSeedWord,
  } = game

  const placedCount = seedPlaced.length

  const wrongRef = useRef(null)
  useEffect(() => {
    if (seedWrong && seedWrong !== wrongRef.current) sound.wrong()
    wrongRef.current = seedWrong
  }, [seedWrong])

  const placedRef = useRef(0)
  useEffect(() => {
    if (placedCount > placedRef.current) sound.correct()
    placedRef.current = placedCount
  }, [placedCount])

  useEffect(() => { if (seedResult === 'win') sound.win() }, [seedResult])

  const handlePick = (word) => {
    if (seedPlaced.includes(word) || seedResult) return
    sound.tap()
    pickSeedWord(word)
  }

  // ---- STUDY / READ PHASE ----
  if (seedStudying) {
    return (
      <GameFrame
        level={level}
        levelIdx={levelIdx}
        sats={sats}
        onMapPress={onMapPress}
        progress={0}
        progressLabel="Read"
      >
        <p className={s.hint} style={{ color: level.hintColor }}>
          Read your {seedTotal} words in order, then rebuild them from memory
        </p>
        <div className={s.studyGrid}>
          {seedTarget.map((word, i) => (
            <div key={i} className={s.studyCell} style={{ animationDelay: `${i * 0.04}s` }}>
              <span className={s.slotNum}>{i + 1}</span>
              <span className={s.studyWord}>{word}</span>
            </div>
          ))}
        </div>
        <button className={s.studyBtn} onClick={() => { sound.select(); startSeedArrange() }}>
          I've memorized them — arrange ↓
        </button>
      </GameFrame>
    )
  }

  return (
    <GameFrame
      level={level}
      levelIdx={levelIdx}
      sats={sats}
      onMapPress={onMapPress}
      progress={seedTotal ? placedCount / seedTotal : 0}
      progressLabel={`${placedCount}/${seedTotal}`}
    >
      <p className={s.hint} style={{ color: level.hintColor }}>
        {level.hint || 'Tap the words in the right order'}
      </p>

      <div className={s.slots}>
        {seedTarget.map((_, i) => (
          <div key={i} className={`${s.slot} ${seedPlaced[i] ? s.filled : ''}`}>
            <span className={s.slotNum}>{i + 1}</span>
            <span className={s.slotWord}>{seedPlaced[i] || ''}</span>
          </div>
        ))}
      </div>

      {placedCount > 0 && !seedResult && (
        <button className={s.undo} onClick={() => { sound.tap(); undoSeedWord() }}>
          ↶ Undo last
        </button>
      )}

      <div className={s.pool}>
        {seedShuffled.map((word, i) => {
          const used = seedPlaced.includes(word)
          const wrong = seedWrong === word
          return (
            <button
              key={word}
              className={`${s.word} ${used ? s.used : ''} ${wrong ? s.wrong : ''}`}
              onMouseEnter={() => !used && sound.hover()}
              onClick={() => handlePick(word)}
              disabled={used || !!seedResult}
              style={{ animationDelay: `${i * 0.03}s` }}
            >
              {word}
            </button>
          )
        })}
      </div>

      {seedResult === 'win' && (
        <div className={s.win}>
          <span className={s.winEmoji}>🔐</span>
          <p>Phrase restored — that's how you recover a wallet!</p>
        </div>
      )}
    </GameFrame>
  )
}
