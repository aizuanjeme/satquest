import { useCallback, useEffect, useState } from 'react'
import { leaderboardApi } from '../lib/api'
import Avatar from './Avatar'
import s from './Leaderboard.module.css'

export default function Leaderboard({ username, avatar }) {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [offline, setOffline] = useState(!navigator.onLine)

  const load = useCallback(async () => {
    if (!navigator.onLine) { setLoading(false); return }
    setLoading(true)
    try {
      const data = await leaderboardApi.top(50)
      setRows(data || [])
    } catch {
      // silent — table stays empty
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const goOffline = () => setOffline(true)
    const goOnline  = () => { setOffline(false); load() }
    window.addEventListener('offline', goOffline)
    window.addEventListener('online',  goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online',  goOnline)
    }
  }, [load])

  return (
    <div className={s.body}>
      <div className={s.topbar}>
        <span className={s.topTitle}>🏆 Global Rankings</span>
        <Avatar avatar={avatar} size="md" />
      </div>

      {offline ? (
        <div className={s.offlineWrap}>
          <div className={s.offlineAvatarWrap}>
            <Avatar avatar={avatar} size="xl" className={s.offlineAvatar} />
            <div className={s.bubble}>
              <span>📡</span> No internet…
            </div>
          </div>
          <p className={s.offlineTitle}>You're offline</p>
          <p className={s.offlineSub}>Connect to the internet to see how you rank against other players worldwide.</p>
        </div>
      ) : (
        <div className={s.scroll}>
          {loading ? (
            <p className={s.empty}>Loading rankings…</p>
          ) : rows.length === 0 ? (
            <p className={s.empty}>No players yet — you could be first!</p>
          ) : (
            rows.map((entry, idx) => {
              const isMe  = entry.username?.toLowerCase() === username?.toLowerCase()
              const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : null
              return (
                <div
                  key={entry.username}
                  className={`${s.row} ${isMe ? s.rowMe : ''}`}
                  style={{ animationDelay: idx * 0.03 + 's' }}
                >
                  <span className={s.rank}>
                    {medal
                      ? <span className={s.medal}>{medal}</span>
                      : <span className={s.rankNum}>#{entry.rank}</span>
                    }
                  </span>
                  <div className={s.info}>
                    <p className={s.name}>
                      {entry.username}
                      {isMe && <span className={s.you}>you</span>}
                    </p>
                    <p className={s.meta}>{entry.levelsCompleted} levels completed</p>
                  </div>
                  <span className={s.sats}>{entry.sats} ⚡</span>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
