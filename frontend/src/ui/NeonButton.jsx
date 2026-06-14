import { useRef } from 'react'
import { sound } from '../audio/SoundManager'
import s from './NeonButton.module.css'

/*
  NeonButton — glassy, glowing CTA with hover blip + click sound.
  variant: 'blue' (default) | 'purple' | 'gold' | 'ghost'
*/
export default function NeonButton({
  children, onClick, variant = 'blue', className = '', disabled, type = 'button', full,
}) {
  const ref = useRef(null)
  const handleClick = (e) => {
    if (disabled) return
    sound.click()
    onClick?.(e)
  }
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onMouseEnter={() => !disabled && sound.hover()}
      onClick={handleClick}
      className={`${s.btn} ${s[variant]} ${full ? s.full : ''} ${className}`}
    >
      <span className={s.label}>{children}</span>
      <span className={s.sheen} />
    </button>
  )
}
