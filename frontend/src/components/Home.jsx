import Avatar from './Avatar'
import { LEVELS } from '../data/levels'
import s from './Home.module.css'

export default function Home({ avatar, username, sats, unlockedUpTo, onPlay }) {
  const pct = LEVELS.length > 0 ? Math.round((unlockedUpTo / LEVELS.length) * 100) : 0

  return (
    <div className={s.body}>
      <div className={s.bg} />

      {/* Logo */}
      <div className={s.logoWrap}>
        <p className={s.logo}>⚡ SatQuest</p>
        <p className={s.tagline}>Learn Bitcoin. Stack sats.</p>
      </div>

      {/* Player card */}
      <div className={s.card}>
        <Avatar avatar={avatar} size="xl" className={s.avatar} />
        <p className={s.username}>@{username}</p>

        <div className={s.satsRow}>
          <span className={s.satsNum}>{sats}</span>
          <span className={s.satsUnit}>⚡ sats</span>
        </div>

        <div className={s.progressWrap}>
          <div className={s.progressBar} style={{ width: `${pct}%` }} />
        </div>
        <p className={s.progressTxt}>{unlockedUpTo} / {LEVELS.length} levels done</p>
      </div>

      {/* Play */}
      <button className={s.playBtn} onClick={onPlay}>
        {unlockedUpTo === 0 ? 'Start Playing →' : 'Continue →'}
      </button>
    </div>
  )
}
