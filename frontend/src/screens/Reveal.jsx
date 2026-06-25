import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { LevelManager } from '../core/LevelManager'
import { conceptLabel } from '../data/concepts'
import { t } from '../i18n'
import { sound } from '../audio/SoundManager'
import Avatar from '../ui/Avatar'
import NeonButton from '../ui/NeonButton'
import ShareEarn from './ShareEarn'
import s from './Reveal.module.css'

/*
  RevealCard — one "secret" with optional nuance note + expandable deep-dive.
  `note` adds a precise caveat (so we never teach a half-truth); `learnMore`
  is hidden behind a tap so the recap stays skimmable.
*/
function RevealCard({ r, i }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={s.revealCard} style={{ animationDelay: `${i * 0.07}s` }}>
      <div className={s.icons}>
        <span>{r.naija}</span>
        <span className={s.arrow}>→</span>
        <span>{r.btc}</span>
      </div>
      <div className={s.revealBody}>
        <p className={s.match}>{r.match}</p>
        <p className={s.def}>{r.def}</p>
        {r.note && <p className={s.note}>⚠️ {r.note}</p>}
        {r.funny && <p className={s.funny}>{r.funny}</p>}
        {r.learnMore && (
          <div className={s.learnWrap}>
            <button
              className={s.learnToggle}
              onClick={() => { sound.tap(); setOpen(o => !o) }}
            >
              {open ? t('reveal.hideDetails') : t('reveal.learnMore')} {open ? '▴' : '▾'}
            </button>
            {open && <p className={s.learnBody}>{r.learnMore}</p>}
          </div>
        )}
      </div>
    </div>
  )
}

/*
  Reveal — cinematic post-level recap. Shows the "secrets" learned (reveals),
  the sats earned with an animated counter, a share-to-earn module, and CTAs.
  Logic/props match the original Reveal exactly.
*/
export default function Reveal({ level, levelIdx, sats, avatar, username, lastEarned, reviewConcepts = [], onNext, onMap, onShareEarn }) {
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
              <RevealCard key={i} r={r} i={i} />
            ))}
          </div>
        )}

        {reviewConcepts.length > 0 && (
          <div className={s.reviewBox}>
            <p className={s.reviewHead}>{t('reveal.review')}</p>
            <div className={s.reviewChips}>
              {reviewConcepts.map((id) => (
                <span key={id} className={s.reviewChip}>{conceptLabel(id)}</span>
              ))}
            </div>
          </div>
        )}

        <ShareEarn level={level} levelIdx={levelIdx} username={username} onEarn={onShareEarn} />

        <div className={s.cta}>
          <NeonButton variant="gold" full onClick={() => { sound.success(); onNext() }}>
            {isLast ? t('reveal.playAgain') : t('reveal.continue')}
          </NeonButton>
          <button className={s.backLink} onClick={() => { sound.tap(); onMap() }}>{t('nav.backToMap')}</button>
        </div>
      </div>
    </div>
  )
}
