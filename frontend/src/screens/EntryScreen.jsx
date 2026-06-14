import { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'
import { AVATARS, resolveAvatarId } from '../core/LevelManager'
import { loadProgress } from '../lib/storage'
import { sound } from '../audio/SoundManager'
import Avatar from '../ui/Avatar'
import NeonButton from '../ui/NeonButton'
import GlassPanel from '../ui/GlassPanel'
import RestoreModal from './RestoreModal'
import s from './EntryScreen.module.css'

const HANDLE_RE = /^[a-zA-Z0-9_-]{2,20}$/
const SATQUEST_SUFFIX = '.satquest'

/*
  EntryScreen — cinematic onboarding.
  - Returning players: "Welcome back" hero with Continue / restore / reset.
  - New players: handle field + a glowing character carousel.
  Logic (handle suffix, resume, restore, reset) matches the original exactly.
*/
export default function EntryScreen({ existingProfile, onChoose, onResume, onReset, onRestore }) {
  const [username, setUsername] = useState('')
  const [idx, setIdx] = useState(0)
  const [error, setError] = useState('')
  const [restoring, setRestoring] = useState(false)
  const titleRef = useRef(null)

  useEffect(() => {
    if (titleRef.current) {
      gsap.from(titleRef.current, { y: 30, opacity: 0, duration: 1, ease: 'power3.out' })
    }
  }, [])

  /* ----- returning player ----- */
  if (existingProfile?.username && existingProfile?.avatarId) {
    const av = AVATARS.find((a) => a.id === resolveAvatarId(existingProfile.avatarId)) || AVATARS[0]
    const saved = loadProgress()
    const savedSats = saved?.sats || 0
    const savedLevels = Object.keys(saved?.levels || {}).length

    return (
      <div className={s.body}>
        <div className={s.brand} ref={titleRef}>
          <p className={s.kicker}>SATQUEST</p>
          <h1 className={s.hero}>Welcome<br />Back</h1>
        </div>

        <GlassPanel glow="blue" className={s.backCard}>
          <Avatar avatar={av} size={104} />
          <p className={s.handle}>@{existingProfile.username}</p>
          <p className={s.stat}>
            {savedSats > 0 || savedLevels > 0
              ? `⚡ ${savedSats} sats · ${savedLevels} level${savedLevels === 1 ? '' : 's'} cleared`
              : 'Your journey awaits'}
          </p>
        </GlassPanel>

        <div className={s.actions}>
          <NeonButton variant="blue" full onClick={() => onResume(existingProfile)}>
            Continue Quest →
          </NeonButton>
          <button className={s.link} onClick={() => { sound.tap(); setRestoring(true) }}>
            Restore from recovery words
          </button>
          <button className={s.linkDim} onClick={() => { sound.tap(); onReset() }}>
            Not you? Start over
          </button>
        </div>

        {restoring && (
          <RestoreModal
            onClose={() => setRestoring(false)}
            onRestored={(p) => { setRestoring(false); onRestore(p) }}
          />
        )}
      </div>
    )
  }

  /* ----- new player ----- */
  const selected = AVATARS[idx]

  const move = (dir) => {
    sound.tap()
    setIdx((i) => (i + dir + AVATARS.length) % AVATARS.length)
  }

  const handleStart = () => {
    const trimmed = username.trim().toLowerCase()
    if (!HANDLE_RE.test(trimmed)) {
      setError('2-20 letters, numbers, _ or -')
      sound.wrong()
      return
    }
    setError('')
    onChoose({ username: trimmed + SATQUEST_SUFFIX, avatar: selected })
  }

  return (
    <div className={s.body}>
      <div className={s.brand} ref={titleRef}>
        <p className={s.kicker}>BEGIN THE</p>
        <h1 className={s.hero}>Sat<span className={s.heroAccent}>Quest</span></h1>
        <p className={s.tag}>Master Bitcoin. Stack real sats.</p>
      </div>

      <div className={s.field}>
        <div className={s.inputWrap}>
          <input
            className={s.input}
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError('') }}
            placeholder="your_handle"
            maxLength={20}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          <span className={s.suffix}>.satquest</span>
        </div>
        <p className={error ? s.err : s.hint}>
          {error || '2-20 characters · letters, numbers, _ or -'}
        </p>
      </div>

      <p className={s.pickLabel}>CHOOSE YOUR CHARACTER</p>

      <div className={s.carousel}>
        <button className={s.arrow} onMouseEnter={() => sound.hover()} onClick={() => move(-1)}>‹</button>
        <div className={s.stage} key={selected.id}>
          <div className={s.halo} />
          <Avatar avatar={selected} size={156} />
        </div>
        <button className={s.arrow} onMouseEnter={() => sound.hover()} onClick={() => move(1)}>›</button>
      </div>
      <p className={s.count}>{idx + 1} / {AVATARS.length}</p>

      <div className={s.actions}>
        <NeonButton variant="blue" full onClick={handleStart} disabled={!username.trim()}>
          Enter the Quest →
        </NeonButton>
        <button className={s.link} onClick={() => { sound.tap(); setRestoring(true) }}>
          Already have an account? Restore it
        </button>
      </div>

      {restoring && (
        <RestoreModal
          onClose={() => setRestoring(false)}
          onRestored={(p) => { setRestoring(false); onRestore(p) }}
        />
      )}
    </div>
  )
}
