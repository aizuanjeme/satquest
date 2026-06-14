import { createContext, useContext, useState, useEffect } from 'react'

export const THEMES = [
  {
    id: 'dark',
    label: 'Space Dark',
    emoji: '🌌',
    colors: ['#050505', '#2ad8ff', '#9945ff', '#f7c948'],
    desc: 'Deep space. Neon glow.',
  },
  {
    id: 'light',
    label: 'Clean Light',
    emoji: '☀️',
    colors: ['#f0f4ff', '#0077cc', '#5522cc', '#e8a000'],
    desc: 'Bright & crisp.',
  },
  {
    id: 'market',
    label: 'Market',
    emoji: '📈',
    colors: ['#060d06', '#00ff41', '#ff1744', '#f7c948'],
    desc: 'Trading terminal.',
  },
  {
    id: 'bank',
    label: 'Bank Vault',
    emoji: '🏦',
    colors: ['#05080f', '#c8a84b', '#4a90d9', '#ffffff'],
    desc: 'Classic & formal.',
  },
  {
    id: 'rainy',
    label: 'Rainy City',
    emoji: '🌧️',
    colors: ['#060a10', '#4fc3f7', '#546e7a', '#90a4ae'],
    desc: 'Moody & cool.',
  },
  {
    id: 'disco',
    label: 'Disco',
    emoji: '🪩',
    colors: ['#0d0010', '#ff00ff', '#00ffff', '#ffff00'],
    desc: 'Party mode. 🎉',
  },
]

const ThemeContext = createContext({ theme: 'dark', setTheme: () => {} })
export const useTheme = () => useContext(ThemeContext)

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    try { return localStorage.getItem('satquest.theme') || 'dark' } catch { return 'dark' }
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('satquest.theme', theme) } catch {}
    // Notify ThreeScene
    window.dispatchEvent(new CustomEvent('satquest:theme', { detail: theme }))
  }, [theme])

  // Apply on mount immediately
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, []) // eslint-disable-line

  const setTheme = (id) => {
    setThemeState(id)
    window.dispatchEvent(new CustomEvent('satquest:theme', { detail: id }))
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
