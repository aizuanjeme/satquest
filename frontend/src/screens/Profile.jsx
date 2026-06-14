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
  const activeTheme = THEMES.find((t) => t.id === theme) || THEMES[0]

  const handleReset = () => {
    if (confirm(
      '⚠️ This wipes everything on this device.\n\n' +
      'If you have NOT backed up your 12 recovery words, your sats are GONE FOREVER.\n\n' +
      'Continue?',
    )) onReset()
  }

  return (
    <div className={s.body}>
      <header className={s.header}>
        <div>
          <p className={s.kicker}>PLAYER</p>
          <h2 className={s.title}>Profile</h2>
        </div>
      </header>

      <GlassPanel glow="blue" className={s.hero}>
        <div className={s.heroAv}><Avatar avatar={avatar} size={108} /></div>
        <p className={s.handle}>@{username}</p>
        <NeonButton variant="ghost" onClick={() => { sound.tap(); setEditing(true) }}>✏️ Edit avatar</NeonButton>
      </GlassPanel>

      <GlassPanel className={s.section}>
        <span className={s.icon}>🔑</span>
        <div className={s.secBody}>
          <p className={s.secTitle}>Back up your wallet</p>
          <p className={s.secSub}>Save your 12-word recovery phrase. Without it, clearing browser data means your sats are gone — with it you can restore anywhere.</p>
          <NeonButton variant="gold" onClick={() => { sound.tap(); setBackingUp(true) }}>Show recovery words →</NeonButton>
        </div>
      </GlassPanel>

      <GlassPanel className={s.section}>
        <span className={s.icon}>🎨</span>
        <div className={s.secBody}>
          <p className={s.secTitle}>Theme</p>
          <p className={s.secSub}>Currently: {activeTheme.emoji} {activeTheme.label}. Change the vibe of the whole app.</p>
          <NeonButton variant="ghost" onClick={() => { sound.tap(); setPickingTheme(true) }}>Change theme →</NeonButton>
        </div>
      </GlassPanel>

      <GlassPanel className={s.section}>
        <span className={s.icon}>🔊</span>
        <div className={s.secBody}>
          <p className={s.secTitle}>Audio</p>
          <p className={s.secSub}>Ambient score and interface sounds. Now playing: {activeTheme.emoji} {activeTheme.label} mix.</p>
          <SoundToggle />
        </div>
      </GlassPanel>

      <GlassPanel className={s.section}>
        <span className={s.icon}>💬</span>
        <div className={s.secBody}>
          <p className={s.secTitle}>Send feedback</p>
          <p className={s.secSub}>Found a bug, have an idea, or want to say hi? We read every message.</p>
          <NeonButton variant="ghost" onClick={() => { sound.tap(); setFeedbacking(true) }}>Share your thoughts →</NeonButton>
        </div>
      </GlassPanel>

      <GlassPanel className={`${s.section} ${s.danger}`}>
        <span className={s.icon}>⚠️</span>
        <div className={s.secBody}>
          <p className={s.secTitle}>Reset profile &amp; progress</p>
          <p className={s.secSub}>Wipes everything on this device. Back up your wallet first — this cannot be undone.</p>
          <button className={s.resetBtn} onClick={handleReset}>Reset everything</button>
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
