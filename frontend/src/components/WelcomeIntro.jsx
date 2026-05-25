import { useEffect, useRef } from 'react'
import s from './WelcomeIntro.module.css'

/*
  WelcomeIntro — cinematic reveal between sign-up and the level map.

  Sequence:
    0 ms   → avatar scales up from center (tiny → full-page cover)
  800 ms   → welcome label + bouncing username slide up
  1 000 ms → progress bar starts filling (5 s total)
  5 000 ms → auto-advance to map
  tap anywhere → skip immediately
*/
export default function WelcomeIntro({ avatar, username, onDone }) {
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setTimeout(onDone, 5000)
    return () => clearTimeout(timerRef.current)
  }, [onDone])

  const handleSkip = () => {
    clearTimeout(timerRef.current)
    onDone()
  }

  return (
    <div className={s.overlay} onClick={handleSkip}>

      {/* Avatar fills the whole screen, scales up from center */}
      <div className={s.avatarBg}>
        {avatar?.img
          ? <img src={avatar.img} alt={username} className={s.avatarImg} />
          : <span className={s.avatarEmoji}>{avatar?.emoji}</span>
        }
      </div>

      {/* Dark gradient scrim over the bottom so text is readable */}
      <div className={s.scrim} />

      {/* Text content pinned to bottom */}
      <div className={s.content}>
        <p className={s.welcomeLabel}>Welcome to SatQuest ⚡</p>
        <h1 className={s.name}>@{username}</h1>

        {/* Progress bar sits directly under the name */}
        <div className={s.progressTrack}>
          <div className={s.progressBar} />
        </div>

        <p className={s.skipHint}>Tap anywhere to continue</p>
      </div>

    </div>
  )
}
