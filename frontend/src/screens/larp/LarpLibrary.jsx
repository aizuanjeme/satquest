import { useEffect, useRef, useState } from 'react'
import { sound } from '../../audio/SoundManager'
import { PAPER, SECTIONS } from '../../larp/whitepaper'
import { findChapter } from '../../larp/chapters'
import GlassPanel from '../../ui/GlassPanel'
import { t } from '../../i18n'
import s from './Larp.module.css'

/*
  LarpLibrary — the Bitcoin whitepaper, one plain-language card per section.
  Sections with a matching chapter offer a "play it" button.
*/
export default function LarpLibrary({ initial, onBack, onPlay, isUnlocked }) {
  const [openId, setOpenId] = useState(initial || null)
  const refs = useRef({})

  useEffect(() => {
    if (initial) refs.current[initial]?.scrollIntoView({ block: 'start', behavior: 'smooth' })
  }, [initial])

  return (
    <div className={s.body}>
      <header className={s.header}>
        <button className={s.backBtn} onClick={() => { sound.tap(); onBack() }}>{t('common.back')}</button>
      </header>
      <div>
        <p className={s.kicker}>{t('larp.library.kicker')}</p>
        <h2 className={s.title}>{t('larp.library.title')}</h2>
      </div>
      <p className={s.intro}>
        {t('larp.library.about', { title: PAPER.title, author: PAPER.author, year: PAPER.year })}{' '}
        <a className={s.link} href={PAPER.link} target="_blank" rel="noreferrer">{t('larp.library.original')}</a>
      </p>

      {SECTIONS.map((sec) => {
        const open = openId === sec.id
        const chapter = sec.play && findChapter(sec.play)
        return (
          <div key={sec.id} ref={(el) => { refs.current[sec.id] = el }}>
            <GlassPanel className={`${s.paperCard} ${open ? s.paperOpen : ''}`}>
              <button className={s.paperHead} onClick={() => { sound.tap(); setOpenId(open ? null : sec.id) }}>
                <span className={s.paperN}>{sec.n}</span>
                <span className={s.chapterBody}>
                  <span className={s.chapterTitle}>{sec.title}</span>
                  <span className={s.chapterTag}>{sec.idea}</span>
                </span>
                <span className={s.chapterEnd}>{open ? '−' : '+'}</span>
              </button>
              {open && (
                <div className={s.paperBody}>
                  {sec.body.map((p, i) => <p key={i}>{p}</p>)}
                  {chapter && (
                    <button
                      className={s.paperLink}
                      disabled={!isUnlocked(chapter.id)}
                      onClick={() => onPlay(chapter.id)}
                    >
                      {isUnlocked(chapter.id) ? '🎮' : '🔒'} {t('larp.library.play', { title: chapter.title })}
                    </button>
                  )}
                </div>
              )}
            </GlassPanel>
          </div>
        )
      })}
      <p className={s.footnote}>{t('larp.library.note')}</p>
    </div>
  )
}
