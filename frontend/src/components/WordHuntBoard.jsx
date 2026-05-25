import Avatar from './Avatar'
import s from './WordHuntBoard.module.css'

export default function WordHuntBoard({ game, onMapPress }) {
  const {
    level, avatar,
    huntWords, huntPicked, huntTimeLeft, huntRunning, huntResult,
    huntRealFound, huntRealTotal,
    pickHuntWord,
  } = game

  const pct = Math.round((huntRealFound / huntRealTotal) * 100)
  const timeColor =
    huntTimeLeft <= 5 ? 'var(--red)' :
    huntTimeLeft <= 10 ? 'var(--orange)' :
    'var(--green)'

  return (
    <div>
      <div className={s.topbar}>
        <button className={s.mapBtn} onClick={onMapPress}>
          <Avatar avatar={avatar} size="sm" /> Map
        </button>
        <div className={s.levelInfo}>
          <span className={s.lvlBadge}>Level {level.id}</span>
          <span className={s.chapter}>Word Hunt</span>
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

      {/* Timer + score */}
      <div className={s.statsRow}>
        <div className={s.timer} style={{ color: timeColor, borderColor: timeColor }}>
          <span className={s.timerIcon}>⏱</span>
          <span className={s.timerNum}>{huntTimeLeft}s</span>
        </div>
        <div className={s.score}>
          Found <b>{huntRealFound}</b> / {huntRealTotal}
        </div>
      </div>

      <div className={s.hint} style={{ borderLeftColor: level.hintColor }}>
        <p>{level.hint}</p>
      </div>

      {/* Word grid */}
      <div className={s.grid}>
        {huntWords.map((w) => {
          const state = huntPicked[w] // 'right' | 'wrong' | undefined
          const disabled = !huntRunning || !!state
          return (
            <button
              key={w}
              className={`${s.wordCard} ${state === 'right' ? s.right : ''} ${state === 'wrong' ? s.wrong : ''}`}
              onClick={() => pickHuntWord(w)}
              disabled={disabled}
            >
              {w}
            </button>
          )
        })}
      </div>

      {/* Result banner */}
      {huntResult === 'win' && (
        <div className={`${s.banner} ${s.winBanner}`}>
          🎉 Found them all! +{level.sats} sats
        </div>
      )}
      {huntResult === 'lose' && (
        <div className={`${s.banner} ${s.loseBanner}`}>
          ⏰ Time up! No sats this round. Try again next time.
        </div>
      )}
    </div>
  )
}
