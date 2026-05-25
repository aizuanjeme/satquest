import { useEffect, useRef, useState } from 'react'

/**
 * Subscribe to the backend's Server-Sent Events stream for a specific player.
 *
 * Usage:
 *   useLightningEvents(username, (event) => {
 *     if (event.type === 'paymentSucceeded') refreshWallet()
 *   })
 *
 * Returns `lastEvent` so components can also react via state.
 *
 * The EventSource auto-reconnects on network blips, so we don't have to.
 */
export function useLightningEvents(username, onEvent) {
  const [lastEvent, setLastEvent]   = useState(null)
  const [connected, setConnected]   = useState(false)
  const handlerRef = useRef(onEvent)
  handlerRef.current = onEvent

  useEffect(() => {
    if (!username) return undefined

    // Vite proxy + production both serve /api/* on the same origin, so a
    // relative URL is correct in dev and prod.
    const base = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
    const url = `${base}/api/lightning/${encodeURIComponent(username)}/events`

    const es = new EventSource(url)

    es.onopen = () => setConnected(true)
    es.onerror = () => setConnected(false)
    es.onmessage = (msg) => {
      let payload
      try { payload = JSON.parse(msg.data) } catch { return }
      setLastEvent(payload)
      handlerRef.current?.(payload)
    }

    return () => es.close()
  }, [username])

  return { lastEvent, connected }
}
