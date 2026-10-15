import { useEffect, useRef, useState, useCallback } from 'react'
import { leaderboardApi } from '../core/APIClient'
import Avatar from '../ui/Avatar'
import { t, tn } from '../i18n'
import s from './Leaderboard.module.css'

/*
  Leaderboard — global ranks with infinite scroll.
  Fetches 20 per page. Backend returns { data, total, page, limit, totalPages }.
  Uses a callback ref on the sentinel so the observer attaches whenever the
  sentinel enters the DOM (not just once on mount).
*/
const PAGE_SIZE = 20

export default function Leaderboard({ username, avatar }) {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal]     = useState(null)
  const [offline, setOffline] = useState(!navigator.onLine)
  const pageRef    = useRef(1)
  const loadingRef = useRef(false)
  const hasMoreRef = useRef(true)
  const obsRef     = useRef(null)

  const loadPage = useRef(async () => {
    if (loadingRef.current || !hasMoreRef.current || !navigator.onLine) return
    loadingRef.current = true
    setLoading(true)
    try {
      const res = await leaderboardApi.top(PAGE_SIZE, pageRef.current)
      const { data = [], totalPages = 1, total: tot = 0 } = res || {}
      setTotal(tot)
      if (pageRef.current >= totalPages) {
        hasMoreRef.current = false
        setHasMore(false)
      }
      pageRef.current += 1
      setRows((prev) => {
        const seen = new Set(prev.map((r) => r.username))
        return [...prev, ...data.filter((r) => !seen.has(r.username))]
      })
    } catch { /* silent */ }
    finally {
      loadingRef.current = false
      setLoading(false)
    }
  }).current

  // Initial load
  useEffect(() => { loadPage() }, [loadPage])

  // Callback ref — wires the IntersectionObserver whenever the sentinel mounts/unmounts
  const sentinelRef = useCallback((node) => {
    if (obsRef.current) { obsRef.current.disconnect(); obsRef.current = null }
    if (!node) return
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) loadPage() },
      { rootMargin: '300px' },
    )
    obs.observe(node)
    obsRef.current = obs
  }, [loadPage])

  useEffect(() => {
    const goOffline = () => setOffline(true)
    const goOnline  = () => { setOffline(false); if (pageRef.current === 1) loadPage() }
    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [loadPage])

  return (
    <div className={s.body}>
      <header className={s.header}>
        <div>
          <p className={s.kicker}>{t('lb.kicker')}</p>
          <h2 className={s.title}>{t('lb.title')}</h2>
        </div>
        <Avatar avatar={avatar} size={44} />
      </header>

      {offline ? (
        <div className={s.offline}>
          <Avatar avatar={avatar} size={120} />
          <p className={s.offTitle}>{t('lb.offTitle')}</p>
          <p className={s.offSub}>{t('lb.offSub')}</p>
        </div>
      ) : rows.length === 0 && loading ? (
        <p className={s.empty}>{t('lb.loading')}</p>
      ) : rows.length === 0 ? (
        <p className={s.empty}>{t('lb.empty')}</p>
      ) : (
        <div className={s.list}>
          {total !== null && (
            <p className={s.totalCount}>{tn('lb.total', total)}</p>
          )}
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
                  <p className={s.name}>{entry.username}{isMe && <span className={s.you}>{t('lb.you')}</span>}</p>
                  <p className={s.meta}>{t('lb.levels', { n: entry.levelsCompleted })}</p>
                </div>
              </div>
            )
          })}

          <div ref={sentinelRef} className={s.sentinel}>
            {loading && <p className={s.loadingMore}>{t('lb.more')}</p>}
            {!hasMore && rows.length > 0 && (
              <p className={s.endMsg}>{t('lb.end', { n: rows.length })}</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
