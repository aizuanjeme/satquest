import s from './ScoreDisplay.module.css'

/*
  ScoreDisplay — animated sats counter with a lightning glyph + glow.
*/
export default function ScoreDisplay({ sats = 0, compact = false }) {
  return (
    <div className={`${s.wrap} ${compact ? s.compact : ''}`}>
      <span className={s.bolt}>⚡</span>
      <span className={s.num}>{sats.toLocaleString()}</span>
      {!compact && <span className={s.unit}>sats</span>}
    </div>
  )
}
