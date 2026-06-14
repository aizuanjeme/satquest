import { useEffect, useState } from 'react'
import s from './Leaderboard.module.css'

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api'

/* Fallback mock rows if API is unreachable */
const MOCK = [
  { username: 'nakamoto_fan',  avatarId: 'avM7',  points: 48250, levelsCompleted: 37, bestTotalTimeMs: 14820000 },
  { username: 'sats_stacker',  avatarId: 'avF3',  points: 41100, levelsCompleted: 35, bestTotalTimeMs: 16200000 },
  { username: 'hodl_queen',    avatarId: 'avF11', points: 36800, levelsCompleted: 32, bestTotalTimeMs: 18430000 },
  { username: 'block_explorer',avatarId: 'avM2',  points: 29500, levelsCompleted: 29, bestTotalTimeMs: 21000000 },
  { username: 'lightning_rod', avatarId: 'avM14', points: 24100, levelsCompleted: 26, bestTotalTimeMs: 24600000 },
  { username: 'satoshi_student',avatarId:'avF8',  points: 19700, levelsCompleted: 22, bestTotalTimeMs: 28900000 },
  { username: 'chain_watcher', avatarId: 'avM5',  points: 15200, levelsCompleted: 18, bestTotalTimeMs: 33100000 },
  { username: 'utxo_hunter',   avatarId: 'avF19', points: 11600, levelsCompleted: 14, bestTotalTimeMs: 40200000 },
  { username: 'mempool_hawk',  avatarId: 'avM9',  points:  8300, levelsCompleted: 10, bestTotalTimeMs: 52000000 },
  { username: 'key_keeper',    avatarId: 'avF6',  points:  5100, levelsCompleted:  7, bestTotalTimeMs: 68000000 },
]

function fmtTime(ms) {
  if (!ms) return '—'
  const secs = Math.floor(ms / 1000)
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  if (h) return `${h}h ${m}m`
  return `${m}m ${s}s`
}

function avatarSrc(avatarId) {
  if (!avatarId) return null
  const m = avatarId.match(/^av([FM])(\d+)$/)
  if (!m) return null
  const gender = m[1] === 'F' ? 'female' : 'male'
  const n = parseInt(m[2], 10)
  return new URL(
    `../avatars/Size_XXL__2048px______Avatar_${gender}_${n}_____Round_no.webp`,
    import.meta.url,
  ).href
}

function RankBadge({ rank }) {
  if (rank === 1) return <span className={`${s.badge} ${s.gold}`}>🥇</span>
  if (rank === 2) return <span className={`${s.badge} ${s.silver}`}>🥈</span>
  if (rank === 3) return <span className={`${s.badge} ${s.bronze}`}>🥉</span>
  return <span className={`${s.badge} ${s.plain}`}>#{rank}</span>
}

export default function Leaderboard() {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/leaderboard?limit=10`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then(setRows)
      .catch(() => { setError(true); setRows(MOCK) })
  }, [])

  const data = rows ?? []

  return (
    <section id="leaderboard" className={`section ${s.section}`}>
      {/* Accent blob */}
      <div className={s.blob} />

      <div className={s.head}>
        <p className="section-kicker">Live Rankings</p>
        <h2 className="section-title">
          🏆 Global <span className="grad-gold">Leaderboard</span>
        </h2>
        <p className="section-sub" style={{ margin: '0 auto 48px' }}>
          Top players ranked by lifetime sats earned. Fastest total time wins ties.
        </p>
      </div>

      <div className={s.tableWrap}>
        {/* Table header */}
        <div className={s.tableHead}>
          <span className={s.live}>
            <span className={s.liveDot} />
            Live
          </span>
          <span className={s.tableTitle}>🏆 Top Players</span>
          {error && <span className={s.mockNote}>Demo data</span>}
        </div>

        {/* Loading skeleton */}
        {!rows && (
          <div className={s.skeletonWrap}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={s.skeleton} />
            ))}
          </div>
        )}

        {/* Table */}
        {rows && (
          <div className={s.tableScroll}>
            <table className={s.table}>
              <thead>
                <tr>
                  {['#', 'Player', '⚡ Sats', 'Levels', 'Time'].map((h) => (
                    <th key={h} className={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => {
                  const rank = i + 1
                  const src  = avatarSrc(row.avatarId)
                  const isTop3 = rank <= 3
                  return (
                    <tr key={i} className={`${s.tr} ${isTop3 ? s.trTop : ''}`}>
                      <td className={s.td}>
                        <RankBadge rank={rank} />
                      </td>
                      <td className={s.td}>
                        <div className={s.player}>
                          {src
                            ? <img src={src} alt="" className={s.avatar} />
                            : <div className={s.avatarFallback}>{row.username?.[0]?.toUpperCase()}</div>
                          }
                          <span className={s.username}>@{row.username}</span>
                        </div>
                      </td>
                      <td className={s.td}>
                        <span className={s.sats}>⚡ {(row.points ?? 0).toLocaleString()}</span>
                      </td>
                      <td className={s.td}>
                        <span className={s.levels}>{row.levelsCompleted ?? 0}</span>
                      </td>
                      <td className={s.td}>
                        <span className={s.time}>{fmtTime(row.bestTotalTimeMs)}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}
