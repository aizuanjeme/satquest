import { useState, useEffect } from 'react'
import s from './NetworkStatus.module.css'

/*
  NetworkStatus — a small status pill that floats in the bottom-right corner.
  Three states:
    • offline  — red dot, "No Connection"
    • syncing  — spinning dot, "Syncing…"
    • online   — green dot, "Saved" (fades out after 3 s)

  Listens to:
    - window online/offline events
    - custom 'satquest:sync' events emitted by storage.syncProgress
*/
export default function NetworkStatus() {
  const [status, setStatus] = useState(() =>
    navigator.onLine ? 'idle' : 'offline'
  )
  const [visible, setVisible] = useState(!navigator.onLine)

  useEffect(() => {
    let hideTimer = null

    const show = (st) => {
      clearTimeout(hideTimer)
      setStatus(st)
      setVisible(true)
    }

    const onOffline = () => show('offline')
    const onOnline  = () => {
      // Back online — if we were offline, briefly show "online" then hide
      setStatus('online')
      setVisible(true)
      hideTimer = setTimeout(() => setVisible(false), 3000)
    }

    const onSync = (e) => {
      if (e.detail === 'start') {
        show('syncing')
      } else if (e.detail === 'done') {
        show('saved')
        hideTimer = setTimeout(() => setVisible(false), 2500)
      } else if (e.detail === 'fail') {
        // Only show failure if we're actually offline
        if (!navigator.onLine) show('offline')
        else setVisible(false)
      }
    }

    window.addEventListener('offline', onOffline)
    window.addEventListener('online',  onOnline)
    window.addEventListener('satquest:sync', onSync)
    return () => {
      clearTimeout(hideTimer)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('satquest:sync', onSync)
    }
  }, [])

  if (!visible) return null

  const config = {
    offline: { dot: s.dotRed,    label: 'No Connection',   icon: '✕' },
    syncing: { dot: s.dotSpin,   label: 'Syncing…',        icon: '↻' },
    saved:   { dot: s.dotGreen,  label: 'Saved',           icon: '✓' },
    online:  { dot: s.dotGreen,  label: 'Back Online',     icon: '✓' },
    idle:    { dot: s.dotGreen,  label: 'Online',          icon: '●' },
  }[status] || { dot: s.dotGreen, label: 'Online', icon: '●' }

  return (
    <div className={`${s.pill} ${s[status]}`} role="status" aria-live="polite">
      <span className={`${s.dot} ${config.dot}`}>{status === 'syncing' ? '' : ''}</span>
      <span className={s.label}>{config.label}</span>
    </div>
  )
}
