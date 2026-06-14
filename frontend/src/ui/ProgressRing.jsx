import s from './ProgressRing.module.css'

/*
  ProgressRing — animated SVG ring for completion / timers.
  value: 0..1
*/
export default function ProgressRing({
  value = 0, size = 56, stroke = 5, color = '#2ad8ff', track = 'rgba(120,160,255,0.15)', children,
}) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(1, value))
  const dash = circ * clamped
  return (
    <div className={s.wrap} style={{ width: size, height: size }}>
      <svg width={size} height={size} className={s.svg}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ filter: `drop-shadow(0 0 5px ${color})`, transition: 'stroke-dasharray 0.5s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className={s.center}>{children}</div>
    </div>
  )
}
