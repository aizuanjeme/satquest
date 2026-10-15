import { sound } from '../audio/SoundManager'
import { t } from '../i18n'
import s from './BottomNav.module.css'

const TABS = [
  { id: 'map', icon: '🗺️' },
  { id: 'wallet', icon: '⚡' },
  { id: 'leaderboard', icon: '🏆' },
  { id: 'profile', icon: '👤' },
]

/*
  BottomNav — floating glass tab bar with neon active state.
*/
export default function BottomNav({ phase, onTab }) {
  return (
    <nav className={s.nav}>
      {TABS.map((tab) => {
        const active = phase === tab.id
        return (
          <button
            key={tab.id}
            data-tour={`nav-${tab.id}`}
            className={`${s.tab} ${active ? s.active : ''}`}
            onMouseEnter={() => sound.hover()}
            onClick={() => { sound.tap(); onTab(tab.id) }}
          >
            <span className={s.icon}>{tab.icon}</span>
            <span className={s.label}>{t(`tab.${tab.id}`)}</span>
            {active && <span className={s.dot} />}
          </button>
        )
      })}
    </nav>
  )
}
