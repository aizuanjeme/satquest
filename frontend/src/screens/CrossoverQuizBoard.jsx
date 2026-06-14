import { useEffect, useRef } from 'react'
import { QuizEngine } from '../core/GameEngine'
import { LevelManager } from '../core/LevelManager'
import { sound } from '../audio/SoundManager'
import LevelIndicator from '../ui/LevelIndicator'
import ScoreDisplay from '../ui/ScoreDisplay'
import NeonButton from '../ui/NeonButton'
import s from './CrossoverQuizBoard.module.css'

/*
  CrossoverQuizBoard — cinematic final trial. Same useGame logic:
  pickQuizAnswer / retryQuiz, timeout handling, pass mark. The crossover level
  has its own intro banner so we don't use GameFrame's generic briefing.
*/
export default function CrossoverQuizBoard({ game, onMapPress }) {
  const {
    level, levelIdx, sats,
    quizCurrent, quizAnswers, quizPicked, quizTimeLeft, quizRunning, quizResult,
    quizCorrect, quizTotal, pickQuizAnswer, retryQuiz,
  } = game

  const questions = level.questions || []
  const question = questions[quizCurrent]
  const totalQ = questions.length
  const passingNum = QuizEngine.passing(totalQ, level.passMark || 0.7)
  const scorePct = quizTotal > 0 ? Math.round((quizCorrect / quizTotal) * 100) : 0
  const passed = quizResult === 'pass'

  useEffect(() => {
    if (quizPicked === null || quizPicked === undefined) return
    const correctIdx = questions[quizCurrent - 1]?.answer
    quizPicked === correctIdx ? sound.correct() : sound.wrong()
  }, [quizCurrent]) // eslint-disable-line

  const lastTick = useRef(quizTimeLeft)
  useEffect(() => {
    if (quizRunning && quizTimeLeft !== lastTick.current && quizTimeLeft <= 10 && quizTimeLeft > 0) sound.tick()
    lastTick.current = quizTimeLeft
  }, [quizTimeLeft, quizRunning])

  useEffect(() => {
    if (quizResult === 'pass') sound.win()
  }, [quizResult])

  const timeUrg = quizTimeLeft <= 10 ? 'crit' : quizTimeLeft <= 20 ? 'warn' : ''

  const Header = (
    <header className={s.hud}>
      <button className={s.mapBtn} onMouseEnter={() => sound.hover()} onClick={() => { sound.tap(); onMapPress() }}>‹ Map</button>
      <LevelIndicator index={levelIdx} total={LevelManager.total} label="FINAL TRIAL" type="crossover" />
      <ScoreDisplay sats={sats} compact />
    </header>
  )

  /* ---- result ---- */
  if (quizResult) {
    return (
      <div className={s.frame}>
        {Header}
        <div className={s.scroll}>
          <div className={`${s.resultCard} ${passed ? s.pass : s.fail}`}>
            <div className={s.resultEmoji}>{passed ? '🏆' : '⚔️'}</div>
            <h2 className={s.resultTitle}>{passed ? 'Trial Conquered' : 'Not Quite'}</h2>
            <div className={s.scoreBig}>
              <span className={s.scoreNum}>{quizCorrect}</span>
              <span className={s.scoreOf}>/ {quizTotal}</span>
            </div>
            <div className={s.scorePct} style={{ color: passed ? '#2bd47a' : '#ff5e6e' }}>{scorePct}%</div>
            <p className={s.resultSub}>
              {passed
                ? `You needed ${passingNum}/${totalQ}. +${level.sats} sats secured. The next stage is open.`
                : `You needed ${passingNum}/${totalQ}, scored ${quizCorrect}/${totalQ}. Revisit a few levels and return.`}
            </p>
            <div className={s.breakdown}>
              {questions.map((q, idx) => {
                const correct = quizAnswers[idx] === q.answer
                return (
                  <div key={idx} className={`${s.breakRow} ${correct ? s.bRight : s.bWrong}`}>
                    <span>{correct ? '✓' : '✕'}</span>
                    <span className={s.breakQ}>{q.q}</span>
                  </div>
                )
              })}
            </div>
            {!passed && (
              <NeonButton variant="purple" full onClick={() => { sound.click(); retryQuiz() }}>
                Try Again
              </NeonButton>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ---- quiz ---- */
  return (
    <div className={s.frame}>
      {Header}
      <div className={s.barRow}>
        <div className={s.bar}><div className={s.barFill} style={{ width: `${Math.round(QuizEngine.progress(quizCurrent, totalQ) * 100)}%` }} /></div>
        <span className={s.barLabel}>{quizCurrent}/{totalQ}</span>
      </div>

      <div className={s.scroll}>
        {quizCurrent === 0 && (
          <div className={s.intro}>
            <p className={s.introTitle}>{level.title}</p>
            <p className={s.introText}>{level.story}</p>
            <div className={s.introMeta}>
              <span>📋 {totalQ} questions</span>
              <span>⏱ {level.timeLimit}s</span>
              <span>🎯 {Math.round((level.passMark || 0.7) * 100)}%</span>
              <span>⚡ {level.sats}</span>
            </div>
          </div>
        )}

        <div className={`${s.statsRow} ${s[timeUrg]}`}>
          <div className={s.timer}><span>⏱</span><b>{quizTimeLeft}s</b></div>
          <div className={s.qCount}>Q <b>{quizCurrent + 1}</b> / {totalQ}</div>
          <div className={s.scoreChip}>✓ <b>{quizCorrect}</b></div>
        </div>

        {question && (
          <div className={s.qCard}>
            <p className={s.qNum}>QUESTION {quizCurrent + 1}</p>
            <p className={s.qText}>{question.q}</p>
            <div className={s.options}>
              {question.options.map((opt, idx) => (
                <button
                  key={idx}
                  className={s.opt}
                  onMouseEnter={() => sound.hover()}
                  onClick={() => { sound.tap(); pickQuizAnswer(idx) }}
                  disabled={!quizRunning}
                >
                  <span className={s.optLetter}>{String.fromCharCode(65 + idx)}</span>
                  <span className={s.optText}>{opt}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
