import { useEffect, useReducer, useRef, useState } from 'react'
import { sound } from '../../../audio/SoundManager'
import { DragProvider } from '../../../larp/drag'
import { Coach, currentStep, speak } from '../../../larp/coach'
import {
  newMission, missionReduce, MISSION_ID, MISSION_VERSION, STAGES, stageIndex, scoreOf, totalMistakes,
} from '../../../larp/mission'
import { BRIEFING, STAGE_INFO, RECAP, feedbackText, coachSteps } from '../../../larp/missionText'
import { loadMission, saveMission, clearMission, recordLarpResult, awardBadge } from '../../../lib/storage'
import NeonButton from '../../../ui/NeonButton'
import { t } from '../../../i18n'
import { Grown } from '../LarpPanels'
import {
  CreateStage, RelayStage, ValidateStage, BuildStage, BlockCheckStage, UpdateStage, ConfirmStage,
} from './Stages'
import s from './Mission.module.css'
import ls from '../Larp.module.css'

/*
  MissionPlay — "The Bitcoin Mission", the kit-faithful LARP.
  Briefing → 7 stages → results. State is saved after every action so the
  player can leave and resume; Play again starts a fresh mission without
  touching any other SatQuest progress.
*/

const STAGE_VIEWS = {
  create: CreateStage,
  relay: RelayStage,
  validate: ValidateStage,
  build: BuildStage,
  blockcheck: BlockCheckStage,
  update: UpdateStage,
  confirm: ConfirmStage,
}

export default function MissionPlay({ onExit, onRead }) {
  const [m, dispatch] = useReducer(missionReduce, null, () => loadMission(MISSION_VERSION) || newMission())
  const [result, setResult] = useState(null)

  useEffect(() => { saveMission(m) }, [m])

  // Sound + read-aloud for each new explanation.
  const lastFb = useRef(m.feedback)
  useEffect(() => {
    if (!m.feedback || m.feedback === lastFb.current) return
    lastFb.current = m.feedback
    if (m.feedback.tone === 'oops') sound.wrong()
    else if (m.feedback.tone === 'good') sound.correct()
    const text = feedbackText(m.feedback)
    if (text) speak(`${text.title}. ${text.body}`)
  }, [m.feedback])

  // Award XP + badge once, when the mission is finished.
  useEffect(() => {
    if (m.stage !== 'done' || result) return
    const xp = scoreOf(m)
    const { xpGained } = recordLarpResult({ id: MISSION_ID, won: true, xp })
    awardBadge(MISSION_ID)
    setResult({ xp, xpGained })
    sound.success()
    speak('Mission complete! Bob got his sats. Great job!')
  }, [m.stage]) // eslint-disable-line

  const replay = () => { clearMission(); setResult(null); dispatch({ type: 'reset' }) }
  const restart = () => {
    if (m.stage === 'brief' || confirm(t('larp.reset.missionConfirm'))) { sound.select(); replay() }
  }
  const info = STAGE_INFO[m.stage]
  const View = STAGE_VIEWS[m.stage]
  const fb = feedbackText(m.feedback)
  const step = currentStep(coachSteps(m.stage), m, {})
  const at = stageIndex(m)

  return (
    <DragProvider>
      <div className={`${ls.table} ${s.mission}`} data-drag-scroll>
        <header className={ls.hud}>
          <button className={ls.exitBtn} onClick={() => { sound.tap(); onExit() }} aria-label="Close">✕</button>
          <div className={ls.hudTitle}>
            <p className={ls.kicker}>🎯 Mission</p>
            <h2 className={ls.hudName}>The Bitcoin Mission</h2>
          </div>
          <button className={ls.exitBtn} onClick={restart} aria-label={t('larp.reset.mission')} title={t('larp.reset.mission')}>🔄</button>
          <div className={ls.hudStat}>
            <span className={ls.hudNum}>⭐ {scoreOf(m)}</span>
            <span className={ls.label}>XP</span>
          </div>
        </header>

        <ol className={s.stepper} aria-label="Mission stages">
          {STAGES.map((st, i) => (
            <li key={st} className={`${s.step} ${i < at ? s.stepDone : ''} ${i === at ? s.stepNow : ''}`} title={STAGE_INFO[st].title}>
              <span>{i < at ? '✅' : STAGE_INFO[st].icon}</span>
            </li>
          ))}
        </ol>

        <p className={s.pretend}>🎮 Pretend sats — a learning game, not the real Bitcoin network.</p>

        {info && (
          <div className={s.stageBanner}>
            <span className={s.stageIcon}>{info.icon}</span>
            <div>
              <p className={ls.label}>Stage {at + 1} of {STAGES.length} · {info.role}</p>
              <h3 className={s.stageTitle}>{info.title}</h3>
              <p className={s.stageGoal}>{info.goal}</p>
            </div>
          </div>
        )}

        {fb && (
          <div className={`${s.feedback} ${s[`fb_${m.feedback.tone}`]}`} role="status">
            <div>
              <p className={s.fbTitle}>{fb.title}</p>
              <p className={s.fbBody}>{fb.body}</p>
            </div>
            <button className={s.xBtn} onClick={() => dispatch({ type: 'dismiss' })} aria-label="Close explanation">✕</button>
          </div>
        )}

        {View && <View m={m} dispatch={dispatch} />}

        <Coach step={step} active={m.stage !== 'brief' && m.stage !== 'done'} />

        {m.stage === 'brief' && (
          <div className={ls.overlay}>
            <div className={ls.sheet}>
              <p className={ls.bigEmoji}>🎯</p>
              <p className={ls.kicker}>Bitcoin LARP</p>
              <h2 className={ls.sheetTitle}>The Bitcoin Mission</h2>
              {BRIEFING.map((p, i) => <p key={i} className={ls.story}>{p}</p>)}
              <ol className={s.briefSteps}>
                {STAGES.map((st) => <li key={st}>{STAGE_INFO[st].icon} {STAGE_INFO[st].title}</li>)}
              </ol>
              <button className={ls.readBtn} onClick={() => { sound.tap(); speak(BRIEFING.join(' ')) }}>🔊 Read it to me</button>
              <NeonButton variant="gold" full onClick={() => { sound.select(); dispatch({ type: 'start' }) }}>Start the mission</NeonButton>
            </div>
          </div>
        )}

        {m.stage === 'done' && (
          <MissionResults m={m} result={result} onReplay={replay} onExit={onExit} onRead={onRead} />
        )}
      </div>
    </DragProvider>
  )
}

function MissionResults({ m, result, onReplay, onExit, onRead }) {
  const c = m.choices
  const lines = [
    ['✍️', `You paid Bob 50,000 sats using ${c.inputs} coins, a ${c.fee?.toLocaleString()}-sat tip and ${c.change?.toLocaleString()} sats change.`, m.mistakes.create],
    ['📡', `You passed the card around the network in ${c.relays} passes.`, m.mistakes.relay],
    ['🔍', 'You checked 4 cards and rejected the double-spend and the forgery.', m.mistakes.validate],
    ['⛏️', `You put ${c.picked} cards in your block, claimed ${c.claimed?.toLocaleString()} sats and mined it in ${c.tries?.toLocaleString()} tries.`, m.mistakes.build],
    ['🧱', 'You rejected Sneaky Pool’s greedy block and accepted yours.', m.mistakes.blockcheck],
    ['🧺', 'You fixed the UTXO SET and MEMPOOL baskets.', m.mistakes.update],
  ]
  return (
    <div className={ls.overlay}>
      <div className={`${ls.sheet} ${ls.sheetWin}`}>
        <p className={ls.bigEmoji}>🏅</p>
        <h2 className={ls.sheetTitle}>Mission complete!</h2>
        <p className={s.badge}>Bitcoin Mission badge</p>
        {result && (
          <p className={ls.xpGain}>
            {result.xpGained > 0 ? `+${result.xpGained} XP` : `${result.xp} XP (replay)`}
            {totalMistakes(m) === 0 && ' · perfect run!'}
          </p>
        )}
        <p className={ls.label}>What you did</p>
        <ul className={s.recap}>
          {lines.map(([icon, text, mistakes]) => (
            <li key={icon}><span>{icon}</span><span>{text}{mistakes > 0 && <em className={s.oopsCount}> · {mistakes} oops</em>}</span></li>
          ))}
        </ul>
        <p className={ls.label}>What you learned</p>
        <ul className={s.recap}>
          {RECAP.map((r) => <li key={r.icon}><span>{r.icon}</span><span>{r.text} <Grown word={r.grown} /></span></li>)}
        </ul>
        <button className={ls.paperLink} onClick={() => { sound.tap(); onRead('transactions') }}>📖 Story book: the Bitcoin whitepaper</button>
        <div className={ls.sheetBtns}>
          <NeonButton variant="ghost" onClick={onReplay}>Play again</NeonButton>
          <NeonButton variant="blue" onClick={onExit}>Back</NeonButton>
        </div>
      </div>
    </div>
  )
}
