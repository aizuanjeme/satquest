import { useCallback, useEffect, useRef, useState } from 'react'
import { sound } from '../../audio/SoundManager'
import { DragProvider } from '../../larp/drag'
import { useLarp } from '../../larp/useLarp'
import { YOU, freePlayXp } from '../../larp/chapters'
import { findSection } from '../../larp/whitepaper'
import { Coach, currentStep, speak } from '../../larp/coach'
import { recordLarpResult } from '../../lib/storage'
import NeonButton from '../../ui/NeonButton'
import {
  WalletPanel, MempoolPanel, MinerPanel, NodePanel, MerchantPanel, ChainStrip, LogFeed,
} from './LarpPanels'
import { t } from '../../i18n'
import s from './Larp.module.css'

/*
  LarpPlay — one round of a LARP chapter: briefing → live table → debrief.
  Remount with a new `key` to retry from scratch.
*/
export default function LarpPlay({ chapter, name, onExit, onNext, onRetry, onRead }) {
  const [briefing, setBriefing] = useState(true)
  const game = useLarp(chapter, { name, running: !briefing })
  const { state, outcome } = game
  const [result, setResult] = useState(null) // { won, xpGained }

  // What the panels tell Bitty (coins in the card, signed, tip picked, block size).
  const [ui, setUi] = useState({})
  const report = useCallback((patch) => setUi((u) => ({ ...u, ...patch })), [])
  const step = currentStep(chapter.coach, state, ui)

  // Feedback sounds for things the player did.
  const seen = useRef({ blocks: 0, verdicts: 0 })
  useEffect(() => {
    const mine = state.players[YOU].blocksMined
    if (mine > seen.current.blocks) sound.win()
    seen.current.blocks = mine
    const v = state.nodeVerdicts
    if (v.length > seen.current.verdicts) v[v.length - 1].correct ? sound.correct() : sound.wrong()
    seen.current.verdicts = v.length
  }, [state])

  // Record the round once it ends.
  useEffect(() => {
    if (outcome.status === 'playing' || result) return
    const won = outcome.status === 'won'
    const xp = chapter.id === 'free' ? freePlayXp(state, won) : chapter.xp
    const { xpGained } = recordLarpResult({ id: chapter.id, won, xp })
    setResult({ won, xpGained })
    won ? sound.success() : sound.wrong()
    speak(won ? t('larp.result.wonSay') : `${t('larp.result.lostSay')} ${outcome.reason ? t(outcome.reason) : ''}`)
  }, [outcome.status]) // eslint-disable-line

  const has = (p) => chapter.panels.includes(p)
  const section = findSection(chapter.paper)

  return (
    <DragProvider>
      <div className={s.table} data-drag-scroll>
        <header className={s.hud}>
          <button className={s.exitBtn} onClick={() => { sound.tap(); onExit() }} aria-label={t('common.close')}>✕</button>
          <div className={s.hudTitle}>
            <p className={s.kicker}>{chapter.emoji} {t(`larp.role.${chapter.role}`)}</p>
            <h2 className={s.hudName}>{chapter.title}</h2>
          </div>
          <div className={s.hudStat}>
            <span className={s.hudNum}>#{state.height}</span>
            <span className={s.label}>{t('larp.hud.height')}</span>
          </div>
        </header>

        <div className={s.objectives}>
          {outcome.objectives.map((o) => (
            <span key={o.key} className={`${s.obj} ${o.done ? s.objDone : ''}`}>
              {o.done ? '✅' : '◻️'} {t(o.key)}{o.count ? ` · ${o.count}` : ''}
            </span>
          ))}
          {outcome.blocksLeft != null && (
            <span className={s.obj}>⏱ {t('larp.hud.blocksLeft', { n: outcome.blocksLeft })}</span>
          )}
        </div>

        {outcome.score && (
          <div className={s.scoreboard}>
            <span className={`${s.team} ${s.g1}`}>{t('larp.team.g1')} <b>{outcome.score.g1.toLocaleString()}</b></span>
            <span className={s.vs}>vs</span>
            <span className={`${s.team} ${s.g2}`}>{t('larp.team.g2')} <b>{outcome.score.g2.toLocaleString()}</b></span>
          </div>
        )}

        <ChainStrip state={state} mining={game.mining} />

        <div className={s.panels}>
          {has('merchant') && <MerchantPanel game={game} />}
          {has('node') && <NodePanel game={game} />}
          {has('wallet') && <WalletPanel game={game} chapter={chapter} report={report} />}
          {has('miner') && <MinerPanel game={game} report={report} />}
          {has('mempool') && <MempoolPanel game={game} draggable={has('miner')} />}
          <LogFeed state={state} />
        </div>

        <Coach step={step} active={!result && !briefing} />

        {briefing && (
          <div className={s.overlay}>
            <div className={s.sheet}>
              <p className={s.bigEmoji}>{chapter.emoji}</p>
              <p className={s.kicker}>{t(`larp.role.${chapter.role}`)}</p>
              <h2 className={s.sheetTitle}>{chapter.title}</h2>
              {chapter.story.map((p, i) => <p key={i} className={s.story}>{p}</p>)}
              <button className={s.readBtn} onClick={() => { sound.tap(); speak(chapter.story.join(' ')) }}>
                🔊 {t('larp.readToMe')}
              </button>
              <NeonButton variant="gold" full onClick={() => { sound.select(); setBriefing(false) }}>
                {t('larp.begin')}
              </NeonButton>
            </div>
          </div>
        )}

        {result?.won && <Confetti />}
        {result && (
          <div className={s.overlay}>
            <div className={`${s.sheet} ${result.won ? s.sheetWin : s.sheetLose}`}>
              <p className={s.bigEmoji}>{result.won ? '🏆' : '💥'}</p>
              <h2 className={s.sheetTitle}>{result.won ? t('larp.result.won') : t('larp.result.lost')}</h2>
              {!result.won && outcome.reason && <p className={s.story}>{t(outcome.reason)}</p>}
              {result.xpGained > 0 && <p className={s.xpGain}>+{result.xpGained} XP</p>}

              <p className={s.label}>{t('larp.result.learned')}</p>
              <ul className={s.lesson}>
                {chapter.lesson.map((l, i) => <li key={i}>{l}</li>)}
              </ul>

              {section && (
                <button className={s.paperLink} onClick={() => { sound.tap(); onRead(section.id) }}>
                  📖 {t('larp.result.read', { n: section.n, title: section.title })}
                </button>
              )}

              <div className={s.sheetBtns}>
                <NeonButton variant="ghost" onClick={onRetry}>{t('larp.result.again')}</NeonButton>
                {result.won && onNext
                  ? <NeonButton variant="gold" onClick={onNext}>{t('larp.result.next')}</NeonButton>
                  : <NeonButton variant="blue" onClick={onExit}>{t('larp.result.hub')}</NeonButton>}
              </div>
            </div>
          </div>
        )}
      </div>
    </DragProvider>
  )
}

/** A burst of falling emoji for a win. */
function Confetti() {
  const bits = ['🎉', '⭐', '🪙', '✨', '🧱', '⚡']
  return (
    <div className={s.confetti} aria-hidden>
      {Array.from({ length: 28 }).map((_, i) => (
        <span
          key={i}
          style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 7) * 0.12}s`, animationDuration: `${1.8 + (i % 5) * 0.3}s` }}
        >
          {bits[i % bits.length]}
        </span>
      ))}
    </div>
  )
}
