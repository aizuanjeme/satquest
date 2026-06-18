import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

// ── Auto-update ───────────────────────────────────────────────────────────────
// When a new version is deployed the service worker (via vite-plugin-pwa
// autoUpdate) installs in the background, calls skipWaiting(), then claims
// this client.  The 'controllerchange' event fires at that moment.
// We show a brief "Updating…" toast and reload so users always run the latest
// build without doing anything themselves.
if ('serviceWorker' in navigator) {
  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return
    reloading = true

    // Inject a small toast directly into the DOM so it works even if React
    // hasn't mounted yet (or is mid-render after the SW swap).
    const toast = Object.assign(document.createElement('div'), {
      id: 'sq-update-toast',
      innerHTML: '<span style="font-size:1.1em">⚡</span>&nbsp;Updating SatQuest…',
    })
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '90px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#0a0a14',
      border: '1px solid #2ad8ff',
      borderRadius: '12px',
      padding: '12px 22px',
      color: '#e8f4ff',
      fontSize: '14px',
      fontFamily: 'system-ui, sans-serif',
      letterSpacing: '0.02em',
      zIndex: '99999',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 0 24px #2ad8ff33',
      pointerEvents: 'none',
    })
    document.body.appendChild(toast)

    // Give the user a moment to see the toast, then reload.
    setTimeout(() => window.location.reload(), 2000)
  })
}
// ─────────────────────────────────────────────────────────────────────────────

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>,
)
