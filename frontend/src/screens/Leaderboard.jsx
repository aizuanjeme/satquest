import { useCallback, useEffect, useState } from 'react'
import { leaderboardApi } from '../core/APIClient'
import Avatar from '../ui/Avatar'
import s from './Leaderboard.module.css'

/*
  Leaderboard — global ranks. Logic preserved: leaderboardApi.top(50),
  online/offline handling. Cinematic re-skin.
*/
export default function Leaderboard({ username, avatar }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(!navigator.onLine)

  const load = useCallback(async () => {
    if (!navigator.onLine) { setLoading(false); return }
    setLoading(true)
    try { setRows((await leaderboardApi.top(50)) || []) }
    catch { /* silent */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    load()
    const goOffline = () => setOffline(true)
    const goOnline = () => { setOffline(false); load() }
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [load])

  return (
    <div className={s.body}>
      <header className={s.header}>
        <div>
          <p className={s.kicker}>GLOBAL</p>
          <h2 className={s.title}>Rankings</h2>
        </div>
        <Avatar avatar={avatar} size={44} />
      </header>

      {offline ? (
        <div className={s.offline}>
          <Avatar avatar={avatar} size={120} />
          <p className={s.offTitle}>You're offline</p>
          <p className={s.offSub}>Reconnect to see how you rank against players worldwide.</p>
        </div>
      ) : loading ? (
        <p className={s.empty}>Loading rankings…</p>
      ) : rows.length === 0 ? (
        <p className={s.empty}>No players yet — you could be first!</p>
      ) : (
        <div className={s.list}>
          {rows.map((entry, idx) => {
            const isMe = entry.username?.toLowerCase() === username?.toLowerCase()
            const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null
            return (
              <div
                key={entry.username}
                className={`${s.row} ${isMe ? s.rowMe : ''} ${entry.rank <= 3 ? s.podium : ''}`}
                style={{ animationDelay: `${idx * 0.03}s` }}
              >
                <span className={s.rank}>{medal || <span className={s.rankNum}>#{entry.rank}</span>}</span>
                <div className={s.info}>
                  <p className={s.name}>{entry.username}{isMe && <span className={s.you}>you</span>}</p>
                  <p className={s.meta}>{entry.levelsCompleted} levels cleared</p>
                </div>
                <span className={s.sats}>{entry.sats} ⚡</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
