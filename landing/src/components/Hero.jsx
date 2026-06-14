import { Link } from 'react-router-dom'
import s from './Hero.module.css'

const APP_URL = 'https://satquests.netlify.app'

/* Avatars that orbit the hero — 10 evenly spaced */
const ORBIT = [
  { gender: 'female', n: 3,  size: 86,  angle: 0   },
  { gender: 'male',   n: 7,  size: 70,  angle: 36  },
  { gender: 'female', n: 11, size: 80,  angle: 72  },
  { gender: 'male',   n: 2,  size: 66,  angle: 108 },
  { gender: 'female', n: 8,  size: 76,  angle: 144 },
  { gender: 'male',   n: 15, size: 84,  angle: 180 },
  { gender: 'female', n: 19, size: 68,  angle: 216 },
  { gender: 'male',   n: 4,  size: 80,  angle: 252 },
  { gender: 'female', n: 1,  size: 74,  angle: 288 },
  { gender: 'male',   n: 13, size: 64,  angle: 324 },
]

export default function Hero() {
  return (
    <section id="hero" className={s.hero}>
      {/* Decorative orbs */}
      <div className={s.orbBlue} />
      <div className={s.orbPurple} />
      <div className={s.orbGold} />

      {/* Scan line effect */}
      <div className={s.scanLine} aria-hidden />

      {/* Orbit ring — desktop only */}
      <div className={s.orbitRing} aria-hidden>
        {ORBIT.map((av, i) => {
          const src = new URL(
            `../avatars/Size_XXL__2048px______Avatar_${av.gender}_${av.n}_____Round_no.webp`,
            import.meta.url,
          ).href
          return (
            <div key={i} className={s.orbitItem} style={{ '--angle': `${av.angle}deg` }}>
              <img src={src} alt="" className={s.orbitImg} style={{ width: av.size, height: av.size }} />
            </div>
          )
        })}
      </div>

      {/* Main content */}
      <div className={s.content}>
        <div className={s.badge}>
          <span className={s.badgeDot} />
          Open-source · Built for Nigerians
        </div>

        <h1 className={s.headline}>
          Learn{' '}
          <span className="grad-blue">Bitcoin.</span>
          <br />
          Stack{' '}
          <span className="grad-gold">Real Sats.</span>
        </h1>

        <p className={s.sub}>
          37 progressive levels — from "what is a sat?" to Lightning Network mastery.
          Pick your avatar, earn sats at every level, and climb the global leaderboard.
        </p>

        <div className={s.actions}>
          <a href={APP_URL} target="_blank" rel="noopener" className={`btn btn-solid-blue ${s.primaryBtn}`}>
            ⚡ Play Now — It&apos;s Free
          </a>
          <a href="#how" className={`btn btn-ghost ${s.secondaryBtn}`}>
            How It Works ↓
          </a>
        </div>

        {/* Tournament teaser link */}
        <Link to="/tournament" className={s.tournamentTeaser}>
          <span className={s.teaserPulse} />
          ⚔️ Tournaments — coming soon
          <span className={s.teaserArrow}>→</span>
        </Link>

        {/* Trust strip */}
        <div className={s.trust}>
          <span className={s.trustItem}>
            <span className={s.trustDot} style={{ background: '#2bd47a' }} />
            No sign-up required
          </span>
          <span className={s.trustSep}>·</span>
          <span className={s.trustItem}>
            <span className={s.trustDot} style={{ background: '#f7c948' }} />
            No Bitcoin needed to start
          </span>
          <span className={s.trustSep}>·</span>
          <span className={s.trustItem}>
            <span className={s.trustDot} style={{ background: '#2ad8ff' }} />
            MIT licensed
          </span>
        </div>
      </div>

      {/* Scroll cue */}
      <div className={s.scrollCue} aria-hidden>
        <div className={s.scrollLine} />
        <span className={s.scrollLabel}>scroll</span>
      </div>
    </section>
  )
}

