import { useEffect, useMemo, useState } from 'react'
import { useGame } from './hooks/useGame'
import { sound } from './audio/SoundManager'
import { SceneProvider, useScene } from './components3d/SceneBackground'
import { ThemeProvider } from './hooks/useTheme'
import EntryScreen from './screens/EntryScreen'
import WelcomeIntro from './screens/WelcomeIntro'
import LevelMap from './screens/LevelMap'
import MatchBoard from './screens/MatchBoard'
import WordHuntBoard from './screens/WordHuntBoard'
import CrossoverQuizBoard from './screens/CrossoverQuizBoard'
import ScamSpotterBoard from './screens/ScamSpotterBoard'
import SeedOrderBoard from './screens/SeedOrderBoard'
import Reveal from './screens/Reveal'
import Celebrate from './screens/Celebrate'
import Wallet from './screens/Wallet'
import Leaderboard from './screens/Leaderboard'
import Profile from './screens/Profile'
import BottomNav from './ui/BottomNav'
import NeonButton from './ui/NeonButton'
import NetworkStatus from './ui/NetworkStatus'
import Tour from './ui/Tour'
import { LevelManager } from './core/LevelManager'
import { ensureLevels } from './lib/levelsSync'
import { isTourDone, markTourDone } from './lib/storage'
import { t, useLocale } from './i18n'
import s from './App.module.css'

// Map each game phase to a cinematic camera mood.
const MOODS = {
  avatar: 'menu', intro: 'menu', map: 'map',
  playing: 'playing', reveal: 'reveal', celebrate: 'reveal',
  wallet: 'menu', leaderboard: 'menu', profile: 'menu', done: 'reveal',
}

// First-run guided walkthrough shown once on the player's first visit to the
// Quest Map. Each step optionally spotlights a real element via its
// `data-tour` anchor (see BottomNav / LevelMap). Text is looked up per render
// so it follows the selected language.
const TOUR_STEPS = [
  { key: 'welcome', emoji: '\uD83D\uDC4B' },
  { key: 'map', anchor: 'map', emoji: '\uD83D\uDDFA\uFE0F' },
  { key: 'sats', anchor: 'sats', emoji: '\u26A1' },
  { key: 'wallet', anchor: 'nav-wallet', emoji: '\uD83D\uDCB3' },
  { key: 'ranks', anchor: 'nav-leaderboard', emoji: '\uD83C\uDFC6' },
  { key: 'you', anchor: 'nav-profile', emoji: '\uD83D\uDC64' },
  { key: 'ready', emoji: '\uD83D\uDE80' },
]

function Game() {
  // Re-render the whole game tree when the player switches language.
  const locale = useLocale()
  const tourSteps = useMemo(
    () => TOUR_STEPS.map((st) => ({ ...st, title: t(`tour.${st.key}.title`), body: t(`tour.${st.key}.body`) })),
    [locale],
  )
  const game = useGame()
  const { setMood } = useScene()
  const {
    phase, avatar, username, profile, progress,
    level, levelIdx, sats, unlockedUpTo, lastEarned,
    chooseAvatar, resumeProfile, restoreFromProfile, resetEverything, updateProfile,
    jumpTo, goToMap, goToWallet, goToLeaderboard, goToProfile,
    goToCelebrate, closeCelebrate, earnShareSats,
  } = game

  // Drive the persistent 3D backdrop's framing from the active phase.
  useEffect(() => { setMood(MOODS[phase] || 'idle') }, [phase, setMood])

  // First-run walkthrough: show once, the first time the player lands on the
  // Quest Map. Delayed slightly so the map + nav anchors are mounted/measured.
  const [showTour, setShowTour] = useState(false)
  useEffect(() => {
    if (phase !== 'map' || isTourDone()) return undefined
    const id = setTimeout(() => setShowTour(true), 700)
    return () => clearTimeout(id)
  }, [phase])
  const finishTour = () => { markTourDone(); setShowTour(false) }

  // Unlock the Web Audio context + start ambient score on the first gesture.
  useEffect(() => {
    const onFirst = () => { sound.unlock(); sound.startAmbient() }
    window.addEventListener('pointerdown', onFirst, { once: true })
    window.addEventListener('keydown', onFirst, { once: true })
    return () => {
      window.removeEventListener('pointerdown', onFirst)
      window.removeEventListener('keydown', onFirst)
    }
  }, [])

  const showNav = ['map', 'wallet', 'leaderboard', 'profile'].includes(phase)

  const handleTab = (id) => {
    if (id === 'map') goToMap()
    else if (id === 'wallet') goToWallet()
    else if (id === 'profile') goToProfile()
    else goToLeaderboard()
  }

  return (
    <div className={s.stage}>
      {phase === 'avatar' && (
        <EntryScreen
          existingProfile={profile}
          onChoose={chooseAvatar}
          onResume={resumeProfile}
          onReset={resetEverything}
          onRestore={restoreFromProfile}
        />
      )}

      {phase === 'intro' && (
        <WelcomeIntro avatar={avatar} username={username} onDone={goToMap} />
      )}

      {phase === 'map' && (
        <LevelMap
          avatar={avatar}
          username={username}
          sats={sats}
          unlockedUpTo={unlockedUpTo}
          progress={progress}
          onSelect={jumpTo}
        />
      )}

      {phase === 'leaderboard' && <Leaderboard username={username} avatar={avatar} />}

      {phase === 'profile' && (
        <Profile
          avatar={avatar}
          username={username}
          onUpdateProfile={updateProfile}
          onReset={resetEverything}
        />
      )}

      {phase === 'wallet' && (
        <Wallet
          sats={sats}
          avatar={avatar}
          username={username}
          progress={progress}
          unlockedUpTo={unlockedUpTo}
          onBack={goToMap}
        />
      )}

      {phase === 'playing' && (
        level.type === 'crossover'
          ? <CrossoverQuizBoard game={game} onMapPress={goToMap} />
          : level.type === 'wordhunt'
            ? <WordHuntBoard game={game} onMapPress={goToMap} />
            : level.type === 'scamspot'
              ? <ScamSpotterBoard game={game} onMapPress={goToMap} />
              : level.type === 'seedorder'
                ? <SeedOrderBoard game={game} onMapPress={goToMap} />
                : <MatchBoard game={game} onMapPress={goToMap} />
      )}

      {phase === 'reveal' && (
        <Reveal
          level={level}
          levelIdx={levelIdx}
          sats={sats}
          avatar={avatar}
          username={username}
          lastEarned={lastEarned}
          reviewConcepts={game.reviewConcepts}
          onNext={goToCelebrate}
          onMap={goToMap}
          onShareEarn={earnShareSats}
        />
      )}

      {phase === 'celebrate' && (
        <Celebrate levelTitle={level?.title} earnedSats={lastEarned} onDone={closeCelebrate} />
      )}

      {phase === 'done' && (
        <div className={s.done}>
          <p className={s.doneTrophy}>🏆</p>
          <h1 className={s.doneTitle}>{t('done.title', { count: LevelManager.total })}</h1>
          <p className={s.doneSub}>{t('done.sub')}</p>
          <div className={s.doneSats}>
            <p className={s.doneSatNum}>{t('done.earned', { sats })}</p>
            <p className={s.doneSatLbl}>{t('done.across', { count: LevelManager.total })}</p>
          </div>
          <NeonButton variant="gold" onClick={() => window.location.reload()}>{t('done.again')}</NeonButton>
        </div>
      )}

      {showNav && <BottomNav phase={phase} onTab={handleTab} />}
      {showTour && <Tour steps={tourSteps} onDone={finishTour} />}
      <NetworkStatus />
    </div>
  )
}

export default function App() {
  // Load the question set (from the backend DB on first launch, then the
  // offline IndexedDB cache) BEFORE mounting the game, since useGame reads the
  // levels synchronously on its first render.
  const [levelsReady, setLevelsReady] = useState(false)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let alive = true
    setLevelsReady(false)
    ensureLevels(true).finally(() => { if (alive) setLevelsReady(true) })
    return () => { alive = false }
  }, [retry])

  if (!levelsReady) {
    return (
      <div className={s.boot}>
        <span className={s.bootBolt}>⚡</span>
        <p className={s.bootText}>{t('boot.loading')}</p>
      </div>
    )
  }

  // No bundled levels ship with the app anymore — the question set comes from
  // the backend on first launch, then plays offline from cache. If a brand-new
  // user opens the app offline (nothing cached yet), ask them to connect once.
  if (LevelManager.total === 0) {
    return (
      <div className={s.boot}>
        <span className={s.bootBolt}>📡</span>
        <p className={s.bootText}>{t('boot.offline')}</p>
        <NeonButton variant="gold" onClick={() => setRetry((n) => n + 1)}>{t('boot.retry')}</NeonButton>
      </div>
    )
  }

  return (
    <ThemeProvider>
      <SceneProvider>
        <Game />
      </SceneProvider>
    </ThemeProvider>
  )
}
