import { useState } from 'react'
import s from './ShareEarn.module.css'

/*
  ShareEarn — "Share your achievement and earn +2 sats".

  Shown on the Reveal screen after each completed level.
  Flow:
    1. Player taps "Share on X" → Twitter intent opens in new tab
    2. A confirmation prompt appears: "Did you post it?"
    3. Only on "Yes, I posted!" is the reward given
  Instagram copies the caption to clipboard; same confirm flow.
  Reward is tracked per level in localStorage so replays can't double-earn.
*/

const SHARE_KEY = 'satquest.shared'

function alreadyShared(levelIdx) {
  try {
    const raw = localStorage.getItem(SHARE_KEY) || ''
    return raw.split(',').includes(String(levelIdx))
  } catch {
    return false
  }
}

function markShared(levelIdx) {
  try {
    const existing = (localStorage.getItem(SHARE_KEY) || '').split(',').filter(Boolean)
    const next = [...new Set([...existing, String(levelIdx)])]
    localStorage.setItem(SHARE_KEY, next.join(','))
  } catch { /* ignore */ }
}

function buildTweet(level) {
  const title   = level.title  || 'Bitcoin'
  const summary = level.story  || 'Bitcoin education that pays you real sats.'
  const text =
    `🧡 Just leveled up on SatQuest!\n\n` +
    `"${title}"\n${summary}\n\n` +
    `Bitcoin education that rewards you with real sats ⚡\n\n` +
    `@Bitcoin #Bitcoin #LearnBitcoin #Lightning #SatQuest`
  return `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`
}

function buildCaption(level) {
  const title   = level.title || 'Bitcoin'
  const summary = level.story || 'Bitcoin education that pays you real sats.'
  return (
    `🧡 Just leveled up on SatQuest!\n\n` +
    `"${title}"\n${summary}\n\n` +
    `Bitcoin education that rewards you with real sats ⚡\n\n` +
    `#Bitcoin #LearnBitcoin #Lightning #Sats #BitcoinEducation #SatQuest #LightningNetwork`
  )
}

export default function ShareEarn({ level, levelIdx, username, onEarn }) {
  const [done, setDone]         = useState(() => alreadyShared(levelIdx))
  // 'idle' | 'confirming-x' | 'confirming-ig'
  const [step, setStep]         = useState('idle')

  const confirm = () => {
    markShared(levelIdx)
    setDone(true)
    setStep('idle')
    onEarn()
  }

  const cancel = () => setStep('idle')

  const shareX = () => {
    window.open(buildTweet(level), '_blank', 'noopener')
    setStep('confirming-x')
  }

  const copyCaption = async () => {
    try {
      await navigator.clipboard.writeText(buildCaption(level))
    } catch { /* clipboard blocked — still allow confirm */ }
    setStep('confirming-ig')
  }

  /* ── Already earned ── */
  if (done) {
    return (
      <div className={`${s.card} ${s.cardDone}`}>
        <div className={s.header}>
          <span className={s.megaphone}>📣</span>
          <div className={s.headerText}>
            <p className={s.title}>Share &amp; Earn</p>
            <p className={s.sub}>Thanks for spreading the word! ⚡</p>
          </div>
          <span className={s.badge}>+2 ⚡</span>
        </div>
      </div>
    )
  }

  /* ── Confirmation step ── */
  if (step === 'confirming-x' || step === 'confirming-ig') {
    const platform = step === 'confirming-x' ? 'X (Twitter)' : 'Instagram'
    return (
      <div className={s.card}>
        <div className={s.header}>
          <span className={s.megaphone}>❓</span>
          <div className={s.headerText}>
            <p className={s.title}>Did you post it?</p>
            <p className={s.sub}>Confirm to earn your <b>+2 sats</b></p>
          </div>
        </div>
        <div className={s.btns}>
          <button className={`${s.btn} ${s.confirmBtn}`} onClick={confirm}>
            ✅ Yes, I posted!
          </button>
          <button className={`${s.btn} ${s.cancelBtn}`} onClick={cancel}>
            Not yet
          </button>
        </div>
      </div>
    )
  }

  /* ── Default: share buttons ── */
  return (
    <div className={s.card}>
      <div className={s.header}>
        <span className={s.megaphone}>📣</span>
        <div className={s.headerText}>
          <p className={s.title}>Share &amp; Earn</p>
          <p className={s.sub}>Post your achievement · earn <b>+2 sats</b></p>
        </div>
      </div>

      <p className={s.preview}>
        "{level.title}" — {level.story}
      </p>

      <div className={s.btns}>
        <button className={`${s.btn} ${s.xBtn}`} onClick={shareX}>
          <span className={s.xLogo}>𝕏</span> Share on X
        </button>
        <button className={`${s.btn} ${s.igBtn}`} onClick={copyCaption}>
          📷 Copy for Instagram
        </button>
      </div>
    </div>
  )
}

