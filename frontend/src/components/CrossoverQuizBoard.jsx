import { useEffect } from 'react'
import Avatar from './Avatar'
import { sfx } from '../lib/sfx'
import s from './CrossoverQuizBoard.module.css'

export default function CrossoverQuizBoard({ game, onMapPress }) {
  const {
    level, avatar,
    quizCurrent, quizAnswers, quizPicked, quizTimeLeft, quizRunning, quizResult,
    quizCorrect, quizTotal, quizPassMark,
    pickQuizAnswer,
  } = game

  const questions  = level.questions || []
  const question   = questions[quizCurrent]
  const totalQ     = questions.length
  const pct        = Math.round((quizCurrent / totalQ) * 100)
  const passingNum = Math.ceil(totalQ * (level.passMark || 0.7))
  const scorePct   = quizTotal > 0 ? Math.round((quizCorrect / quizTotal) * 100) : 0
  const passed     = quizResult === 'pass'

  const timeColor =
    quizTimeLeft <= 10 ? 'var(--red)' :
    quizTimeLeft <= 20 ? 'var(--orange)' :
    'var(--green)'

  // Sound feedback on answer
  useEffect(() => {
    if (quizPicked === null || quizPicked === undefined) return
    const correctIdx = questions[quizCurrent - 1]?.answer
    quizPicked === correctIdx ? sfx.ding() : sfx.buzz()
  }, [quizCurrent]) // fires after quizCurrent increments

  // Low timer tick
  useEffect(() => {
    if (quizRunning && quizTimeLeft <= 10 && quizTimeLeft > 0) sfx.tick()
  }, [quizTimeLeft, quizRunning])

  // ---- RESULT SCREEN ----
  if (quizResult) {
    return (
      <div className={s.game}>
        <div className={s.topbar}>
          <button className={s.mapBtn} onClick={onMapPress}>
            <Avatar avatar={avatar} size="sm" /> Map
          </button>
          <div className={s.levelInfo}>
            <span className={s.lvlBadge}>Level {level.id}</span>
            <span className={s.chapter}>Stage 1 Final</span>
          </div>
          <span className={s.satPill}>+{level.sats}⚡</span>
        </div>

        <div className={s.scrollArea}>
          <div className={`${s.resultCard} ${passed ? s.passCard : s.failCard}`}>
            <div className={s.resultEmoji}>{passed ? '🏆' : '😤'}</div>
            <h2 className={s.resultTitle}>
              {passed ? 'Stage 1 Complete!' : 'Not quite…'}
            </h2>
            <div className={s.scoreBig}>
              <span className={s.scoreNum}>{quizCorrect}</span>
              <span className={s.scoreOf}>/ {quizTotal}</span>
            </div>
            <div className={s.scorePct} style={{ color: passed ? 'var(--green)' : 'var(--red)' }}>
              {scorePct}%
            </div>
            <p className={s.resultSub}>
              {passed
                ? `You needed ${passingNum}/${totalQ} to pass. You nailed it! +${level.sats} sats earned. Stage 2 is unlocked.`
                : `You needed ${passingNum}/${totalQ} to pass. You scored ${quizCorrect}/${totalQ}. Review the levels and try again!`}
            </p>

            {/* Per-question breakdown */}
            <div className={s.breakdown}>
              {questions.map((q, idx) => {
                const chosen = quizAnswers[idx]
                const correct = chosen === q.answer
                return (
                  <div key={idx} className={`${s.breakRow} ${correct ? s.breakRight : s.breakWrong}`}>
                    <span className={s.breakIcon}>{correct ? '✅' : '❌'}</span>
                    <span className={s.breakQ}>{q.q}</span>
                  </div>
                )
              })}
            </div>

            {!passed && (
              <button className={s.retryBtn} onClick={() => game.retryQuiz()}>
                Try again
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  // ---- QUIZ SCREEN ----
  return (
    <div className={s.game}>
      <div className={s.topbar}>
        <button className={s.mapBtn} onClick={onMapPress}>
          <Avatar avatar={avatar} size="sm" /> Map
        </button>
        <div className={s.levelInfo}>
          <span className={s.lvlBadge}>Level {level.id}</span>
          <span className={s.chapter}>Stage 1 Final</span>
        </div>
        <span className={s.satPill}>+{level.sats}⚡</span>
      </div>

      <div className={s.scrollArea}>
        {/* Progress bar — based on questions answered */}
        <div className={s.progressWrap}>
          <div className={s.progressBar} style={{ width: pct + '%' }} />
        </div>

        {/* Intro banner (shown before first question) */}
        {quizCurrent === 0 && (
          <div className={s.introBanner}>
            <p className={s.introTitle}>{level.title}</p>
            <p className={s.introText}>{level.story}</p>
            <div className={s.introMeta}>
              <span>📋 {totalQ} questions</span>
              <span>⏱ {level.timeLimit}s</span>
              <span>🎯 {Math.round((level.passMark || 0.7) * 100)}% to pass</span>
              <span>⚡ {level.sats} sats</span>
            </div>
          </div>
        )}

        {/* Timer + counter row */}
        <div className={s.statsRow}>
          <div className={s.timer} style={{ color: timeColor, borderColor: timeColor }}>
            <span className={s.timerIcon}>⏱</span>
            <span className={s.timerNum}>{quizTimeLeft}s</span>
          </div>
          <div className={s.qCounter}>
            Q <b>{quizCurrent + 1}</b> / {totalQ}
          </div>
          <div className={s.scoreChip}>
            ✅ <b>{quizCorrect}</b> correct
          </div>
        </div>

        {/* Question card */}
        {question && (
          <div className={s.qCard}>
            <p className={s.qNum}>Question {quizCurrent + 1}</p>
            <p className={s.qText}>{question.q}</p>
            <div className={s.options}>
              {question.options.map((opt, idx) => (
                <button
                  key={idx}
                  className={s.optBtn}
                  onClick={() => pickQuizAnswer(idx)}
                >
                  <span className={s.optLetter}>{String.fromCharCode(65 + idx)}</span>
                  <span className={s.optText}>{opt}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className={s.hintBar} style={{ borderLeftColor: level.hintColor }}>
          {level.hint}
        </div>
      </div>
    </div>
  )
}
