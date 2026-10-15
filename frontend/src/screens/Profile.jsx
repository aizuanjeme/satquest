import { useState } from 'react'
import { sound } from '../audio/SoundManager'
import { useTheme, THEMES } from '../hooks/useTheme'
import Avatar from '../ui/Avatar'
import GlassPanel from '../ui/GlassPanel'
import NeonButton from '../ui/NeonButton'
import SoundToggle from '../ui/SoundToggle'
import ThemePicker from '../ui/ThemePicker'
import ProfileEditor from './ProfileEditor'
import BackupSeed from './BackupSeed'
import Feedback from './Feedback'
import { t, LANGUAGES, getLocale, setLocale } from '../i18n'
import s from './Profile.module.css'

/*
  Profile — player hub. Logic preserved: avatar edit via ProfileEditor,
  recovery via BackupSeed, feedback via Feedback, destructive reset with
  confirm. Username immutable (tied to wallet).
*/
export default function Profile({ avatar, username, onUpdateProfile, onReset }) {
  const [editing, setEditing] = useState(false)
  const [backingUp, setBackingUp] = useState(false)
  const [feedbacking, setFeedbacking] = useState(false)
  const [pickingTheme, setPickingTheme] = useState(false)
  const { theme } = useTheme()
  const activeTheme = THEMES.find((th) => th.id === theme) || THEMES[0]
  const lang = getLocale()
  const themeName = `${activeTheme.emoji} ${t(`theme.${activeTheme.id}.label`)}`

  const handleLangChange = (e) => {
    sound.tap()
    setLocale(e.target.value)
  }

  const handleReset = () => {
    if (confirm(t('profile.resetConfirm'))) onReset()
  }

  return (
    <div className={s.body}>
      <header className={s.header}>
        <div>
          <p className={s.kicker}>{t('profile.kicker')}</p>
          <h2 className={s.title}>{t('profile.title')}</h2>
        </div>
      </header>

      <GlassPanel glow="blue" className={s.hero}>
        <div className={s.heroAv}><Avatar avatar={avatar} size={108} /></div>
        <p className={s.handle}>@{username}</p>
        <NeonButton variant="ghost" onClick={() => { sound.tap(); setEditing(true) }}>{t('profile.editAvatar')}</NeonButton>
      </GlassPanel>

      <GlassPanel className={s.section}>
        <span className={s.icon}>🔑</span>
        <div className={s.secBody}>
          <p className={s.secTitle}>{t('profile.backupTitle')}</p>
          <p className={s.secSub}>{t('profile.backupSub')}</p>
          <NeonButton variant="gold" onClick={() => { sound.tap(); setBackingUp(true) }}>{t('profile.backupBtn')}</NeonButton>
        </div>
      </GlassPanel>

      <GlassPanel className={s.section}>
        <span className={s.icon}>🎨</span>
        <div className={s.secBody}>
          <p className={s.secTitle}>{t('profile.themeTitle')}</p>
          <p className={s.secSub}>{t('profile.themeSub', { theme: themeName })}</p>
          <NeonButton variant="ghost" onClick={() => { sound.tap(); setPickingTheme(true) }}>{t('profile.themeBtn')}</NeonButton>
        </div>
      </GlassPanel>

      <GlassPanel className={s.section}>
        <span className={s.icon}>🌍</span>
        <div className={s.secBody}>
          <p className={s.secTitle}>{t('profile.langTitle')}</p>
          <p className={s.secSub}>{t('profile.langSub')}</p>
          <select className={s.select} value={lang} onChange={handleLangChange} aria-label={t('profile.langTitle')}>
            {LANGUAGES.map((l) => (
              <option key={l.id} value={l.id} disabled={!l.available}>
                {l.available ? l.label : t('profile.langSoon', { label: l.label })}
              </option>
            ))}
          </select>
        </div>
      </GlassPanel>

      <GlassPanel className={s.section}>
        <span className={s.icon}>🔊</span>
        <div className={s.secBody}>
          <p className={s.secTitle}>{t('profile.audioTitle')}</p>
          <p className={s.secSub}>{t('profile.audioSub', { theme: themeName })}</p>
          <SoundToggle />
        </div>
      </GlassPanel>

      <GlassPanel className={s.section}>
        <span className={s.icon}>💬</span>
        <div className={s.secBody}>
          <p className={s.secTitle}>{t('profile.feedbackTitle')}</p>
          <p className={s.secSub}>{t('profile.feedbackSub')}</p>
          <NeonButton variant="ghost" onClick={() => { sound.tap(); setFeedbacking(true) }}>{t('profile.feedbackBtn')}</NeonButton>
        </div>
      </GlassPanel>

      <GlassPanel className={`${s.section} ${s.danger}`}>
        <span className={s.icon}>⚠️</span>
        <div className={s.secBody}>
          <p className={s.secTitle}>{t('profile.resetTitle')}</p>
          <p className={s.secSub}>{t('profile.resetSub')}</p>
          <button className={s.resetBtn} onClick={handleReset}>{t('profile.resetBtn')}</button>
        </div>
      </GlassPanel>

      {editing && (
        <ProfileEditor
          currentUsername={username}
          currentAvatarId={avatar?.id}
          onSave={(updates) => { onUpdateProfile(updates); setEditing(false) }}
          onClose={() => setEditing(false)}
        />
      )}
      {backingUp && <BackupSeed username={username} onClose={() => setBackingUp(false)} />}
      {feedbacking && <Feedback username={username} onClose={() => setFeedbacking(false)} />}
      {pickingTheme && <ThemePicker onClose={() => setPickingTheme(false)} />}
    </div>
  )
}
