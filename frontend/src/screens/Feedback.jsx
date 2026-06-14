import { useState } from 'react'
import { feedbackApi } from '../core/APIClient'
import { sound } from '../audio/SoundManager'
import GlassPanel from '../ui/GlassPanel'
import NeonButton from '../ui/NeonButton'
import s from './Feedback.module.css'

const CATEGORIES = [
  { id: 'general', label: '💬 General' },
  { id: 'bug', label: '🐛 Bug' },
  { id: 'suggestion', label: '💡 Suggestion' },
  { id: 'other', label: '✨ Other' },
]

/*
  Feedback — submit feedback via feedbackApi.submit. Logic preserved
  (rating, category, message validation). Cinematic re-skin.
*/
export default function Feedback({ username, onClose }) {
  const [message, setMessage] = useState('')
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  const submit = async () => {
    if (!message.trim() || message.trim().length < 3) {
      setError('Please write at least a few words.')
      return
    }
    setLoading(true); setError(null)
    try {
      await feedbackApi.submit({
        username,
        message: message.trim(),
        ...(rating ? { rating } : {}),
        ...(category ? { category } : {}),
      })
      setDone(true); sound.success()
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={s.backdrop} onClick={onClose}>
      <GlassPanel glow="purple" className={s.sheet}>
        <div onClick={(e) => e.stopPropagation()}>
          <div className={s.header}>
            <h3 className={s.title}>Send Feedback</h3>
            <button className={s.x} onClick={onClose} aria-label="Close">✕</button>
          </div>

          {done ? (
            <div className={s.success}>
              <p className={s.successIcon}>🎉</p>
              <p className={s.successTitle}>Thanks for the feedback!</p>
              <p className={s.successSub}>We read every message and use it to make SatQuest better.</p>
              <NeonButton variant="purple" full onClick={onClose}>Done</NeonButton>
            </div>
          ) : (
            <>
              <p className={s.label}>How are you finding SatQuest?</p>
              <div className={s.stars}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    className={`${s.star} ${n <= (hovered || rating) ? s.starOn : ''}`}
                    onClick={() => { sound.tap(); setRating(n) }}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    aria-label={`${n} star${n > 1 ? 's' : ''}`}
                  >★</button>
                ))}
              </div>

              <p className={s.label}>Category</p>
              <div className={s.pills}>
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    className={`${s.pill} ${category === c.id ? s.pillOn : ''}`}
                    onClick={() => { sound.tap(); setCategory(category === c.id ? '' : c.id) }}
                  >{c.label}</button>
                ))}
              </div>

              <p className={s.label}>Your message <span className={s.req}>*</span></p>
              <textarea
                className={s.textarea}
                rows={4}
                maxLength={2000}
                placeholder="Tell us what you think, report a bug, or share an idea…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <p className={s.count}>{message.length} / 2000</p>

              {error && <p className={s.error}>{error}</p>}

              <NeonButton variant="purple" full disabled={loading} onClick={submit}>
                {loading ? 'Sending…' : 'Send feedback →'}
              </NeonButton>
            </>
          )}
        </div>
      </GlassPanel>
    </div>
  )
}
