import { useState } from 'react'
import { profileApi } from '../core/APIClient'
import GlassPanel from '../ui/GlassPanel'
import NeonButton from '../ui/NeonButton'
import { t } from '../i18n'
import s from './RestoreModal.module.css'

/*
  RestoreModal — cinematic re-skin of the restore flow.
  Same logic as the original: paste 12 words, call profileApi.restore.
*/
export default function RestoreModal({ onClose, onRestored }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    setError(null)
    const mnemonic = text.trim().toLowerCase().replace(/\s+/g, ' ')
    if (mnemonic.split(' ').length !== 12) {
      setError(t('restore.need12'))
      return
    }
    setBusy(true)
    try {
      const profile = await profileApi.restore(mnemonic)
      onRestored(profile)
    } catch (err) {
      setError(
        err?.status === 404
          ? t('restore.notFound')
          : (err?.message || t('restore.failed')),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={s.backdrop} onClick={onClose}>
      <GlassPanel glow="purple" className={s.sheet} >
        <div onClick={(e) => e.stopPropagation()}>
          <div className={s.header}>
            <h3 className={s.title}>{t('restore.title')}</h3>
            <button className={s.x} onClick={onClose} aria-label={t('common.close')}>✕</button>
          </div>
          <p className={s.intro}>{t('restore.intro')}</p>
          <form onSubmit={handleSubmit}>
            <textarea
              className={s.input}
              value={text}
              onChange={(e) => { setText(e.target.value); setError(null) }}
              placeholder={t('restore.placeholder')}
              rows={4}
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              disabled={busy}
            />
            <p className={s.counter}>{t('restore.count', { n: wordCount })}</p>
            {error && <p className={s.error}>{error}</p>}
            <NeonButton type="submit" variant="purple" full disabled={busy || wordCount !== 12}>
              {busy ? t('restore.busy') : t('restore.submit')}
            </NeonButton>
          </form>
        </div>
      </GlassPanel>
    </div>
  )
}
