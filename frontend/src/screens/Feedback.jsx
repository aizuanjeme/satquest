import { useState } from 'react'
import { feedbackApi } from '../core/APIClient'
import { sound } from '../audio/SoundManager'
import GlassPanel from '../ui/GlassPanel'
import NeonButton from '../ui/NeonButton'
import { t, tn } from '../i18n'
import s from './Feedback.module.css'

const CATEGORIES = ['general', 'bug', 'suggestion', 'other']

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
      setError(t('fb.tooShort'))
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
      setError(e.message || t('fb.failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={s.backdrop} onClick={onClose}>
      <GlassPanel glow="purple" className={s.sheet}>
        <div onClick={(e) => e.stopPropagation()}>
          <div className={s.header}>
            <h3 className={s.title}>{t('fb.title')}</h3>
            <button className={s.x} onClick={onClose} aria-label={t('common.close')}>✕</button>
          </div>

          {done ? (
            <div className={s.success}>
              <p className={s.successIcon}>🎉</p>
              <p className={s.successTitle}>{t('fb.thanks')}</p>
              <p className={s.successSub}>{t('fb.thanksSub')}</p>
              <NeonButton variant="purple" full onClick={onClose}>{t('common.done')}</NeonButton>
            </div>
          ) : (
            <>
              <p className={s.label}>{t('fb.rateLabel')}</p>
              <div className={s.stars}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    className={`${s.star} ${n <= (hovered || rating) ? s.starOn : ''}`}
                    onClick={() => { sound.tap(); setRating(n) }}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    aria-label={tn('fb.stars', n)}
                  >★</button>
                ))}
              </div>

              <p className={s.label}>{t('fb.category')}</p>
              <div className={s.pills}>
                {CATEGORIES.map((id) => (
                  <button
                    key={id}
                    className={`${s.pill} ${category === id ? s.pillOn : ''}`}
                    onClick={() => { sound.tap(); setCategory(category === id ? '' : id) }}
                  >{t(`fb.cat.${id}`)}</button>
                ))}
              </div>

              <p className={s.label}>{t('fb.message')} <span className={s.req}>*</span></p>
              <textarea
                className={s.textarea}
                rows={4}
                maxLength={2000}
                placeholder={t('fb.placeholder')}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <p className={s.count}>{message.length} / 2000</p>

              {error && <p className={s.error}>{error}</p>}

              <NeonButton variant="purple" full disabled={loading} onClick={submit}>
                {loading ? t('common.sending') : t('fb.send')}
              </NeonButton>
            </>
          )}
        </div>
      </GlassPanel>
    </div>
  )
}
