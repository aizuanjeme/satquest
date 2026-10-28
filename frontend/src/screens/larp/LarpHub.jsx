import { useState } from 'react'
import { sound } from '../../audio/SoundManager'
import { CHAPTERS, FREE_PLAY, findChapter } from '../../larp/chapters'
import { loadLarp, resetLarp } from '../../lib/storage'
import GlassPanel from '../../ui/GlassPanel'
import LarpPlay from './LarpPlay'
import LarpLibrary from './LarpLibrary'
import MissionPlay from './mission/MissionPlay'
import { STAGES, MISSION_ID, MISSION_VERSION, stageIndex } from '../../larp/mission'
import { loadMission } from '../../lib/storage'
import { t } from '../../i18n'
import s from './Larp.module.css'

/*
  LarpHub — home of Bitcoin LARP, a separate mode from the Quest.

  Story mode walks through five roles (holder → mempool → miner → node →
  merchant), each unlocking the next. Free Play is a Group 1 vs Group 2
  round against bots. Online rooms are next (same engine, server-authoritative).
  The Library summarises the whitepaper and links each section to a chapter.
*/
export default function LarpHub({ username }) {
  const [view, setView] = useState({ name: 'hub' }) // hub | play | library
  const [run, setRun] = useState(0)
  const [larp, setLarp] = useState(loadLarp)

  const open = (v) => { sound.select(); setView(v) }
  const backToHub = () => { setLarp(loadLarp()); setView({ name: 'hub' }) }

  if (view.name === 'play') {
    const chapter = findChapter(view.id)
    const idx = CHAPTERS.indexOf(chapter)
    const next = idx >= 0 ? CHAPTERS[idx + 1] : null
    return (
      <LarpPlay
        key={`${view.id}-${run}`}
        chapter={chapter}
        name={username}
        onExit={backToHub}
        onRetry={() => setRun((n) => n + 1)}
        onNext={next ? () => { setLarp(loadLarp()); setRun((n) => n + 1); setView({ name: 'play', id: next.id }) } : null}
        onRead={(section) => { setLarp(loadLarp()); setView({ name: 'library', section }) }}
      />
    )
  }

  if (view.name === 'mission') {
    return (
      <MissionPlay
        onExit={backToHub}
        onRead={(section) => { setLarp(loadLarp()); setView({ name: 'library', section }) }}
      />
    )
  }

  if (view.name === 'library') {
    return (
      <LarpLibrary
        initial={view.section}
        onBack={() => open({ name: 'hub' })}
        onPlay={(id) => open({ name: 'play', id })}
        isUnlocked={(id) => unlocked(larp, id)}
      />
    )
  }

  const doneCount = CHAPTERS.filter((c) => larp.chapters[c.id]?.doneAt).length

  return (
    <div className={s.body}>
      <header className={s.header}>
        <div>
          <p className={s.kicker}>{t('larp.kicker')}</p>
          <div className={s.titleRow}>
            <h2 className={s.title}>{t('larp.title')}</h2>
            <span className={s.betaBadge}>{t('common.beta')}</span>
          </div>
        </div>
        <span className={s.xpPill}>✨ {larp.xp} XP</span>
      </header>
      <p className={s.intro}>{t('larp.intro')}</p>

      <MissionCard larp={larp} onOpen={() => open({ name: 'mission' })} />

      <p className={s.sectionLabel}>{t('larp.story', { done: doneCount, total: CHAPTERS.length })}</p>
      {CHAPTERS.map((c, i) => {
        const done = !!larp.chapters[c.id]?.doneAt
        const locked = !unlocked(larp, c.id)
        return (
          <button
            key={c.id}
            className={`${s.cardBtn} ${locked ? s.locked : ''}`}
            disabled={locked}
            onMouseEnter={() => !locked && sound.hover()}
            onClick={() => open({ name: 'play', id: c.id })}
          >
            <GlassPanel className={s.chapterCard} glow={done ? 'none' : i === doneCount ? 'blue' : 'none'}>
              <span className={s.chapterEmoji}>{locked ? '🔒' : c.emoji}</span>
              <span className={s.chapterBody}>
                <span className={s.chapterN}>{t('larp.chapter', { n: i + 1 })} · {t(`larp.role.${c.role}`)}</span>
                <span className={s.chapterTitle}>{c.title}</span>
                <span className={s.chapterTag}>{c.tagline}</span>
              </span>
              <span className={s.chapterEnd}>{done ? '✅' : `+${c.xp}`}</span>
            </GlassPanel>
          </button>
        )
      })}

      <p className={s.sectionLabel}>{t('larp.modes')}</p>
      <button className={s.cardBtn} onClick={() => open({ name: 'play', id: FREE_PLAY.id })}>
        <GlassPanel className={s.chapterCard} glow="purple">
          <span className={s.chapterEmoji}>{FREE_PLAY.emoji}</span>
          <span className={s.chapterBody}>
            <span className={s.chapterN}>{t('larp.free.kicker')}</span>
            <span className={s.chapterTitle}>{FREE_PLAY.title}</span>
            <span className={s.chapterTag}>{FREE_PLAY.tagline}</span>
          </span>
          <span className={s.chapterEnd}>{larp.freeWins ? `🏆 ${larp.freeWins}` : ''}</span>
        </GlassPanel>
      </button>

      <GlassPanel className={`${s.chapterCard} ${s.soon}`}>
        <span className={s.chapterEmoji}>🌍</span>
        <span className={s.chapterBody}>
          <span className={s.chapterN}>{t('larp.online.kicker')}</span>
          <span className={s.chapterTitle}>{t('larp.online.title')}</span>
          <span className={s.chapterTag}>{t('larp.online.sub')}</span>
        </span>
      </GlassPanel>

      <button className={s.cardBtn} onClick={() => open({ name: 'library' })}>
        <GlassPanel className={s.chapterCard}>
          <span className={s.chapterEmoji}>📖</span>
          <span className={s.chapterBody}>
            <span className={s.chapterN}>{t('larp.library.kicker')}</span>
            <span className={s.chapterTitle}>{t('larp.library.title')}</span>
            <span className={s.chapterTag}>{t('larp.library.sub')}</span>
          </span>
          <span className={s.chapterEnd}>›</span>
        </GlassPanel>
      </button>

      <button
        className={s.resetBtn}
        onClick={() => {
          if (!confirm(t('larp.reset.allConfirm'))) return
          sound.select()
          setLarp(resetLarp())
        }}
      >
        🔄 {t('larp.reset.all')}
      </button>
    </div>
  )
}

/** The kit mission: the main path. Shows resume progress if one is saved. */
function MissionCard({ larp, onOpen }) {
  const saved = loadMission(MISSION_VERSION)
  const done = !!larp.chapters[MISSION_ID]?.doneAt
  const at = saved && saved.stage !== 'brief' && saved.stage !== 'done' ? stageIndex(saved) : null
  return (
    <button className={s.cardBtn} onMouseEnter={() => sound.hover()} onClick={onOpen}>
      <GlassPanel className={`${s.chapterCard} ${s.missionCard}`} glow="blue">
        <span className={s.chapterEmoji}>{done ? '🏅' : '🎯'}</span>
        <span className={s.chapterBody}>
          <span className={s.chapterN}>{t('larp.mission.kicker')}</span>
          <span className={s.chapterTitle}>{t('larp.mission.title')}</span>
          <span className={s.chapterTag}>{t('larp.mission.sub')}</span>
          {at != null && <span className={s.resume}>▶ {t('larp.mission.resume', { n: at + 1, total: STAGES.length })}</span>}
        </span>
        <span className={s.chapterEnd}>{done ? '✅' : '+300'}</span>
      </GlassPanel>
    </button>
  )
}

/** Story chapters unlock in order; free play is always open. */
function unlocked(larp, id) {
  const i = CHAPTERS.findIndex((c) => c.id === id)
  return i <= 0 || !!larp.chapters[CHAPTERS[i - 1].id]?.doneAt
}
