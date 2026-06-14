import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { LevelManager } from '../core/LevelManager'
import { sound } from '../audio/SoundManager'
import Avatar from '../ui/Avatar'
import NeonButton from '../ui/NeonButton'
import ShareEarn from './ShareEarn'
import s from './Reveal.module.css'

/*
  Reveal — cinematic post-level recap. Shows the "secrets" learned (reveals),
  the sats earned with an animated counter, a share-to-earn module, and CTAs.
  Logic/props match the original Reveal exactly.
*/
export default function Reveal({ level, levelIdx, sats, avatar, username, lastEarned, onNext, onMap, onShareEarn }) {
  const isLast = levelIdx === LevelManager.total - 1
  const isHunt = level.type === 'wordhunt'
  const earned = lastEarned ?? level.sats
  const huntWon = isHunt && earned > 0
  const huntLost = isHunt && earned === 0

  const satRef = useRef(null)
  useEffect(() => {
    sound.win()
    if (satRef.current && earned > 0) {
      const obj = { v: 0 }
      gsap.to(obj, {
        v: earned, duration: 1.1, ease: 'power2.out',
        onUpdate: () => { if (satRef.current) satRef.current.textContent = `+${Math.round(obj.v)}` },
      })
    }
  }, []) // eslint-disable-line

  return (
    <div className={s.body}>
      <header className={s.hud}>
        <button className={s.mapBtn} onMouseEnter={() => sound.hover()} onClick={() => { sound.tap(); onMap() }}>‹ Map</button>
        <span className={s.lvl}>Level {levelIdx + 1} cleared</span>
        <span className={s.total}>⚡ {sats}</span>
      </header>

      <div className={s.inner}>
        <div className={s.heroBlock}>
          <div className={s.avatarGlow}><Avatar avatar={avatar} size={72} /></div>
          {isHunt ? (
            <>
              <h2 className={s.title}>{huntWon ? 'Hunt Cleared' : 'Time Ran Out'}</h2>
              <p className={s.sub}>
                {huntWon ? 'You spotted every real Bitcoin word.' : 'No sats this round — the words return. Keep going.'}
              </p>
            </>
          ) : (
            <>
              <h2 className={s.title}>{isLast ? 'All Secrets Revealed' : 'Secret Unlocked'}</h2>
              <p className={s.sub}>{isLast ? 'You are Bitcoin-literate. For real.' : 'Here is what you just mastered'}</p>
            </>
          )}
        </div>

        <div className={s.satsBox}>
          <span ref={satRef} className={s.satsBig}>+{huntLost ? 0 : earned}</span>
          <span className={s.satsUnit}>sats {huntLost ? 'earned' : 'via Lightning'}</span>
        </div>

        {isHunt ? (
          <div className={s.huntList}>
            <p className={s.huntLabel}>The real Bitcoin words were</p>
            <div className={s.huntChips}>
              {(level.real || []).map((w) => <span key={w} className={s.huntChip}>{w}</span>)}
            </div>
          </div>
        ) : (
          <div className={s.reveals}>
            {(level.reveals || []).map((r, i) => (
              <div key={i} className={s.revealCard} style={{ animationDelay: `${i * 0.07}s` }}>
                <div className={s.icons}>
                  <span>{r.naija}</span>
                  <span className={s.arrow}>→</span>
                  <span>{r.btc}</span>
                </div>
                <div className={s.revealBody}>
                  <p className={s.match}>{r.match}</p>
                  <p className={s.def}>{r.def}</p>
                  <p className={s.funny}>{r.funny}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <ShareEarn level={level} levelIdx={levelIdx} username={username} onEarn={onShareEarn} />

        <div className={s.cta}>
          <NeonButton variant="gold" full onClick={() => { sound.success(); onNext() }}>
            {isLast ? 'Play Again' : 'Continue →'}
          </NeonButton>
          <button className={s.backLink} onClick={() => { sound.tap(); onMap() }}>Back to map</button>
        </div>
      </div>
    </div>
  )
}
