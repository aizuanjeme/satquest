import { useEffect, useRef } from 'react'
import { sound } from '../audio/SoundManager'
import GameFrame from './GameFrame'
import s from './ScamSpotterBoard.module.css'

/*
  ScamSpotterBoard — "Scam or Safe?" decision drills.

  Logic lives in useGame (pickScamAnswer / advanceScam / retryScam). Each
  scenario describes a real-world situation; the player decides whether it's a
  SCAM or SAFE, then reads WHY before moving on. This teaches the single most
  important self-custody skill: nobody legit ever needs your 12 words.
*/
export default function ScamSpotterBoard({ game, onMapPress }) {
  const {
    level, levelIdx, sats,
    scamCurrent, scamPicked, scamResult, scamTotal,
    pickScamAnswer, advanceScam,
  } = game

  const scenarios = level.scenarios || []
  const sc = scenarios[scamCurrent]
  const answered = scamPicked != null
  const correct = answered && scamPicked === sc?.answer

  const pickedRef = useRef(null)
  useEffect(() => {
    if (scamPicked && scamPicked !== pickedRef.current) {
      scamPicked === sc?.answer ? sound.correct() : sound.wrong()
    }
    pickedRef.current = scamPicked
  }, [scamPicked]) // eslint-disable-line

  const handlePick = (choice) => {
    if (answered) return
    sound.tap()
    pickScamAnswer(choice)
  }

  const handleNext = () => {
    sound.select()
    advanceScam()
  }

  return (
    <GameFrame
      level={level}
      levelIdx={levelIdx}
      sats={sats}
      onMapPress={onMapPress}
      progress={scamTotal ? scamCurrent / scamTotal : 0}
      progressLabel={`${scamCurrent + 1}/${scamTotal}`}
    >
      {scamResult ? (
        <div className={`${s.splash} ${scamResult === 'pass' ? s.pass : s.fail}`}>
          <div className={s.splashEmoji}>{scamResult === 'pass' ? '🛡️' : '⚠️'}</div>
          <p className={s.splashText}>
            {scamResult === 'pass' ? 'Sharp eyes — you spotted the scams!' : 'Tricky! Review and stay alert.'}
          </p>
        </div>
      ) : sc ? (
        <div className={s.card}>
          <span className={s.tag} style={{ color: level.hintColor }}>SCAM OR SAFE?</span>
          <div className={s.emoji}>{sc.emoji || '📩'}</div>
          <p className={s.prompt}>{sc.prompt}</p>

          {!answered ? (
            <div className={s.choices}>
              <button
                className={`${s.choice} ${s.scam}`}
                onMouseEnter={() => sound.hover()}
                onClick={() => handlePick('scam')}
              >
                🚩 Scam
              </button>
              <button
                className={`${s.choice} ${s.safe}`}
                onMouseEnter={() => sound.hover()}
                onClick={() => handlePick('safe')}
              >
                ✅ Safe
              </button>
            </div>
          ) : (
            <div className={`${s.verdict} ${correct ? s.vRight : s.vWrong}`}>
              <p className={s.verdictHead}>
                {correct ? '✓ Correct' : '✕ Not quite'} — this was{' '}
                <strong>{sc.answer === 'scam' ? 'a SCAM' : 'SAFE'}</strong>
              </p>
              <p className={s.why}>{sc.why}</p>
              <button className={s.nextBtn} onClick={handleNext}>
                {scamCurrent + 1 >= scamTotal ? 'Finish →' : 'Next →'}
              </button>
            </div>
          )}
        </div>
      ) : null}
    </GameFrame>
  )
}
