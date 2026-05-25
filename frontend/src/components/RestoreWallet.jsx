import { useState } from 'react'
import { profileApi } from '../lib/api'
import s from './RestoreWallet.module.css'

/**
 * Restore an existing account on a new device.
 * The user pastes their 12-word mnemonic; the server resolves the matching
 * profile and we hydrate localStorage with it.
 */
export default function RestoreWallet({ onClose, onRestored }) {
  const [text, setText]       = useState('')
  const [busy, setBusy]       = useState(false)
  const [error, setError]     = useState(null)

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
    } catch (e) {
      setError(
        e?.status === 404
          ? 'No account matches these words. Double-check spelling and order.'
          : (e?.message || 'Restore failed. Please try again.'),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={s.backdrop} onClick={onClose}>
      <div className={s.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={s.handle} />

        <div className={s.header}>
          <p className={s.title}>🔑 Restore your wallet</p>
          <button className={s.x} onClick={onClose} aria-label="Close">✕</button>
        </div>

        <p className={s.intro}>
          Paste the 12 recovery words you saved. We'll bring back your
          username, avatar, and Lightning balance.
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

          <button
            type="submit"
            className={s.primary}
            disabled={busy || wordCount !== 12}
          >
            {busy ? 'Restoring…' : 'Restore wallet →'}
          </button>
          <button
            type="button"
            className={s.secondary}
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  )
}
