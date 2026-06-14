import s from './LevelIndicator.module.css'

/*
  LevelIndicator — current stage badge + label for the in-game HUD.
*/
export default function LevelIndicator({ index, total, label, type = 'match' }) {
  return (
    <div className={`${s.wrap} ${s['t_' + type]}`}>
      <div className={s.badge}>{String(index + 1).padStart(2, '0')}</div>
      <div className={s.meta}>
        <span className={s.label}>{label}</span>
        <span className={s.count}>Level {index + 1} / {total}</span>
      </div>
    </div>
  )
}
