import { LEVELS } from '../data/levels'
import Avatar from './Avatar'
import s from './Reveal.module.css'

export default function Reveal({ level, levelIdx, sats, avatar, lastEarned, onNext, onMap }) {
  const isLast   = levelIdx === LEVELS.length - 1
  const isHunt   = level.type === 'wordhunt'
  const earned   = lastEarned ?? level.sats
  const huntWon  = isHunt && earned > 0
  const huntLost = isHunt && earned === 0

  return (
    <div className={s.body}>
      <div className={s.topbar}>
        <button className={s.mapBtn} onClick={onMap}>
          <Avatar avatar={avatar} size="sm" /> Map
        </button>
        <span className={s.lvl}>Level {level.id} complete!</span>
        <span className={s.satTotal}>⚡ {sats} total</span>
      </div>

      <div className={s.inner}>
        {isHunt ? (
          <>
            <p className={s.title}>
              {huntWon ? '🎉 Word Hunt cleared!' : '⏰ Time ran out'}
            </p>
            <p className={s.sub}>
              {huntWon
                ? `You spotted all the real Bitcoin words. Nice eye!`
                : `No sats this time. The words will come back. Keep playing.`}
            </p>
            <div className={s.huntWordList}>
              <p className={s.huntWordsTitle}>The real Bitcoin words were:</p>
              <div className={s.huntChips}>
                {level.real.map(w => (
                  <span key={w} className={s.huntChip}>{w}</span>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            <p className={s.title}>{isLast ? 'You finished! All secrets revealed!' : 'See the secret!'}</p>
            <p className={s.sub}>{isLast ? 'You are now Bitcoin-literate. For real!' : 'Here is what you just learned about Bitcoin'}</p>

            {level.reveals && level.reveals.map((r, i) => (
              <div key={i} className={s.card} style={{ animationDelay: i * 0.08 + 's' }}>
                <div className={s.icons}>
                  <span>{r.naija}</span>
                  <span className={s.arr}>down</span>
                  <span>{r.btc}</span>
                </div>
                <div className={s.content}>
                  <p className={s.match}>{r.match}</p>
                  <p className={s.def}>{r.def}</p>
                  <p className={s.funny}>{r.funny}</p>
                </div>
              </div>
            ))}
          </>
        )}

        <div className={s.satsBox}>
          <p className={s.satsBig}>
            {huntLost ? '+0 sats' : `+${earned} sats earned!`}
          </p>
          <p className={s.satsLbl}>
            {huntLost ? 'better luck next hunt' : 'sent via Lightning'}
          </p>
        </div>

        <button className={s.btn} onClick={onNext}>
          {isLast ? 'You are done! Play again' : 'Next Level'}
        </button>
        <button className={s.mapBtnBig} onClick={onMap}>Back to map</button>
      </div>
    </div>
  )
}
