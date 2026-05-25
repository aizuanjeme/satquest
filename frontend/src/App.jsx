import { useGame }       from './hooks/useGame'
import AvatarPick       from './components/AvatarPick'
import WelcomeIntro     from './components/WelcomeIntro'
import LevelMap         from './components/LevelMap'
import GameBoard        from './components/GameBoard'
import WordHuntBoard    from './components/WordHuntBoard'
import Reveal           from './components/Reveal'
import Celebrate        from './components/Celebrate'
import Wallet           from './components/Wallet'
import Leaderboard      from './components/Leaderboard'
import BottomNav        from './components/BottomNav'
import { LEVELS }       from './data/levels'
import s                from './App.module.css'

export default function App() {
  const game = useGame()
  const {
    phase, avatar, username, profile, progress,
    level, levelIdx, sats, unlockedUpTo, lastEarned,
    chooseAvatar, resumeProfile, restoreFromProfile, resetEverything, updateProfile,
    jumpTo, goToMap, goToWallet, goToLeaderboard,
    goToCelebrate, closeCelebrate,
  } = game

  const showNav = ['map', 'wallet', 'leaderboard'].includes(phase)

  const handleTab = (id) => {
    if (id === 'map')         goToMap()
    else if (id === 'wallet') goToWallet()
    else                      goToLeaderboard()
  }

  return (
    <div className={s.shell}>
      <div className={s.phone}>

        {phase === 'avatar' && (
          <AvatarPick
            existingProfile={profile}
            onChoose={chooseAvatar}
            onResume={resumeProfile}
            onReset={resetEverything}
            onRestore={restoreFromProfile}
          />
        )}

        {phase === 'intro' && (
          <WelcomeIntro
            avatar={avatar}
            username={username}
            onDone={goToMap}
          />
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

        {phase === 'leaderboard' && (
          <Leaderboard username={username} avatar={avatar} />
        )}

        {phase === 'wallet' && (
          <div className={s.scroll}>
            <Wallet
              sats={sats}
              avatar={avatar}
              username={username}
              progress={progress}
              unlockedUpTo={unlockedUpTo}
              onBack={goToMap}
              onReset={resetEverything}
              onUpdateProfile={updateProfile}
            />
          </div>
        )}

        {phase === 'playing' && (
          <div className={s.scroll}>
            {level.type === 'wordhunt'
              ? <WordHuntBoard game={game} onMapPress={goToMap} />
              : <GameBoard    game={game} onMapPress={goToMap} />
            }
          </div>
        )}

        {phase === 'reveal' && (
          <div className={s.scroll}>
            <Reveal
              level={level}
              levelIdx={levelIdx}
              sats={sats}
              avatar={avatar}
              lastEarned={lastEarned}
              onNext={goToCelebrate}
              onMap={goToMap}
            />
          </div>
        )}

        {phase === 'celebrate' && (
          <Celebrate
            levelTitle={level?.title}
            earnedSats={lastEarned}
            onDone={closeCelebrate}
          />
        )}

        {phase === 'done' && (
          <div className={s.scroll}>
            <div className={s.done}>
              <p className={s.doneTrophy}>🏆</p>
              <p className={s.doneTitle}>You finished all {LEVELS.length} levels!</p>
              <p className={s.doneSub}>You are now more Bitcoin-literate than 90% of Nigerians. Share SatQuest with your people.</p>
              <div className={s.doneSats}>
                <p className={s.doneSatNum}>⚡ {sats} sats earned</p>
                <p className={s.doneSatLbl}>across all {LEVELS.length} levels</p>
              </div>
              <button className={s.doneBtn} onClick={() => window.location.reload()}>
                Play again
              </button>
            </div>
          </div>
        )}

        {showNav && <BottomNav phase={phase} onTab={handleTab} />}

      </div>
    </div>
  )
}
