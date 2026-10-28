import { useEffect, useState } from 'react'
import { sound } from '../audio/SoundManager'
import { t } from '../i18n'
import s from '../screens/larp/Larp.module.css'

/*
  Bitty the owl — the LARP's guide for young players.

  Shows the current coaching step in a speech bubble, reads it aloud with the
  browser's speech synthesis (so children who can't read yet can play), and
  bounces a 👆 pointer over the element tagged data-coach="<point>".
*/

const VOICE_KEY = 'satquest.larp.voice'

function voiceOn() {
  try { return localStorage.getItem(VOICE_KEY) !== '0' } catch { return true }
}

/** Read text aloud, skipping emoji. Silently does nothing where unsupported. */
export function speak(text) {
  try {
    if (!voiceOn() || !window.speechSynthesis) return
    const u = new SpeechSynthesisUtterance(text.replace(/\p{Extended_Pictographic}|️/gu, ''))
    u.rate = 0.9
    u.pitch = 1.15
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(u)
  } catch { /* speech is a nice-to-have */ }
}

export function stopSpeaking() {
  try { window.speechSynthesis?.cancel() } catch { /* ignore */ }
}

/** First step that isn't done yet (the last step is the resting message). */
export function currentStep(steps = [], state, ui) {
  return steps.find((st) => !st.done(state, ui)) || null
}

export function Coach({ step, active }) {
  const [voice, setVoice] = useState(voiceOn)
  const [box, setBox] = useState(null)
  const [mini, setMini] = useState(false)
  const say = step?.say

  // A new step always pops Bitty back open.
  useEffect(() => { setMini(false) }, [say])

  // Speak + scroll the target into view whenever the step changes.
  useEffect(() => {
    if (!active || !say) return undefined
    speak(say)
    const el = document.querySelector(`[data-coach="${step.point}"]`)
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    return undefined
  }, [say, active]) // eslint-disable-line

  useEffect(() => () => stopSpeaking(), [])

  // Track the target's position for the bouncing pointer.
  useEffect(() => {
    if (!active || !step?.point) { setBox(null); return undefined }
    const measure = () => {
      const el = document.querySelector(`[data-coach="${step.point}"]`)
      const r = el?.getBoundingClientRect()
      setBox(r && r.width ? { x: r.left + Math.min(r.width / 2, 60), y: r.bottom } : null)
    }
    measure()
    const id = setInterval(measure, 300)
    return () => clearInterval(id)
  }, [step?.point, active])

  if (!active || !step) return null

  const toggleVoice = () => {
    const next = !voice
    try { localStorage.setItem(VOICE_KEY, next ? '1' : '0') } catch { /* ignore */ }
    setVoice(next)
    if (next) speak(say)
    else stopSpeaking()
  }

  return (
    <>
      {box && box.y > 0 && box.y < window.innerHeight - 40 && (
        <span className={s.pointer} style={{ left: box.x, top: box.y }} aria-hidden>👆</span>
      )}
      {mini ? (
        <button className={s.owlMini} onClick={() => { sound.tap(); setMini(false); speak(say) }} aria-label={t('larp.coach.open')}>🦉</button>
      ) : (
      <div className={s.coach} role="status" aria-live="polite">
        <button className={`${s.owl} ${s.owlBtn}`} onClick={() => { sound.tap(); setMini(true) }} aria-label={t('larp.coach.hide')}>🦉</button>
        <p className={s.coachText}>{say}</p>
        <div className={s.coachBtns}>
          <button className={s.coachBtn} onClick={() => { sound.tap(); speak(say) }} aria-label={t('larp.coach.again')}>🔊</button>
          <button className={s.coachBtn} onClick={toggleVoice} aria-label={t('larp.coach.voice')}>{voice ? '🗣️' : '🔇'}</button>
        </div>
      </div>
      )}
    </>
  )
}
