import { sound } from '../audio/SoundManager'
import s from './BottomNav.module.css'

const TABS = [
  { id: 'map', label: 'Quest', icon: '🗺️' },
  { id: 'wallet', label: 'Wallet', icon: '⚡' },
  { id: 'leaderboard', label: 'Ranks', icon: '🏆' },
  { id: 'profile', label: 'You', icon: '👤' },
]

/*
  BottomNav — floating glass tab bar with neon active state.
*/
export default function BottomNav({ phase, onTab }) {
  return (
    <nav className={s.nav}>
      {TABS.map((t) => {
        const active = phase === t.id
        return (
          <button
            key={t.id}
            className={`${s.tab} ${active ? s.active : ''}`}
            onMouseEnter={() => sound.hover()}
            onClick={() => { sound.tap(); onTab(t.id) }}
          >
            <span className={s.icon}>{t.icon}</span>
            <span className={s.label}>{t.label}</span>
            {active && <span className={s.dot} />}
          </button>
        )
      })}
    </nav>
  )
}
