import { useState } from 'react'
import Avatar from './Avatar'
import ProfileEditor from './ProfileEditor'
import BackupSeed from './BackupSeed'
import { sfx } from '../lib/sfx'
import s from './Profile.module.css'

export default function Profile({ avatar, username, onUpdateProfile, onReset }) {
  const [editing, setEditing]     = useState(false)
  const [backingUp, setBackingUp] = useState(false)
  const [soundOn, setSoundOn]     = useState(() => sfx.isEnabled())

  const toggleSound = () => {
    const next = !soundOn
    sfx.setEnabled(next)
    setSoundOn(next)
    if (next) sfx.ding() // preview the sound when turning on
  }

  return (
    <div className={s.body}>
      <div className={s.topbar}>
        <span className={s.topTitle}>👤 Profile</span>
      </div>

      {/* Avatar + username card */}
      <div className={s.heroCard}>
        <div className={s.avatarWrap}>
          <Avatar avatar={avatar} size="xl" />
        </div>
        <p className={s.handle}>@{username}</p>
        <button className={s.editBtn} onClick={() => setEditing(true)}>
          ✏️ Edit avatar
        </button>
      </div>

      {/* Backup seed */}
      <div className={s.section}>
        <div className={s.sectionIcon}>🔑</div>
        <div className={s.sectionBody}>
          <p className={s.sectionTitle}>Back up your wallet</p>
          <p className={s.sectionSub}>
            Save your 12-word recovery phrase. Without it, clearing browser data
            means your sats are gone forever — but with it you can restore on
            any device, including the Breez mobile app.
          </p>
          <button className={s.actionBtn} onClick={() => setBackingUp(true)}>
            Show recovery words →
          </button>
        </div>
      </div>

      {/* Sound effects */}
      <div className={s.section}>
        <div className={s.sectionIcon}>🔊</div>
        <div className={s.sectionBody}>
          <p className={s.sectionTitle}>Sound effects</p>
          <p className={s.sectionSub}>
            Taps, chimes, and fanfares when you play.
          </p>
          <button
            className={`${s.toggle} ${soundOn ? s.toggleOn : ''}`}
            onClick={toggleSound}
            aria-pressed={soundOn}
          >
            <span className={s.toggleThumb} />
            <span className={s.toggleLabel}>{soundOn ? 'On' : 'Off'}</span>
          </button>
        </div>
      </div>

      {/* Reset */}
      <div className={s.section}>
        <div className={s.sectionIcon}>⚠️</div>
        <div className={s.sectionBody}>
          <p className={s.sectionTitle}>Reset profile &amp; progress</p>
          <p className={s.sectionSub}>
            Wipes everything on this device. Back up your wallet first — this cannot be undone.
          </p>
          <button
            className={s.resetBtn}
            onClick={() => {
              if (
                confirm(
                  '⚠️ This wipes everything on this device.\n\n' +
                  'If you have NOT backed up your 12 recovery words, your sats are GONE FOREVER.\n\n' +
                  'Continue?',
                )
              ) {
                onReset()
              }
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Modals */}
      {editing && (
        <ProfileEditor
          currentUsername={username}
          currentAvatarId={avatar?.id}
          onSave={(updates) => {
            onUpdateProfile(updates)
            setEditing(false)
          }}
          onClose={() => setEditing(false)}
        />
      )}

      {backingUp && (
        <BackupSeed username={username} onClose={() => setBackingUp(false)} />
      )}
    </div>
  )
}
