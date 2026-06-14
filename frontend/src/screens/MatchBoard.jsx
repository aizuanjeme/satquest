import { useEffect, useRef, useCallback } from 'react'
import { MatchEngine } from '../core/GameEngine'
import { sound } from '../audio/SoundManager'
import GameFrame from './GameFrame'
import s from './MatchBoard.module.css'

/*
  MatchBoard — responsive 2D HTML card grid. Cards are large, readable,
  scrollable on mobile. Images column on the left, meanings on the right.
  State is 100% in useGame; this component is pure presentation.
*/
export default function MatchBoard({ game, onMapPress }) {
  const {
    level, levelIdx, sats,
    matched, selImg, selWord, wrongFlash, matchedCount, totalPairs,
    shuffledImgs, shuffledWords, pickImg, pickWord, tryMatch,
  } = game

  // Resolve match when both are selected
  useEffect(() => {
    if (selImg && selWord) tryMatch(selImg, selWord)
  }, [selImg, selWord, tryMatch])

  // Sound feedback
  const prevMatched = useRef(0)
  useEffect(() => {
    if (matchedCount > prevMatched.current) sound.correct()
    prevMatched.current = matchedCount
  }, [matchedCount])

  useEffect(() => {
    if (wrongFlash) sound.wrong()
  }, [wrongFlash])

  const getCardState = useCallback((id, side) => {
    if (matched[id]) return 'matched'
    if (wrongFlash) {
      const [wi, ww] = wrongFlash.split('|')
      if ((side === 'img' && id === wi) || (side === 'word' && id === ww)) return 'wrong'
    }
    if (side === 'img' && selImg === id) return 'selected'
    if (side === 'word' && selWord === id) return 'selected'
    return 'idle'
  }, [matched, selImg, selWord, wrongFlash])

  return (
    <GameFrame
      level={level}
      levelIdx={levelIdx}
      sats={sats}
      onMapPress={onMapPress}
      progress={MatchEngine.progress(matchedCount, totalPairs)}
      progressLabel={`${matchedCount}/${totalPairs}`}
    >
      <p className={s.hint} style={{ color: level.hintColor }}>{level.hint}</p>
      <div className={s.board}>
        {/* Images column */}
        <div className={s.col}>
          {shuffledImgs.map((card) => {
            const state = getCardState(card.id, 'img')
            return (
              <button
                key={card.id}
                className={`${s.card} ${s[state]}`}
                onClick={() => { if (state !== 'matched') { sound.tap(); pickImg(card.id) } }}
                disabled={state === 'matched'}
                aria-label={card.label}
              >
                <span className={s.emoji}>{card.emoji}</span>
                <span className={s.label}>{card.label}</span>
                {state === 'matched' && <span className={s.check}>✓</span>}
              </button>
            )
          })}
        </div>

        {/* Words column */}
        <div className={s.col}>
          {shuffledWords.map((card) => {
            const state = getCardState(card.id, 'word')
            return (
              <button
                key={card.id}
                className={`${s.card} ${s[state]} ${s.wordCard}`}
                onClick={() => { if (state !== 'matched') { sound.tap(); pickWord(card.id) } }}
                disabled={state === 'matched'}
                aria-label={card.label}
              >
                <span className={s.emoji}>{card.emoji}</span>
                <span className={s.label}>{card.label}</span>
                {state === 'matched' && <span className={s.check}>✓</span>}
              </button>
            )
          })}
        </div>
      </div>
    </GameFrame>
  )
}
