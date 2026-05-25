import s from './Card.module.css'

export default function Card({ emoji, label, state, onClick, kind, matchIdx, matchColor }) {
  const matchStyle = state === 'matched' && matchColor
    ? {
        borderColor: matchColor,
        background: matchColor + '1A',
        boxShadow: `0 0 14px ${matchColor}40`,
      }
    : undefined

  return (
    <button
      className={`${s.card} ${s[state] || ''} ${kind ? s[kind] : ''}`}
      onClick={onClick}
      disabled={state === 'matched'}
      style={matchStyle}
    >
      {/* match number badge — same number on both matched cards so you know the pair */}
      {matchIdx && (
        <span className={s.matchBadge} style={{ background: matchColor, color: '#08011a' }}>
          {matchIdx}
        </span>
      )}

      <span className={s.emoji}>{emoji}</span>
      <span className={s.label}>{label}</span>
    </button>
  )
}
