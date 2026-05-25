import { useEffect, useState } from 'react'
import s from './NetworkToast.module.css'

export default function NetworkToast() {
  const [status, setStatus] = useState(null) // null | 'offline' | 'online'

  useEffect(() => {
    if (!navigator.onLine) setStatus('offline')

    const goOffline = () => setStatus('offline')
    const goOnline  = () => {
      setStatus('online')
      setTimeout(() => setStatus(null), 3000)
    }

    window.addEventListener('offline', goOffline)
    window.addEventListener('online',  goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online',  goOnline)
    }
  }, [])

  if (!status) return null

  const offline = status === 'offline'

  return (
    <div className={`${s.toast} ${offline ? s.offline : s.online}`}>
      <span className={s.icon}>{offline ? '📡' : '✅'}</span>
      <span className={s.msg}>
        {offline ? 'No internet connection' : 'Back online'}
      </span>
    </div>
  )
}
