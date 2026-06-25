import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import s from './TournamentPage.module.css'

/* Avatar images that ring the page */
const ORBIT = [
  { gender: 'female', n: 3,  size: 100, angle: 0   },
  { gender: 'male',   n: 7,  size: 78,  angle: 36  },
  { gender: 'female', n: 11, size: 92,  angle: 72  },
  { gender: 'male',   n: 2,  size: 72,  angle: 108 },
  { gender: 'female', n: 8,  size: 84,  angle: 144 },
  { gender: 'male',   n: 15, size: 96,  angle: 180 },
  { gender: 'female', n: 19, size: 76,  angle: 216 },
  { gender: 'male',   n: 4,  size: 88,  angle: 252 },
  { gender: 'female', n: 1,  size: 94,  angle: 288 },
  { gender: 'male',   n: 13, size: 70,  angle: 324 },
]

/* Random glitch text corruption */
const GLITCH_CHARS = '!<>-_\\/[]{}—=+*^?#BTCSAT⚡01'
function corruptText(str, intensity = 0.18) {
  return str
    .split('')
    .map((c) =>
      c !== ' ' && Math.random() < intensity
        ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
        : c,
    )
    .join('')
}

const HOW_STEPS = [
  { icon: '🎟️', title: 'Pick Entry Type',       col: '#2bd47a', body: 'Free Entry for a no-cost bracket, or paid with sats for a bigger pot.' },
  { icon: '🗣️', title: 'Join the Telegram',     col: '#2CA5E0', body: 'All tournament coordination happens in our Telegram. Must be a member to register.' },
  { icon: '⚔️', title: '2–5 Players / Bracket', col: '#f7c948', body: 'Each bracket holds 2–5 participants in head-to-head Bitcoin quiz rounds.' },
  { icon: '🧠', title: 'Quiz Battles',           col: '#9945ff', body: 'Timed Bitcoin quiz duels on SatQuest. Faster + more accurate answers advance.' },
  { icon: '🏆', title: 'Winner Takes Sats',     col: '#f7c948', body: 'Free brackets earn community sats. Paid brackets award the full entry pot.' },
]

function HowModal({ onClose }) {
  return (
    <div className={s.overlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <button className={s.modalClose} onClick={onClose}>✕</button>
        <h2 className={s.modalTitle}>How Tournaments Work</h2>
        <p className={s.modalSub}>Everything you need to know before we launch.</p>
        <div className={s.steps}>
          {HOW_STEPS.map((st, i) => (
            <div key={i} className={s.step} style={{ borderColor: `${st.col}22` }}>
              <div className={s.stepIcon} style={{ background: `${st.col}18`, border: `1px solid ${st.col}44` }}>
                {st.icon}
              </div>
              <div>
                <p className={s.stepTitle} style={{ color: st.col }}>{st.title}</p>
                <p className={s.stepBody}>{st.body}</p>
              </div>
            </div>
          ))}
        </div>
        <a href="https://t.me/satquests" target="_blank" rel="noopener" className={s.discordBtn}>
          <TelegramIcon /> Join Telegram — get notified at launch
        </a>
      </div>
    </div>
  )
}

function TelegramIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  )
}

export default function TournamentPage() {
  const [showModal, setShowModal] = useState(false)
  const [glitchTitle, setGlitchTitle] = useState('TOURNAMENTS')
  const [glitchSub, setGlitchSub]     = useState('COMING SOON')
  const [scanPos, setScanPos]          = useState(0)
  const [flicker, setFlicker]          = useState(false)
  const titleRef = useRef('TOURNAMENTS')
  const subRef   = useRef('COMING  SOON')

  /* Glitch title animation */
  useEffect(() => {
    let frame
    let idle = 0
    const tick = () => {
      idle++
      if (idle > 60 && Math.random() < 0.04) {
        /* burst: corrupt for ~8 frames then restore */
        let bursts = 0
        const burst = () => {
          if (bursts++ < 8) {
            setGlitchTitle(corruptText(titleRef.current, 0.35))
            setGlitchSub(corruptText(subRef.current, 0.25))
            frame = requestAnimationFrame(burst)
          } else {
            setGlitchTitle(titleRef.current)
            setGlitchSub(subRef.current)
            idle = 0
          }
        }
        burst()
      } else {
        frame = requestAnimationFrame(tick)
      }
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  /* Scan-line sweep position */
  useEffect(() => {
    const id = setInterval(() => {
      setScanPos((p) => (p + 1) % 100)
    }, 20)
    return () => clearInterval(id)
  }, [])

  /* Random screen flicker */
  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() < 0.03) {
        setFlicker(true)
        setTimeout(() => setFlicker(false), 80 + Math.random() * 100)
      }
    }, 400)
    return () => clearInterval(id)
  }, [])

  return (
    <div className={`${s.page} ${flicker ? s.flicker : ''}`}>
      {/* CRT overlay grid */}
      <div className={s.crtGrid} aria-hidden />

      {/* Horizontal scan bar */}
      <div
        className={s.scanBar}
        aria-hidden
        style={{ top: `${scanPos}%` }}
      />

      {/* RGB chromatic aberration layers */}
      <div className={s.rgbR} aria-hidden />
      <div className={s.rgbB} aria-hidden />

      {/* Central glow */}
      <div className={s.centralGlow} aria-hidden />

      {/* Dot-grid pattern */}
      <div className={s.dotGrid} aria-hidden />

      {/* Orbiting avatars ring */}
      <div className={s.orbitRing} aria-hidden>
        {ORBIT.map((av, i) => {
          const src = new URL(
            `../avatars/Size_XXL__2048px______Avatar_${av.gender}_${av.n}_____Round_no.webp`,
            import.meta.url,
          ).href
          return (
            <div key={i} className={s.orbitItem} style={{ '--angle': `${av.angle}deg` }}>
              <img
                src={src}
                alt=""
                className={s.orbitImg}
                style={{ width: av.size, height: av.size }}
              />
            </div>
          )
        })}
      </div>

      {/* Back link */}
      <Link to="/" className={s.back}>← Back</Link>

      {/* ── Core content ── */}
      <div className={s.center}>
        {/* Status badge */}
        <div className={s.statusBadge}>
          <span className={s.statusDot} />
          <span className={s.statusTxt}>SIGNAL DETECTED</span>
        </div>

        {/* Main title with glitch */}
        <div className={s.titleWrap}>
          {/* Ghost layers for RGB split */}
          <p className={`${s.title} ${s.titleGhostR}`} aria-hidden>{glitchTitle}</p>
          <p className={`${s.title} ${s.titleGhostB}`} aria-hidden>{glitchTitle}</p>
          <p className={s.title}>{glitchTitle}</p>
        </div>

        {/* Subtitle glitch */}
        <p className={s.sub}>{glitchSub}</p>

        {/* Urgency descriptor */}
        <p className={s.desc}>
          Bracket-style Bitcoin battles.<br />
          2–5 players. Free or paid entry.<br />
          <strong>Winner takes the sats.</strong>
        </p>

        {/* Countdown aesthetic (static — replace with live timer when you have a date) */}
        <div className={s.countdown}>
          {[['??', 'DAYS'], ['??', 'HRS'], ['??', 'MIN'], ['??', 'SEC']].map(([n, l]) => (
            <div key={l} className={s.countUnit}>
              <span className={s.countNum}>{n}</span>
              <span className={s.countLabel}>{l}</span>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className={s.actions}>
          <button className={s.howBtn} onClick={() => setShowModal(true)}>
            How It Works →
          </button>
          <a href="https://t.me/satquests" target="_blank" rel="noopener" className={s.discordPill}>
            <TelegramIcon />
            Join Telegram
          </a>
        </div>

        {/* Entry pills */}
        <div className={s.pills}>
          <span className={s.pillFree}>🎟️ Free Entry</span>
          <span className={s.pillPaid}>⚡ Paid Entry</span>
        </div>

        {/* Glitch noise line */}
        <div className={s.noiseLine} aria-hidden>
          {Array.from({ length: 32 }).map((_, i) => (
            <span key={i} className={s.noiseChar}>
              {GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]}
            </span>
          ))}
        </div>
      </div>

      {showModal && <HowModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
