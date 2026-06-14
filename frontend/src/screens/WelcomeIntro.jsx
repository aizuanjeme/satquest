import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import Avatar from '../ui/Avatar'
import NeonButton from '../ui/NeonButton'
import { sound } from '../audio/SoundManager'
import s from './WelcomeIntro.module.css'

const LINES = [
  'Bitcoin is the money of the future.',
  'You will learn it — one quest at a time.',
  'Clear levels. Earn real sats.',
]

/*
  WelcomeIntro — cinematic, sequenced welcome after character pick.
*/
export default function WelcomeIntro({ avatar, username, onDone }) {
  const rootRef = useRef(null)
  const lineRefs = useRef([])

  useEffect(() => {
    const tl = gsap.timeline()
    tl.from(`.${s.av}`, { scale: 0.4, opacity: 0, duration: 0.9, ease: 'back.out(1.7)' })
      .from(`.${s.name}`, { y: 20, opacity: 0, duration: 0.6 }, '-=0.3')
    lineRefs.current.forEach((el, i) => {
      if (el) tl.from(el, { y: 16, opacity: 0, duration: 0.5 }, i === 0 ? '-=0.1' : '-=0.2')
    })
    tl.from(`.${s.cta}`, { y: 20, opacity: 0, duration: 0.5 }, '-=0.1')
  }, [])

  return (
    <div className={s.body} ref={rootRef}>
      <div className={s.av}><Avatar avatar={avatar} size={120} /></div>
      <p className={s.name}>Welcome, @{username}</p>
      <div className={s.lines}>
        {LINES.map((l, i) => (
          <p key={i} ref={(el) => (lineRefs.current[i] = el)} className={s.line}>{l}</p>
        ))}
      </div>
      <div className={s.cta}>
        <NeonButton variant="blue" onClick={() => { sound.success(); onDone() }}>
          Open the Map →
        </NeonButton>
      </div>
    </div>
  )
}
