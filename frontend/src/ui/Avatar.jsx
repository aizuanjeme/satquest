import s from './Avatar.module.css'

/*
  Avatar — round character portrait with a neon ring + soft glow.
*/
export default function Avatar({ avatar, size = 64, className = '', ring = true }) {
  const px = `${size}px`
  return (
    <div
      className={`${s.wrap} ${ring ? s.ring : ''} ${className}`}
      style={{ width: px, height: px }}
    >
      {avatar?.img ? (
        <img src={avatar.img} alt={avatar?.name || 'avatar'} className={s.img} draggable={false} />
      ) : (
        <span className={s.emoji} style={{ fontSize: size * 0.5 }}>{avatar?.emoji || '🙂'}</span>
      )}
    </div>
  )
}
