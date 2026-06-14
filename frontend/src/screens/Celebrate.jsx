import { useEffect, useMemo } from 'react'
import { sound } from '../audio/SoundManager'
import s from './Celebrate.module.css'

const PRAISE = [
  'You just smashed it! 🚀',
  'Boom! Level cleared!',
  'You dey kampe! 💪',
  'Sharp sharp! On to the next!',
  'No be small thing! 🔥',
  'Bitcoin master in the making!',
  'Omo! That was clean!',
  'Sats secured! ⚡',
  'Na you dey run this! 👑',
]

const CONFETTI_COLORS = ['#2ad8ff', '#9945ff', '#f7c948', '#ff4d5e', '#2bd47a', '#ff9500']
const SPARKS = ['✨', '⚡', '🟠', '⭐', '💫', '🌟']

export default function Celebrate({ levelTitle, earnedSats, onDone }) {
  useEffect(() => { sound.win() }, [])

  const praise = useMemo(() => PRAISE[Math.floor(Math.random() * PRAISE.length)], [])

  const confetti = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 2 + Math.random() * 1.5,
    rotate: Math.random() * 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + Math.random() * 8,
    shape: Math.random() > 0.5 ? 'sq' : 'rect',
  })), [])

  const sparks = useMemo(() => Array.from({ length: 10 }).map((_, i) => ({
    char: SPARKS[i % SPARKS.length],
    angle: (i / 10) * 360,
    delay: i * 0.07,
  })), [])

  // Auto-advance after 4.5s
  useEffect(() => {
    const t = setTimeout(onDone, 4500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className={s.overlay} onClick={onDone}>

      {/* Confetti rain */}
      <div className={s.confetti} aria-hidden>
        {confetti.map((c, i) => (
          <span
            key={i}
            className={`${s.piece} ${c.shape === 'sq' ? s.sq : s.rect}`}
            style={{
              left: `${c.left}%`,
              background: c.color,
              width: `${c.size}px`,
              height: `${c.shape === 'sq' ? c.size : c.size * 1.7}px`,
              animationDelay: `${c.delay}s`,
              animationDuration: `${c.duration}s`,
              transform: `rotate(${c.rotate}deg)`,
            }}
          />
        ))}
      </div>

      {/* Radiating spark ring */}
      <div className={s.sparkRing} aria-hidden>
        {sparks.map((sp, i) => (
          <span
            key={i}
            className={s.spark}
            style={{ '--angle': `${sp.angle}deg`, animationDelay: `${sp.delay}s` }}
          >
            {sp.char}
          </span>
        ))}
      </div>

      {/* Card */}
      <div className={s.card}>
        <div className={s.trophy}>🏆</div>
        <p className={s.kicker}>Level Cleared</p>
        <h1 className={s.praise}>{praise}</h1>
        {levelTitle && (
          <p className={s.levelLine}><span className={s.check}>✓</span> {levelTitle}</p>
        )}
        {earnedSats > 0 && (
          <div className={s.satsBadge}>
            <span className={s.bolt}>⚡</span>
            <span className={s.satsNum}>+{earnedSats}</span>
            <span className={s.satsWord}>sats</span>
          </div>
        )}
        <button className={s.btn} onClick={(e) => { e.stopPropagation(); onDone() }}>
          Pick your next level →
        </button>
        <p className={s.hint}>Tap anywhere to continue</p>
      </div>

    </div>
  )
}
