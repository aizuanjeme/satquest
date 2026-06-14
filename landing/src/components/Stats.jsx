import { useEffect, useRef } from 'react'
import s from './Stats.module.css'

const STATS = [
  { value: 37,   suffix: '',  label: 'Progressive Levels', col: '#2ad8ff', glow: 'rgba(42,216,255,0.4)',  delay: '0s'   },
  { value: 38,   suffix: '',  label: 'Unique Avatars',     col: '#f7c948', glow: 'rgba(247,201,72,0.4)', delay: '0.1s' },
  { value: null, display:'∞', label: 'Sats to Earn',       col: '#b07bff', glow: 'rgba(153,69,255,0.4)', delay: '0.2s' },
  { value: 2,    suffix: '',  label: 'Game Modes',         col: '#2bd47a', glow: 'rgba(43,212,122,0.4)', delay: '0.3s' },
]

function StatCard({ value, display, suffix = '', label, col, glow, delay }) {
  const numRef = useRef(null)

  useEffect(() => {
    if (!value || !numRef.current) return
    const el = numRef.current
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        const dur = 1400
        const start = performance.now()
        const tick = (now) => {
          const prog = Math.min((now - start) / dur, 1)
          const ease = 1 - Math.pow(1 - prog, 3)
          el.textContent = Math.round(ease * value) + suffix
          if (prog < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
        io.unobserve(el)
      })
    }, { threshold: 0.6 })
    io.observe(el)
    return () => io.disconnect()
  }, [value, suffix])

  return (
    <div className={s.card} style={{ animationDelay: delay, '--glow': glow }}>
      {/* Corner accent */}
      <div className={s.corner} style={{ background: glow }} />
      <div
        ref={numRef}
        className={s.num}
        style={{ color: col, textShadow: `0 0 20px ${col}88` }}
      >
        {display ?? (value + suffix)}
      </div>
      <div className={s.label}>{label}</div>
      {/* Bottom glow line */}
      <div className={s.line} style={{ background: col }} />
    </div>
  )
}

export default function Stats() {
  return (
    <section id="stats" className={`section ${s.section}`}>
      <p className="section-kicker" style={{ textAlign: 'center' }}>By the numbers</p>
      <div className={s.grid}>
        {STATS.map((st, i) => <StatCard key={i} {...st} />)}
      </div>
    </section>
  )
}
