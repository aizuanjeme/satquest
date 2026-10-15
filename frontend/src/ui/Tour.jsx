import { useEffect, useLayoutEffect, useState, useCallback } from 'react'
import { sound } from '../audio/SoundManager'
import { t } from '../i18n'
import s from './Tour.module.css'

/*
  Tour — a first-run guided walkthrough ("coach marks").

  Each step can spotlight a real on-screen element (matched by a
  `data-tour="<anchor>"` attribute) and float an explainer card next to it.
  Steps without an anchor render as a centred welcome / finish card.

  Props:
   - steps:  [{ anchor?, emoji?, title, body }]
   - onDone: called when the player finishes or skips the tour.
*/
const PAD = 10          // spotlight padding around the target
const CARD_GAP = 16     // gap between spotlight and the card

export default function Tour({ steps, onDone }) {
  const [i, setI] = useState(0)
  const [rect, setRect] = useState(null) // target bounds, or null for centred
  const step = steps[i]
  const isLast = i === steps.length - 1

  // Measure the current step's anchor element (re-measure on resize).
  const measure = useCallback(() => {
    if (!step?.anchor) { setRect(null); return }
    const el = document.querySelector(`[data-tour="${step.anchor}"]`)
    if (!el) { setRect(null); return }
    const r = el.getBoundingClientRect()
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [step])

  useLayoutEffect(() => {
    measure()
    // The 3D map / fonts can settle a frame later — re-measure shortly after.
    const id = setTimeout(measure, 120)
    return () => clearTimeout(id)
  }, [measure])

  useEffect(() => {
    window.addEventListener('resize', measure)
    window.addEventListener('orientationchange', measure)
    return () => {
      window.removeEventListener('resize', measure)
      window.removeEventListener('orientationchange', measure)
    }
  }, [measure])

  const next = useCallback(() => {
    sound.tap()
    if (isLast) { onDone?.(); return }
    setI((n) => n + 1)
  }, [isLast, onDone])

  const back = useCallback(() => {
    sound.tap()
    setI((n) => Math.max(0, n - 1))
  }, [])

  const skip = useCallback(() => { sound.tap(); onDone?.() }, [onDone])

  // Keyboard: → / Enter advance, Esc skips.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') skip()
      else if (e.key === 'Enter' || e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, back, skip])

  // ── Spotlight geometry ──────────────────────────────────────────────────
  const spot = rect && {
    top: rect.top - PAD,
    left: rect.left - PAD,
    width: rect.width + PAD * 2,
    height: rect.height + PAD * 2,
  }

  // Decide whether the card sits below or above the spotlight.
  let cardStyle = {}
  let placement = 'center'
  if (spot) {
    const vh = window.innerHeight
    const below = vh - (spot.top + spot.height)
    placement = below > 240 ? 'below' : 'above'
    cardStyle = placement === 'below'
      ? { top: spot.top + spot.height + CARD_GAP }
      : { bottom: vh - spot.top + CARD_GAP }
  }

  return (
    <div className={s.root} role="dialog" aria-modal="true" aria-label={t('tour.aria')}>
      {/* Dim layer. With a spotlight the dark surround comes from the ring's
          huge box-shadow, so the base layer stays transparent there. */}
      <div className={`${s.scrim} ${spot ? s.scrimClear : ''}`} onClick={skip} />

      {spot && (
        <div
          className={s.ring}
          style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
        />
      )}

      <div
        className={`${s.card} ${spot ? s.cardAnchored : s.cardCenter} ${placement === 'above' ? s.cardAbove : ''}`}
        style={cardStyle}
      >
        <button className={s.close} onClick={skip} aria-label={t('tour.skipAria')}>✕</button>

        {step.emoji && <div className={s.emoji}>{step.emoji}</div>}
        <h3 className={s.title}>{step.title}</h3>
        <p className={s.body}>{step.body}</p>

        <div className={s.dots}>
          {steps.map((_, d) => (
            <span key={d} className={`${s.dot} ${d === i ? s.dotOn : ''}`} />
          ))}
        </div>

        <div className={s.actions}>
          {i > 0
            ? <button className={s.back} onClick={back}>{t('common.back')}</button>
            : <button className={s.back} onClick={skip}>{t('common.skip')}</button>}
          <button className={s.next} onClick={next}>
            {isLast ? t('tour.go') : t('common.next')}
          </button>
        </div>
      </div>
    </div>
  )
}
