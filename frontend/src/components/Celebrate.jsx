import { useEffect, useMemo } from 'react'
import { sfx } from '../lib/sfx'
import s from './Celebrate.module.css'

/*
  Celebrate — playful "Wow! You just passed this!" overlay.

  Fires after the Reveal screen, between finishing a level and returning to
  the map. Confetti rains, sparks burst, a big congrats message bounces in,
  then a single CTA drops the player back onto the map to pick the next level.
*/

// Pre-baked list of fun congrats phrases — picked randomly each time
const PRAISE = [
  'Wow! You just smashed it!',
  'Boom! Level cleared!',
  'You dey kampe! 🚀',
  'Sharp sharp! On to the next!',
  'No be small thing! 💪',
  'Bitcoin master in the making!',
  'Omo! That was clean!',
  'Vex no dey \u2014 you nailed it!',
  'Sats secured! \u26a1',
]

const CONFETTI_COLORS = [
  '#FF9500', // orange
  '#FFE600', // yellow
  '#FF2D92', // pink
  '#B845FF', // purple
  '#00FFB3', // green
  '#00CFFF', // cyan
]

const SPARKS = ['✨', '⚡', '🟠', '⭐', '💫', '🌟']

export default function Celebrate({ levelTitle, earnedSats, onDone }) {
  // Play win fanfare on mount
  useEffect(() => { sfx.win() }, [])

  // Pick one praise line per mount
  const praise = useMemo(
    () => PRAISE[Math.floor(Math.random() * PRAISE.length)],
    []
  )

  // Build a deterministic-per-mount confetti pattern
  const confetti = useMemo(() => (
    Array.from({ length: 36 }).map((_, i) => ({
      left:     Math.random() * 100,            // %
      delay:    Math.random() * 0.6,            // s
      duration: 1.8 + Math.random() * 1.4,      // s
      rotate:   Math.random() * 360,            // deg
      color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size:     6 + Math.random() * 8,          // px
      shape:    Math.random() > 0.5 ? 'sq' : 'rect',
    }))
  ), [])

  // Big floating sparks around the trophy
  const sparks = useMemo(() => (
    Array.from({ length: 10 }).map((_, i) => ({
      char:  SPARKS[i % SPARKS.length],
      angle: (i / 10) * 360,
      delay: i * 0.07,
    }))
  ), [])

  // Auto-advance after 4.5 s so the player isn't stuck if they don't tap
  useEffect(() => {
    const t = setTimeout(onDone, 4500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div className={s.overlay} onClick={onDone}>

      {/* Confetti raining from the top */}
      <div className={s.confetti} aria-hidden>
        {confetti.map((c, i) => (
          <span
            key={i}
            className={`${s.piece} ${c.shape === 'sq' ? s.sq : s.rect}`}
            style={{
              left:               `${c.left}%`,
              background:         c.color,
              width:              `${c.size}px`,
              height:             `${c.shape === 'sq' ? c.size : c.size * 1.6}px`,
              animationDelay:     `${c.delay}s`,
              animationDuration:  `${c.duration}s`,
              transform:          `rotate(${c.rotate}deg)`,
            }}
          />
        ))}
      </div>

      {/* Burst of sparks radiating from the center */}
      <div className={s.sparkRing} aria-hidden>
        {sparks.map((sp, i) => (
          <span
            key={i}
            className={s.spark}
            style={{
              '--angle': `${sp.angle}deg`,
              animationDelay: `${sp.delay}s`,
            }}
          >
            {sp.char}
          </span>
        ))}
      </div>

      {/* Main content */}
      <div className={s.card}>
        <div className={s.trophy}>🏆</div>
        <p className={s.kicker}>Congratulations</p>
        <h1 className={s.praise}>{praise}</h1>
        {levelTitle && (
          <p className={s.levelLine}>
            <span className={s.checkmark}>✓</span> {levelTitle}
          </p>
        )}

        {earnedSats > 0 && (
          <div className={s.satsBadge}>
            <span className={s.satsBolt}>⚡</span>
            <span className={s.satsNum}>+{earnedSats}</span>
            <span className={s.satsWord}>sats</span>
          </div>
        )}

        <button className={s.btn} onClick={onDone}>
          Pick your next level →
        </button>
        <p className={s.hint}>Tap anywhere to continue</p>
      </div>

    </div>
  )
}
