import { useEffect } from 'react'
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
import Reveal from './screens/Reveal'
import Celebrate from './screens/Celebrate'
import Wallet from './screens/Wallet'
import Leaderboard from './screens/Leaderboard'
import Profile from './screens/Profile'
import BottomNav from './ui/BottomNav'
import NeonButton from './ui/NeonButton'
import NetworkStatus from './ui/NetworkStatus'
import { LevelManager } from './core/LevelManager'
import s from './App.module.css'

// Map each game phase to a cinematic camera mood.
const MOODS = {
  avatar: 'menu', intro: 'menu', map: 'map',
  playing: 'playing', reveal: 'reveal', celebrate: 'reveal',
  wallet: 'menu', leaderboard: 'menu', profile: 'menu', done: 'reveal',
}

function Game() {
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
          <h1 className={s.doneTitle}>You finished all {LevelManager.total} levels!</h1>
          <p className={s.doneSub}>
            You are now more Bitcoin-literate than 90% of Nigerians. Share SatQuest with your people.
          </p>
          <div className={s.doneSats}>
            <p className={s.doneSatNum}>⚡ {sats} sats earned</p>
            <p className={s.doneSatLbl}>across all {LevelManager.total} levels</p>
          </div>
          <NeonButton variant="gold" onClick={() => window.location.reload()}>Play again</NeonButton>
        </div>
      )}

      {showNav && <BottomNav phase={phase} onTab={handleTab} />}
      <NetworkStatus />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <SceneProvider>
        <Game />
      </SceneProvider>
    </ThemeProvider>
  )
}
