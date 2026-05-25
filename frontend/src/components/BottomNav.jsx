import s from './BottomNav.module.css'

const TABS = [
  { id: 'map',         label: 'Map',      icon: '🗺️' },
  { id: 'wallet',      label: 'Wallet',   icon: '⚡' },
  { id: 'leaderboard', label: 'Rankings', icon: '🏆' },
]

export default function BottomNav({ phase, onTab }) {
  return (
    <nav className={s.nav}>
      {TABS.map(tab => {
        const active = phase === tab.id
        return (
          <button
            key={tab.id}
            className={`${s.tab} ${active ? s.active : ''}`}
            onClick={() => onTab(tab.id)}
          >
            {active && <span className={s.indicator} />}
            <span className={s.icon}>{tab.icon}</span>
            <span className={s.label}>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
