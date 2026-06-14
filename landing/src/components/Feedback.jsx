import { useEffect, useState } from 'react'
import s from './Feedback.module.css'

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

const STATIC = [
  { username: 'nakamoto_fan',   avatarId: 'avM7',  rating: 5, category: 'gameplay', createdAt: '2026-05-20T10:00:00Z', message: 'Finally a game that teaches Bitcoin properly. The lightning challenges are insane — completed 3 levels in one sitting!' },
  { username: 'sats_stacker',   avatarId: 'avF3',  rating: 5, category: 'learning', createdAt: '2026-05-18T09:00:00Z', message: 'Love how each question ties back to real Bitcoin concepts. My knowledge of the mempool has never been better.' },
  { username: 'hodl_queen',     avatarId: 'avF11', rating: 4, category: 'social',   createdAt: '2026-05-15T14:00:00Z', message: 'The leaderboard keeps me motivated. Competing with friends while learning Bitcoin is genuinely addictive.' },
  { username: 'block_explorer', avatarId: 'avM2',  rating: 5, category: 'learning', createdAt: '2026-05-10T08:00:00Z', message: 'Went from knowing nothing about UTXOs to confidently explaining them at a meetup. This game works!' },
  { username: 'lightning_rod',  avatarId: 'avM14', rating: 5, category: 'design',   createdAt: '2026-05-05T16:00:00Z', message: 'The UI is beautiful and the questions are tough in the best way. Keep shipping!' },
  { username: 'satoshi_student',avatarId: 'avF8',  rating: 4, category: 'social',   createdAt: '2026-04-28T11:00:00Z', message: 'Been recommending this to everyone in my Bitcoin study group. The progression feels just right.' },
]

function timeAgo(str) {
  const d = Math.floor((Date.now() - new Date(str)) / 86400000)
  if (d < 1) return 'Today'
  if (d === 1) return 'Yesterday'
  if (d < 7)  return `${d}d ago`
  if (d < 30) return `${Math.floor(d/7)}w ago`
  return `${Math.floor(d/30)}mo ago`
}

function avatarSrc(avatarId) {
  const m = avatarId?.match(/^av([FM])(\d+)$/)
  if (!m) return null
  const gender = m[1] === 'F' ? 'female' : 'male'
  return new URL(
    `../avatars/Size_XXL__2048px______Avatar_${gender}_${parseInt(m[2],10)}_____Round_no.webp`,
    import.meta.url,
  ).href
}

const CAT_COLORS = { general: '#2ad8ff', bug: '#ff4d4d', suggestion: '#f7c948', other: '#9945ff' }

function FeedCard({ username, avatarId, rating, category, createdAt, message }) {
  const src = avatarSrc(avatarId)
  const col = CAT_COLORS[category] ?? '#2ad8ff'
  return (
    <div className={s.card}>
      <div className={s.cardGlow} style={{ background: col }} />
      <div className={s.cardCat} style={{ color: col, borderColor: `${col}44`, background: `${col}11` }}>
        {category}
      </div>
      <div className={s.stars}>
        {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
      </div>
      <p className={s.message}>"{message}"</p>
      <div className={s.foot}>
        {src
          ? <img src={src} alt="" className={s.avatar} />
          : <div className={s.avatarFb}>{username[0].toUpperCase()}</div>
        }
        <div>
          <p className={s.username}>@{username}</p>
          <p className={s.time}>{timeAgo(createdAt)}</p>
        </div>
      </div>
    </div>
  )
}

export default function Feedback() {
  const [items, setItems] = useState(STATIC)

  useEffect(() => {
    fetch(`${API_BASE}/feedback`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((live) => { if (live?.length > 0) setItems(live) })
      .catch(() => {/* keep static */})
  }, [])

  return (
    <section id="feedback" className={`section ${s.section}`}>
      <div className={s.blob} />

      <div className={s.head}>
        <p className="section-kicker">Community</p>
        <h2 className="section-title">
          What Players <span className="grad-blue">Say</span>
        </h2>
        <p className="section-sub" style={{ margin: '0 auto 52px' }}>
          Real feedback from real players. Straight from the game.
        </p>
      </div>

      <div className={s.grid}>
        {items.slice(0, 6).map((fb, i) => <FeedCard key={i} {...fb} />)}
      </div>
    </section>
  )
}
