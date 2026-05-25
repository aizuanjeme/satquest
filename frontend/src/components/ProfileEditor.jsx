import { useState } from 'react'
import { AVATARS } from '../data/levels'
import AvatarPager from './AvatarPager'
import s from './ProfileEditor.module.css'

export default function ProfileEditor({ currentUsername, currentAvatarId, onSave, onClose }) {
  const [avatarId, setAvatarId] = useState(currentAvatarId || AVATARS[0].id)

  const selectedAvatar = AVATARS.find(a => a.id === avatarId) || AVATARS[0]

  const handleSave = () => {
    // Username is immutable server-side — only the avatar can change.
    onSave({ avatarId })
  }

  const canSave = avatarId !== currentAvatarId

  return (
    <div className={s.backdrop} onClick={onClose}>
      <div className={s.sheet} onClick={e => e.stopPropagation()}>
        <div className={s.handle} />

        <div className={s.header}>
          <p className={s.title}>Edit profile</p>
          <button className={s.closeBtn} onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Username (locked — changing it would break Lightning wallet identity) */}
        <div className={s.field}>
          <label className={s.label}>Username</label>
          <input
            type="text"
            className={s.input}
            value={currentUsername || ''}
            readOnly
            disabled
          />
          <p className={s.hint}>Username can't be changed — it's tied to your wallet.</p>
        </div>

        {/* Avatar picker */}
        <div className={s.field}>
          <label className={s.label}>Character</label>

          {/* Big preview of the currently chosen avatar.
              `key` re-mounts the inner node on every pick so the spin
              animation replays each time. */}
          <div className={s.preview}>
            <div key={selectedAvatar?.id} className={s.previewInner}>
              {selectedAvatar?.img
                ? <img src={selectedAvatar.img} alt="Chosen character" className={s.previewImg} />
                : <span className={s.previewEmoji}>{selectedAvatar?.emoji}</span>
              }
            </div>
          </div>

          <AvatarPager
            avatars={AVATARS}
            selectedId={avatarId}
            onPick={setAvatarId}
            perPage={8}
            cardClass={s.card}
            selectedClass={s.selected}
            wrapClass={s.avWrap}
            imgClass={s.avImg}
            checkClass={s.check}
          />
        </div>

        <div className={s.actions}>
          <button className={s.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={s.saveBtn} onClick={handleSave} disabled={!canSave}>
            Save changes
          </button>
        </div>
      </div>
    </div>
  )
}
