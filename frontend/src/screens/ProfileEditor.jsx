import { useState } from 'react'
import { AVATARS } from '../core/LevelManager'
import { sound } from '../audio/SoundManager'
import GlassPanel from '../ui/GlassPanel'
import NeonButton from '../ui/NeonButton'
import s from './ProfileEditor.module.css'

/*
  ProfileEditor — change avatar only (username immutable, tied to wallet).
  Logic preserved: onSave({ avatarId }). Cinematic carousel re-skin.
*/
export default function ProfileEditor({ currentUsername, currentAvatarId, onSave, onClose }) {
  const startIdx = Math.max(0, AVATARS.findIndex(a => a.id === (currentAvatarId || AVATARS[0].id)))
  const [idx, setIdx] = useState(startIdx === -1 ? 0 : startIdx)
  const selected = AVATARS[idx]

  const cycle = (dir) => {
    sound.tap()
    setIdx((i) => (i + dir + AVATARS.length) % AVATARS.length)
  }

  const canSave = selected.id !== currentAvatarId

  return (
    <div className={s.backdrop} onClick={onClose}>
      <GlassPanel glow="blue" className={s.sheet}>
        <div onClick={(e) => e.stopPropagation()}>
          <div className={s.header}>
            <h3 className={s.title}>Edit profile</h3>
            <button className={s.x} onClick={onClose} aria-label="Close">✕</button>
          </div>

          <div className={s.field}>
            <label className={s.label}>Username</label>
            <input className={s.input} value={currentUsername || ''} readOnly disabled />
            <p className={s.hint}>Username can't be changed — it's tied to your wallet.</p>
          </div>

          <div className={s.field}>
            <label className={s.label}>Character</label>
            <div className={s.carousel}>
              <button className={s.arrow} onClick={() => cycle(-1)} aria-label="Previous">‹</button>
              <div className={s.stage}>
                <div key={selected.id} className={s.portrait}>
                  {selected.img
                    ? <img src={selected.img} alt="Character" className={s.portraitImg} />
                    : <span className={s.portraitEmoji}>{selected.emoji}</span>}
                </div>
                <span className={s.count}>{idx + 1} / {AVATARS.length}</span>
              </div>
              <button className={s.arrow} onClick={() => cycle(1)} aria-label="Next">›</button>
            </div>
          </div>

          <div className={s.actions}>
            <NeonButton variant="ghost" onClick={onClose}>Cancel</NeonButton>
            <NeonButton variant="blue" disabled={!canSave} onClick={() => { sound.success(); onSave({ avatarId: selected.id }) }}>
              Save
            </NeonButton>
          </div>
        </div>
      </GlassPanel>
    </div>
  )
}
