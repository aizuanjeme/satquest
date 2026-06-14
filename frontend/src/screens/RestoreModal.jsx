import { useState } from 'react'
import { profileApi } from '../core/APIClient'
import GlassPanel from '../ui/GlassPanel'
import NeonButton from '../ui/NeonButton'
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
      setError('Please paste exactly 12 words separated by spaces.')
      return
    }
    setBusy(true)
    try {
      const profile = await profileApi.restore(mnemonic)
      onRestored(profile)
    } catch (err) {
      setError(
        err?.status === 404
          ? 'No account matches these words. Check spelling and order.'
          : (err?.message || 'Restore failed. Please try again.'),
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
            <h3 className={s.title}>Restore Wallet</h3>
            <button className={s.x} onClick={onClose} aria-label="Close">✕</button>
          </div>
          <p className={s.intro}>
            Paste the 12 recovery words you saved. We'll bring back your handle,
            character, and Lightning balance.
          </p>
          <form onSubmit={handleSubmit}>
            <textarea
              className={s.input}
              value={text}
              onChange={(e) => { setText(e.target.value); setError(null) }}
              placeholder="word1 word2 word3 … word12"
              rows={4}
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              disabled={busy}
            />
            <p className={s.counter}>{wordCount} / 12 words</p>
            {error && <p className={s.error}>{error}</p>}
            <NeonButton type="submit" variant="purple" full disabled={busy || wordCount !== 12}>
              {busy ? 'Restoring…' : 'Restore →'}
            </NeonButton>
          </form>
        </div>
      </GlassPanel>
    </div>
  )
}
