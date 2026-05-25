import { useState } from 'react'
import { AVATARS, resolveAvatarId } from '../data/levels'
import { loadProgress } from '../lib/storage'
import AvatarPager from './AvatarPager'
import RestoreWallet from './RestoreWallet'
import s from './AvatarPick.module.css'

// The user types just the base handle. We always append `.satquest` to keep
// every account on a single, brand-consistent namespace.
const HANDLE_RE = /^[a-zA-Z0-9_-]{2,20}$/
const SATQUEST_SUFFIX = '.satquest'

export default function AvatarPick({ existingProfile, onChoose, onResume, onReset, onRestore }) {
  const [username, setUsername]   = useState('')
  const [avatarId, setAvatarId]   = useState(null)
  const [error, setError]         = useState('')
  const [restoring, setRestoring] = useState(false)

  const selectedAvatar = avatarId
    ? AVATARS.find(a => a.id === avatarId)
    : null

  // If we already have a saved profile, show "Welcome back" first
  if (existingProfile?.username && existingProfile?.avatarId) {
    const av    = AVATARS.find(a => a.id === resolveAvatarId(existingProfile.avatarId)) || AVATARS[0]
    const saved = loadProgress()
    const savedSats   = saved?.sats || 0
    const savedLevels = Object.keys(saved?.levels || {}).length

    return (
      <div className={s.body}>
        <div className={s.top}>
          <div className={s.logoemoji}>🟠</div>
          <h1 className={s.title}>SatQuest</h1>
          <p className={s.sub}>Welcome back, omo!</p>
        </div>

        <div className={s.welcomeBack}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
            <div className={s.avImgWrap} style={{ width: 96, height: 96 }}>
              {av.img
                ? <img src={av.img} alt={av.name} className={s.avImg} />
                : <span style={{ fontSize: 56 }}>{av.emoji}</span>
              }
            </div>
          </div>
          <p className={s.welcomeBackName}>@{existingProfile.username}</p>
          {(savedSats > 0 || savedLevels > 0) ? (
            <p className={s.welcomeBackSub}>
              ⚡ {savedSats} sats · {savedLevels} level{savedLevels === 1 ? '' : 's'} done
            </p>
          ) : (
            <p className={s.welcomeBackSub}>Ready when you are</p>
          )}
        </div>

        <button className={s.startBtn} onClick={() => onResume(existingProfile)}>
          Continue
        </button>

        <button className={s.resetLink} onClick={onReset}>
          Not you? Start over
        </button>

        {onRestore && (
          <button className={s.resetLink} onClick={() => setRestoring(true)}>
            🔑 Restore from recovery words
          </button>
        )}

        {restoring && (
          <RestoreWallet
            onClose={() => setRestoring(false)}
            onRestored={(profile) => { setRestoring(false); onRestore(profile) }}
          />
        )}
      </div>
    )
  }

  const handleStart = () => {
    const trimmed = username.trim().toLowerCase()
    if (!HANDLE_RE.test(trimmed)) {
      setError('2-20 letters, numbers, _ or -')
      return
    }
    setError('')
    const av = AVATARS.find(a => a.id === avatarId)
    onChoose({ username: trimmed + SATQUEST_SUFFIX, avatar: av })
  }

  return (
    <div className={s.body}>
      <div className={s.top}>
        <div className={s.logoemoji}>🟠</div>
        <h1 className={s.title}>SatQuest</h1>
        <p className={s.sub}>Learn Bitcoin the fun way. Stack real sats.</p>
      </div>

      {/* Username field */}
      <div className={s.userBox}>
        <label className={s.userLabel}>Choose your handle</label>
        <div className={s.userInputWrap}>
          <input
            type="text"
            className={s.userInput}
            value={username}
            onChange={e => { setUsername(e.target.value); setError('') }}
            placeholder="emeka_lagos"
            maxLength={20}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          <span className={s.userSuffix}>.satquest</span>
        </div>
        {error
          ? <p className={s.userError}>{error}</p>
          : <p className={s.userHint}>2-20 characters · letters, numbers, _ or -</p>
        }
      </div>

      {/* Avatar picker */}
      <p className={s.stepTitle}>Pick your character</p>
      <p className={s.stepHint}>
        {selectedAvatar
          ? 'Tap another to change, then Start playing'
          : 'Tap one to preview, then Start playing'}
      </p>

      {/* Preview panel — shows the chosen avatar nice and big.
          The `key` is the avatar id so React remounts the inner element on each
          pick, which replays the spin-in animation every time. */}
      <div className={`${s.preview} ${selectedAvatar ? s.previewFilled : ''}`}>
        {selectedAvatar ? (
          <div key={selectedAvatar.id} className={s.previewInner}>
            {selectedAvatar.img
              ? <img src={selectedAvatar.img} alt="Chosen character" className={s.previewImg} />
              : <span className={s.previewEmoji}>{selectedAvatar.emoji}</span>
            }
            <span className={s.sparkleA}>✨</span>
            <span className={s.sparkleB}>✨</span>
          </div>
        ) : (
          <span className={s.previewPlaceholder}>?</span>
        )}
      </div>

      <AvatarPager
        avatars={AVATARS}
        selectedId={avatarId}
        onPick={setAvatarId}
        perPage={8}
        cardClass={s.card}
        selectedClass={s.selected}
        wrapClass={s.avImgWrap}
        imgClass={s.avImg}
        checkClass={s.checkmark}
      />

      <button
        className={s.startBtn}
        onClick={handleStart}
        disabled={!username.trim() || !selectedAvatar}
      >
        Start playing →
      </button>

      {onRestore && (
        <button className={s.resetLink} onClick={() => setRestoring(true)}>
          🔑 Already have an account? Restore it
        </button>
      )}

      <p className={s.foot}>
        Plays offline. Your progress is saved on this device.
      </p>

      {restoring && (
        <RestoreWallet
          onClose={() => setRestoring(false)}
          onRestored={(profile) => { setRestoring(false); onRestore(profile) }}
        />
      )}
    </div>
  )
}
