import { useState } from 'react'
import { AVATARS } from '../core/LevelManager'
import { sound } from '../audio/SoundManager'
import GlassPanel from '../ui/GlassPanel'
import NeonButton from '../ui/NeonButton'
import { t } from '../i18n'
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
            <h3 className={s.title}>{t('editor.title')}</h3>
            <button className={s.x} onClick={onClose} aria-label={t('common.close')}>✕</button>
          </div>

          <div className={s.field}>
            <label className={s.label}>{t('editor.username')}</label>
            <input className={s.input} value={currentUsername || ''} readOnly disabled />
            <p className={s.hint}>{t('editor.usernameHint')}</p>
          </div>

          <div className={s.field}>
            <label className={s.label}>{t('editor.character')}</label>
            <div className={s.carousel}>
              <button className={s.arrow} onClick={() => cycle(-1)} aria-label={t('editor.prev')}>‹</button>
              <div className={s.stage}>
                <div key={selected.id} className={s.portrait}>
                  {selected.img
                    ? <img src={selected.img} alt={t('editor.character')} className={s.portraitImg} />
                    : <span className={s.portraitEmoji}>{selected.emoji}</span>}
                </div>
                <span className={s.count}>{idx + 1} / {AVATARS.length}</span>
              </div>
              <button className={s.arrow} onClick={() => cycle(1)} aria-label={t('editor.next')}>›</button>
            </div>
          </div>

          <div className={s.actions}>
            <NeonButton variant="ghost" onClick={onClose}>{t('common.cancel')}</NeonButton>
            <NeonButton variant="blue" disabled={!canSave} onClick={() => { sound.success(); onSave({ avatarId: selected.id }) }}>
              {t('common.save')}
            </NeonButton>
          </div>
        </div>
      </GlassPanel>
    </div>
  )
}
