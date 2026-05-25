import { useEffect } from 'react'
import Card from './Card'
import Avatar from './Avatar'
import s from './GameBoard.module.css'

const MATCH_COLORS = [
  '#00E5A0', // emerald
  '#00CFFF', // cyan
  '#A855F7', // purple
  '#F7931A', // orange
  '#FF0080', // pink
  '#FFD60A', // yellow
  '#38BDF8', // sky blue
  '#A3E635', // lime
  '#FB923C', // peach
]

export default function GameBoard({ game, onMapPress }) {
  const {
    level, levelIdx,
    matched, selImg, selWord, wrongFlash,
    matchedCount, totalPairs,
    shuffledImgs, shuffledWords,
    pickImg, pickWord, tryMatch,
    avatar,
  } = game

  useEffect(() => {
    if (selImg && selWord) tryMatch(selImg, selWord)
  }, [selImg, selWord, tryMatch])

  const getImgState = (id) => {
    if (matched[id]) return 'matched'
    if (wrongFlash && wrongFlash.startsWith(id)) return 'wrong'
    if (selImg === id) return 'selected'
    return ''
  }
  const getWordState = (id) => {
    if (matched[id]) return 'matched'
    if (wrongFlash && wrongFlash.endsWith(id)) return 'wrong'
    if (selWord === id) return 'selected'
    return ''
  }

  const getMatchColor = (id) => {
    const n = matched[id]
    if (!n) return null
    return MATCH_COLORS[(n - 1) % MATCH_COLORS.length]
  }

  const pct = Math.round((matchedCount / totalPairs) * 100)

  return (
    <div>
      <div className={s.topbar}>
        <button className={s.mapBtn} onClick={onMapPress}>
          <Avatar avatar={avatar} size="sm" /> Map
        </button>
        <div className={s.levelInfo}>
          <span className={s.lvlBadge}>Level {level.id}</span>
          <span className={s.chapter}>{level.chapter}</span>
        </div>
        <span className={s.satPill}>+{level.sats}⚡</span>
      </div>

      <div className={s.progressWrap}>
        <div className={s.progressBar} style={{ width: pct + '%' }} />
      </div>

      <div className={s.story}>
        <p className={s.storyTitle}>{level.title}</p>
        <p className={s.storyText}>{level.story}</p>
      </div>

      <div className={s.hint} style={{ borderLeftColor: level.hintColor }}>
        <p>{level.hint} <span className={s.score}>{matchedCount}/{totalPairs} matched</span></p>
      </div>

      <div className={s.colHeaders}>
        <div className={s.hdrLeft}>🖼 Picture</div>
        <div className={s.hdrRight}>💬 Meaning</div>
      </div>

      {/*
        Single grid with 2 columns. We interleave imgs and words row-by-row
        so each row has its own height and pictures + meanings line up perfectly.
      */}
      <div className={s.board}>
        {shuffledImgs.map((c, i) => {
          const w = shuffledWords[i]
          return (
            <div key={c.id + '-row-' + i} className={s.row}>
              <Card
                emoji={c.emoji}
                label={c.label}
                state={getImgState(c.id)}
                kind="img"
                matchIdx={matched[c.id] || null}
                matchColor={getMatchColor(c.id)}
                onClick={() => pickImg(c.id)}
              />
              <Card
                emoji={w.emoji}
                label={w.label}
                state={getWordState(w.id)}
                kind="word"
                matchIdx={matched[w.id] || null}
                matchColor={getMatchColor(w.id)}
                onClick={() => pickWord(w.id)}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
