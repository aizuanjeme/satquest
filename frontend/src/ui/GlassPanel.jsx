import s from './GlassPanel.module.css'

/*
  GlassPanel — frosted glassmorphism container with a soft neon edge.
  glow: 'blue' | 'purple' | 'none' (default 'none')
*/
export default function GlassPanel({ children, className = '', glow = 'none', style }) {
  return (
    <div className={`${s.panel} ${s['glow_' + glow]} ${className}`} style={style}>
      {children}
    </div>
  )
}
