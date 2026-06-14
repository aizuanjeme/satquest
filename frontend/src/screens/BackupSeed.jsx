import { useEffect, useState } from 'react'
import { profileApi } from '../core/APIClient'
import { sound } from '../audio/SoundManager'
import GlassPanel from '../ui/GlassPanel'
import NeonButton from '../ui/NeonButton'
import s from './BackupSeed.module.css'

/*
  BackupSeed — reveal the 12-word recovery phrase. Same logic as the original:
  warn → fetch via profileApi.seed → display + copy. Cinematic re-skin only.
*/
export default function BackupSeed({ username, onClose }) {
  const [stage, setStage] = useState('warn')
  const [words, setWords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (stage !== 'reveal' || words.length > 0) return
    setLoading(true); setError(null)
    profileApi.seed(username)
      .then(({ mnemonic }) => setWords(mnemonic.split(/\s+/)))
      .catch((e) => setError(e.message || 'Failed to load recovery words'))
      .finally(() => setLoading(false))
  }, [stage, username, words.length])

  const copy = async () => {
    try {
      await navigator.clipboard?.writeText(words.join(' '))
      setCopied(true); sound.click()
      setTimeout(() => setCopied(false), 1500)
    } catch { /* ignore */ }
  }

  return (
    <div className={s.backdrop} onClick={onClose}>
      <GlassPanel glow="purple" className={s.sheet}>
        <div onClick={(e) => e.stopPropagation()}>
          <div className={s.header}>
            <h3 className={s.title}>Recovery Words</h3>
            <button className={s.x} onClick={onClose} aria-label="Close">✕</button>
          </div>

          {stage === 'warn' && (
            <>
              <div className={s.warn}>
                <p className={s.warnTitle}>The ONLY way to recover your sats.</p>
                <ul className={s.warnList}>
                  <li>Clear browser data or change device, and the wallet is gone without these.</li>
                  <li>Anyone with these 12 words can spend your sats — keep them secret.</li>
                  <li>Write them down or store in a password manager. Screenshots are risky.</li>
                  <li>Importable into any BIP-39 wallet.</li>
                </ul>
              </div>
              <NeonButton variant="gold" full onClick={() => { sound.tap(); setStage('reveal') }}>
                Show my words →
              </NeonButton>
            </>
          )}

          {stage === 'reveal' && (
            <>
              {loading && <p className={s.loading}>Loading…</p>}
              {error && <p className={s.error}>{error}</p>}
              {!loading && !error && words.length > 0 && (
                <>
                  <div className={s.grid}>
                    {words.map((w, i) => (
                      <div key={i} className={s.word}><span className={s.idx}>{i + 1}</span><span>{w}</span></div>
                    ))}
                  </div>
                  <NeonButton variant="blue" full onClick={copy}>{copied ? '✓ Copied' : 'Copy all 12 words'}</NeonButton>
                  <button className={s.saved} onClick={() => { sound.tap(); onClose() }}>I've saved them safely</button>
                </>
              )}
            </>
          )}
        </div>
      </GlassPanel>
    </div>
  )
}
