import { useState } from 'react'
import { sound } from '../audio/SoundManager'
import s from './ShareEarn.module.css'

/*
  ShareEarn — share an achievement on X / Instagram to earn +2 sats (once per
  level). Logic mirrors the original: localStorage de-dupe, intent/clipboard,
  then a "did you post?" confirm gate before onEarn() fires.
*/
const SHARE_KEY = 'satquest.shared'

function alreadyShared(levelIdx) {
  try { return (localStorage.getItem(SHARE_KEY) || '').split(',').includes(String(levelIdx)) }
  catch { return false }
}
function markShared(levelIdx) {
  try {
    const existing = (localStorage.getItem(SHARE_KEY) || '').split(',').filter(Boolean)
    localStorage.setItem(SHARE_KEY, [...new Set([...existing, String(levelIdx)])].join(','))
  } catch { /* ignore */ }
}
function buildText(level) {
  const title = level.title || 'Bitcoin'
  const summary = level.story || 'Bitcoin education that pays you real sats.'
  return `🧡 Just leveled up on SatQuest!\n\n"${title}"\n${summary}\n\nBitcoin education that rewards you with real sats ⚡\n\n#Bitcoin #LearnBitcoin #Lightning #SatQuest`
}

export default function ShareEarn({ level, levelIdx, onEarn }) {
  const [done, setDone] = useState(() => alreadyShared(levelIdx))
  const [step, setStep] = useState('idle') // idle | confirming-x | confirming-ig

  const confirm = () => { markShared(levelIdx); setDone(true); setStep('idle'); sound.success(); onEarn() }
  const shareX = () => { sound.tap(); window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(buildText(level))}`, '_blank', 'noopener'); setStep('confirming-x') }
  const copyIg = async () => {
    sound.tap()
    try { await navigator.clipboard.writeText(buildText(level)) } catch { /* ignore */ }
    setStep('confirming-ig')
  }

  if (done) {
    return (
      <div className={`${s.card} ${s.cardDone}`}>
        <span className={s.icon}>📣</span>
        <div className={s.text}><p className={s.title}>Shared & Earned</p><p className={s.sub}>Thanks for spreading the word ⚡</p></div>
        <span className={s.badge}>+2 ⚡</span>
      </div>
    )
  }

  if (step !== 'idle') {
    return (
      <div className={s.card}>
        <div className={s.head}>
          <span className={s.icon}>❓</span>
          <div className={s.text}><p className={s.title}>Did you post it?</p><p className={s.sub}>Confirm to earn <b>+2 sats</b></p></div>
        </div>
        <div className={s.btns}>
          <button className={`${s.btn} ${s.yes}`} onClick={confirm}>✅ Yes, I posted</button>
          <button className={`${s.btn} ${s.no}`} onClick={() => { sound.tap(); setStep('idle') }}>Not yet</button>
        </div>
      </div>
    )
  }

  return (
    <div className={s.card}>
      <div className={s.head}>
        <span className={s.icon}>📣</span>
        <div className={s.text}><p className={s.title}>Share & Earn</p><p className={s.sub}>Post your win, get <b>+2 sats</b></p></div>
        <span className={s.badge}>+2 ⚡</span>
      </div>
      <div className={s.btns}>
        <button className={`${s.btn} ${s.x}`} onMouseEnter={() => sound.hover()} onClick={shareX}>𝕏 Share on X</button>
        <button className={`${s.btn} ${s.ig}`} onMouseEnter={() => sound.hover()} onClick={copyIg}>📋 Copy for IG</button>
      </div>
    </div>
  )
}
