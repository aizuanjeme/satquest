import { useState } from 'react'
import s from './Tournament.module.css'

/* Avatars that orbit the central content */
const ORBIT = [
  { gender: 'female', n: 3,  size: 90,  angle: 0   },
  { gender: 'male',   n: 7,  size: 72,  angle: 36  },
  { gender: 'female', n: 11, size: 82,  angle: 72  },
  { gender: 'male',   n: 2,  size: 68,  angle: 108 },
  { gender: 'female', n: 8,  size: 78,  angle: 144 },
  { gender: 'male',   n: 15, size: 86,  angle: 180 },
  { gender: 'female', n: 19, size: 70,  angle: 216 },
  { gender: 'male',   n: 4,  size: 84,  angle: 252 },
  { gender: 'female', n: 1,  size: 76,  angle: 288 },
  { gender: 'male',   n: 13, size: 66,  angle: 324 },
]

const HOW_STEPS = [
  { icon: '🎟️', title: 'Pick Entry Type',      col: '#2bd47a', body: 'Free Entry for a no-cost bracket, or paid with sats for a bigger pot.' },
  { icon: '🗣️', title: 'Join the Discord',     col: '#7289DA', body: 'All tournament coordination happens in our Discord. Must be a member to register.' },
  { icon: '⚔️', title: '2–5 Players/Bracket', col: '#f7c948', body: "Each bracket holds 2-5 participants matched in head-to-head Bitcoin quiz rounds." },
  { icon: '🧠', title: 'Quiz Battles',         col: '#9945ff', body: 'Timed Bitcoin quiz duels on SatQuest. Faster + more accurate answers advance.' },
  { icon: '🏆', title: 'Winner Takes Sats',    col: '#f7c948', body: 'Free brackets earn community-sponsored sats. Paid brackets award the full entry pot.' },
]

function HowModal({ onClose }) {
  return (
    <div className={s.modalOverlay} onClick={onClose}>
      <div className={s.modal} onClick={(e) => e.stopPropagation()}>
        <button className={s.modalClose} onClick={onClose} aria-label="Close">✕</button>
        <h2 className={s.modalTitle}>How Tournaments Work</h2>
        <p className={s.modalSub}>Everything you need to know before we launch.</p>
        <div className={s.modalSteps}>
          {HOW_STEPS.map((st, i) => (
            <div key={i} className={s.modalStep} style={{ borderColor: `${st.col}22` }}>
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
        <a href="https://discord.gg/Ttwg2yrzYC" target="_blank" rel="noopener" className={s.discordBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.003.022.015.043.03.056A19.9 19.9 0 0 0 5.83 20.99a.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.034.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
          </svg>
          Join Discord — get notified at launch
        </a>
      </div>
    </div>
  )
}

export default function Tournament() {
  const [showModal, setShowModal] = useState(false)

  return (
    <section id="tournament" className={s.section}>
      {/* Dot grid background */}
      <div className={s.dotGrid} />
      <div className={s.centralGlow} />

      {/* Orbiting ring of avatars */}
      <div className={s.orbitRing}>
        {ORBIT.map((av, i) => {
          const src = new URL(
            `../avatars/Size_XXL__2048px______Avatar_${av.gender}_${av.n}_____Round_no.webp`,
            import.meta.url,
          ).href
          /* Position on a circle using CSS custom props */
          return (
            <div
              key={i}
              className={s.orbitItem}
              style={{ '--angle': `${av.angle}deg`, '--delay': `${i * 0.4}s` }}
            >
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

      {/* Centre content */}
      <div className={s.center}>
        <div className={s.pill}>
          <span className={s.pillDot} />
          Coming Soon
        </div>

        <p className={s.eyebrow}>⚔️ SatQuest</p>
        <h2 className={s.title}>
          <span className="grad-purple">Tournaments</span>
        </h2>
        <p className={s.sub}>
          Bracket-style Bitcoin battles. 2–5 players.<br />Free or paid entry. Winner takes the sats.
        </p>

        <div className={s.actions}>
          <button className={`btn btn-solid-blue ${s.primaryBtn}`} onClick={() => setShowModal(true)}>
            How It Works →
          </button>
          <a
            href="https://discord.gg/Ttwg2yrzYC"
            target="_blank"
            rel="noopener"
            className={s.discordPill}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.003.022.015.043.03.056A19.9 19.9 0 0 0 5.83 20.99a.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.034.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            Join Discord
          </a>
        </div>

        <div className={s.entryPills}>
          <span className={s.entryFree}>🎟️ Free Entry</span>
          <span className={s.entryPaid}>⚡ Paid Entry</span>
        </div>
      </div>

      {showModal && <HowModal onClose={() => setShowModal(false)} />}
    </section>
  )
}
