import s from './Avatar.module.css'

/*
  Avatar — renders the user's character.
  - If `avatar.img` is set, shows the picture.
  - Otherwise falls back to `avatar.emoji`.

  Size variants: 'sm' (24px), 'md' (40px), 'lg' (72px), 'xl' (120px).
*/
export default function Avatar({ avatar, size = 'md', className = '' }) {
  if (!avatar) return null

  return (
    <span className={`${s.wrap} ${s[size]} ${className}`}>
      {avatar.img ? (
        <img src={avatar.img} alt={avatar.name || 'avatar'} className={s.img} />
      ) : (
        <span className={s.emoji}>{avatar.emoji}</span>
      )}
    </span>
  )
}
