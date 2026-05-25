import { useEffect, useState } from 'react'
import { profileApi } from '../lib/api'
import s from './BackupSeed.module.css'

/**
 * "Back up your wallet" sheet.
 * Fetches the 12-word mnemonic and walks the player through saving it.
 * Two-step UI:
 *   1. Big warning + "Show my recovery words" button.
 *   2. The words, copy button, "I saved it" confirmation.
 */
export default function BackupSeed({ username, onClose }) {
  const [stage, setStage]       = useState('warn')   // warn | reveal
  const [words, setWords]       = useState([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [copied, setCopied]     = useState(false)

  useEffect(() => {
    if (stage !== 'reveal' || words.length > 0) return
    setLoading(true)
    setError(null)
    profileApi.seed(username)
      .then(({ mnemonic }) => setWords(mnemonic.split(/\s+/)))
      .catch((e) => setError(e.message || 'Failed to load recovery words'))
      .finally(() => setLoading(false))
  }, [stage, username, words.length])

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(words.join(' '))
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* ignore */ }
  }

  return (
    <div className={s.backdrop} onClick={onClose}>
      <div className={s.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={s.handle} />

        <div className={s.header}>
          <p className={s.title}>🔑 Back up your wallet</p>
          <button className={s.x} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {stage === 'warn' && (
          <>
            <div className={s.warnBox}>
              <p className={s.warnTitle}>This is the ONLY way to recover your sats.</p>
              <ul className={s.warnList}>
                <li>If you clear browser data or change device, your wallet is gone.</li>
                <li>Anyone with these 12 words can spend your sats — keep them secret.</li>
                <li>Write them down or save in a password manager. Email is OK, screenshots are risky.</li>
                <li>You can also import them into Breez mobile or any BIP-39 wallet.</li>
              </ul>
            </div>
            <button className={s.primary} onClick={() => setStage('reveal')}>
              Show my recovery words →
            </button>
            <button className={s.secondary} onClick={onClose}>Not now</button>
          </>
        )}

        {stage === 'reveal' && (
          <>
            {loading && <p className={s.loading}>Loading your recovery words…</p>}
            {error && <p className={s.error}>{error}</p>}
            {!loading && !error && words.length > 0 && (
              <>
                <div className={s.grid}>
                  {words.map((w, i) => (
                    <div key={i} className={s.word}>
                      <span className={s.idx}>{i + 1}</span>
                      <span className={s.txt}>{w}</span>
                    </div>
                  ))}
                </div>
                <button className={s.primary} onClick={copy}>
                  {copied ? '✓ Copied' : 'Copy all 12 words'}
                </button>
                <button className={s.secondary} onClick={onClose}>
                  I've saved them safely
                </button>
                <p className={s.footHint}>
                  Tip: email them to yourself in a draft — never send to others.
                </p>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
