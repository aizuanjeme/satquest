import { useEffect, useRef, useState } from 'react'
import { LevelManager } from '../core/LevelManager'
import { QuestWorld, DOOR_DEFS } from '../rendering/QuestWorld'
import { sound } from '../audio/SoundManager'
import Avatar from '../ui/Avatar'
import ScoreDisplay from '../ui/ScoreDisplay'
import NeonButton from '../ui/NeonButton'
import { t } from '../i18n'
import s from './LevelMap.module.css'

const TYPE_META = {
  match: { color: '#2ad8ff' },
  wordhunt: { color: '#f7c948' },
  crossover: { color: '#b07bff' },
}

/*
  LevelMap — the quest hub rendered as an explorable 3D road. A winding neon
  highway carries gold sats-coins (transactions) past a Bitcoin "vault"
  building for every level. Drag / scroll to travel the road; tap a building
  to inspect a level, then launch it. The player's avatar walks the road
  as a little character. At the end of the road, three doors
  lead into the Explorer, Sovereignty and Builder worlds.
*/
export default function LevelMap({ avatar, username, sats, unlockedUpTo, progress, onSelect }) {
  const canvasRef = useRef(null)
  const worldRef = useRef(null)
  const [selected, setSelected] = useState(null)
  const [bridgeWelcome, setBridgeWelcome] = useState(false)
  const [realm, setRealm] = useState(null)

  useEffect(() => {
    if (!canvasRef.current) return undefined
    const world = new QuestWorld(canvasRef.current, {
      levels: LevelManager.all,
      unlockedUpTo,
      isComplete: (i) => LevelManager.isComplete(i, progress),
      stage2Start: LevelManager.stage1Count,
      avatar,
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
    world.onDoorPick(() => {
      sound.select()
      setSelected(null)
    })
    world.onRealmEnter((id) => {
      sound.success()
      setRealm(DOOR_DEFS.find((d) => d.id === id) || null)
    })
    world.onRealmExit(() => setRealm(null))
    world.start()

    // Auto-show bridge welcome once when Stage 2 first unlocked.
    // Only show when unlockedUpTo is exactly at the boundary (just crossed over),
    // not if the player is already deep in Stage 2 (key missing = cleared storage).
    const stage2Key = 'satquest.stage2welcomed'
    if (unlockedUpTo >= LevelManager.stage1Count && !localStorage.getItem(stage2Key)) {
      localStorage.setItem(stage2Key, '1')
      // Only pop the welcome if they just crossed the boundary, not if they
      // already have many Stage 2 levels unlocked.
      if (unlockedUpTo === LevelManager.stage1Count) {
        setTimeout(() => setBridgeWelcome(true), 1200)
      }
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

  // Keep the walking character's head in sync if the avatar changes
  useEffect(() => {
    worldRef.current?.setAvatar(avatar)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatar?.img, avatar?.emoji])

  const stage2Active = unlockedUpTo >= LevelManager.stage1Count
  const nearBridge = LevelManager.stage1Count > 0 && unlockedUpTo >= LevelManager.stage1Count - 4

  const lv = selected != null ? LevelManager.all[selected] : null
  const meta = lv ? (TYPE_META[lv.type] || TYPE_META.match) : null
  const tag = lv ? t(`type.${TYPE_META[lv.type] ? lv.type : 'match'}`) : ''
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
            <span className={s.prog}>{t('map.complete', { pct: Math.round(LevelManager.completionRatio(unlockedUpTo) * 100) })}</span>
          </div>
        </div>
        <span data-tour="sats"><ScoreDisplay sats={sats} /></span>
      </header>

      <div className={s.titleBlock} data-tour="map">
        <p className={s.kicker}>{realm ? t('map.entered') : t('map.journey')}</p>
        <h2 className={s.title}>{realm ? t(`door.${realm.id}.world`) : t('map.title')}</h2>
      </div>

      {realm && (
        <div className={s.realmCard} key={realm.id} style={{ '--realm': realm.css }}>
          <span className={s.realmTag}>{realm.icon} {t('map.door', { label: t(`door.${realm.id}.label`) })}</span>
          <h3 className={s.realmTitle}>{t(`door.${realm.id}.world`)}</h3>
          <p className={s.realmBody}>{t(`door.${realm.id}.blurb`)}</p>
          <p className={s.realmSoon}>{t('map.realmSoon')}</p>
          <NeonButton variant="blue" onClick={() => { sound.tap(); worldRef.current?.exitRealm() }}>
            {t('map.backToMap')}
          </NeonButton>
        </div>
      )}

      {!realm && nearBridge && selected == null && (
        <div className={`${s.urgencyBanner} ${stage2Active ? s.urgencyActive : s.urgencyAwaits}`}>
          {stage2Active ? t('map.stage2Active') : t('map.stage2Awaits')}
        </div>
      )}

      {!realm && selected == null && (
        <div className={s.hint}>
          <span className={s.hintDot} />
          {t('map.hint')}
        </div>
      )}

      {!realm && lv && (
        <div className={s.card} key={selected}>
          <button className={s.cardClose} onClick={() => { sound.tap(); setSelected(null) }} aria-label={t('common.close')}>✕</button>
          <span className={s.cardTag} style={{ color: meta.color }}>
            {tag} · {String(selected + 1).padStart(2, '0')}
            {selDone && <span className={s.doneBadge}>{t('map.cleared')}</span>}
          </span>
          <h3 className={s.cardTitle}>{lv.title || lv.chapter}</h3>
          {lv.story && <p className={s.cardStory}>{lv.story}</p>}
          <div className={s.cardFoot}>
            <span className={s.cardSats}>⚡ {lv.points ?? lv.sats} {t('common.pts')}</span>
            {selUnlocked ? (
              <NeonButton variant={selDone ? 'gold' : 'blue'} onClick={() => onSelect(selected)}>
                {selDone ? t('map.replay') : t('map.enter')}
              </NeonButton>
            ) : (
              <span className={s.locked}>{t('map.locked')}</span>
            )}
          </div>
        </div>
      )}

      {bridgeWelcome && (
        <div className={s.bridgeOverlay} onClick={() => { sound.tap(); setBridgeWelcome(false) }}>
          <div className={s.bridgeCard} onClick={(e) => e.stopPropagation()}>
            <button className={s.cardClose} onClick={() => { sound.tap(); setBridgeWelcome(false) }} aria-label={t('common.close')}>✕</button>
            <div className={s.bridgeIcon}>🌉</div>
            <p className={s.bridgeKicker}>{t('map.bridgeKicker')}</p>
            <h3 className={s.bridgeTitle}>{t('map.bridgeTitle')}</h3>
            <p className={s.bridgeBody}>{t('map.bridge1')}</p>
            <p className={s.bridgeBody}>{t('map.bridge2')}</p>
            <p className={s.bridgeBody}>{t('map.bridge3')}</p>
            <NeonButton variant="blue" onClick={() => { sound.tap(); setBridgeWelcome(false) }}>
              {stage2Active ? t('map.enterStage2') : t('map.backToQuest')}
            </NeonButton>
          </div>
        </div>
      )}
    </div>
  )
}
