import { useState } from 'react'
import { sound } from '../audio/SoundManager'
import s from './SoundToggle.module.css'

/*
  SoundToggle — twin toggles for ambient music + sfx.
*/
export default function SoundToggle() {
  const [music, setMusic] = useState(sound.musicEnabled())
  const [sfx, setSfx] = useState(sound.sfxEnabled())

  const toggleMusic = () => {
    const v = !music
    setMusic(v)
    sound.setMusicEnabled(v)
    if (v) sound.click()
  }
  const toggleSfx = () => {
    const v = !sfx
    setSfx(v)
    sound.setSfxEnabled(v)
    if (v) sound.click()
  }

  return (
    <div className={s.wrap}>
      <button className={`${s.btn} ${music ? s.on : ''}`} onClick={toggleMusic} title="Ambient music">
        {music ? '♫' : '♪̸'}
      </button>
      <button className={`${s.btn} ${sfx ? s.on : ''}`} onClick={toggleSfx} title="Sound effects">
        {sfx ? '🔊' : '🔇'}
      </button>
    </div>
  )
}
