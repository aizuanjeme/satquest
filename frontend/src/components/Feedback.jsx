import { useState } from 'react'
import { feedbackApi } from '../lib/api'
import s from './Feedback.module.css'

const CATEGORIES = [
  { id: 'general',    label: '💬 General' },
  { id: 'bug',        label: '🐛 Bug' },
  { id: 'suggestion', label: '💡 Suggestion' },
  { id: 'other',      label: '✨ Other' },
]

export default function Feedback({ username, onClose }) {
  const [message,  setMessage]  = useState('')
  const [rating,   setRating]   = useState(0)
  const [hovered,  setHovered]  = useState(0)
  const [category, setCategory] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState(null)
  const [done,     setDone]     = useState(false)

  const submit = async () => {
    if (!message.trim() || message.trim().length < 3) {
      setError('Please write at least a few words.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await feedbackApi.submit({
        username,
        message: message.trim(),
        ...(rating   ? { rating }   : {}),
        ...(category ? { category } : {}),
      })
      setDone(true)
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={s.backdrop} onClick={onClose}>
      <div className={s.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={s.handle} />

        <div className={s.header}>
          <p className={s.title}>💬 Send Feedback</p>
          <button className={s.x} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {done ? (
          <div className={s.successBox}>
            <p className={s.successIcon}>🎉</p>
            <p className={s.successTitle}>Thanks for the feedback!</p>
            <p className={s.successSub}>We read every message and use it to make SatQuest better.</p>
            <button className={s.primary} onClick={onClose}>Done</button>
          </div>
        ) : (
          <>
            {/* Star rating */}
            <p className={s.label}>How are you finding SatQuest?</p>
            <div className={s.stars}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  className={`${s.star} ${n <= (hovered || rating) ? s.starOn : ''}`}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHovered(n)}
                  onMouseLeave={() => setHovered(0)}
                  aria-label={`${n} star${n > 1 ? 's' : ''}`}
                >
                  ★
                </button>
              ))}
            </div>

            {/* Category pills */}
            <p className={s.label}>Category</p>
            <div className={s.pills}>
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  className={`${s.pill} ${category === c.id ? s.pillOn : ''}`}
                  onClick={() => setCategory(category === c.id ? '' : c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Message */}
            <p className={s.label}>Your message <span className={s.required}>*</span></p>
            <textarea
              className={s.textarea}
              rows={4}
              maxLength={2000}
              placeholder="Tell us what you think, report a bug, or share an idea…"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <p className={s.charCount}>{message.length} / 2000</p>

            {error && <p className={s.error}>{error}</p>}

            <button
              className={s.primary}
              onClick={submit}
              disabled={loading}
            >
              {loading ? 'Sending…' : 'Send feedback →'}
            </button>
            <button className={s.secondary} onClick={onClose}>Cancel</button>
          </>
        )}
      </div>
    </div>
  )
}
