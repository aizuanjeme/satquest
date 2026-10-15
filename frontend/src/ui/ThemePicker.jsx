import { useTheme, THEMES } from '../hooks/useTheme'
import { sound } from '../audio/SoundManager'
import { t as tr } from '../i18n'
import s from './ThemePicker.module.css'

export default function ThemePicker({ onClose }) {
  const { theme, setTheme } = useTheme()

  const pick = (id) => {
    sound.tap()
    setTheme(id)
  }

  return (
    <div className={s.backdrop} onClick={onClose}>
      <div className={s.sheet} onClick={(e) => e.stopPropagation()}>
        <div className={s.handle} />
        <p className={s.heading}>{tr('theme.heading')}</p>
        <div className={s.gridWrap}>
          <div className={s.grid}>
            {THEMES.map((t) => (
              <button
                key={t.id}
                className={`${s.card} ${theme === t.id ? s.active : ''}`}
                onClick={() => pick(t.id)}
              >
                {/* Mini palette preview */}
                <div className={s.palette}>
                  {t.colors.map((c, i) => (
                    <span key={i} className={s.swatch} style={{ background: c }} />
                  ))}
                </div>
                <span className={s.emoji}>{t.emoji}</span>
                <span className={s.name}>{tr(`theme.${t.id}.label`)}</span>
                <span className={s.desc}>{tr(`theme.${t.id}.desc`)}</span>
                {theme === t.id && <span className={s.check}>✓</span>}
              </button>
            ))}
          </div>
        </div>
        <div className={s.closeRow}>
          <button className={s.close} onClick={onClose}>{tr('common.done')}</button>
        </div>
      </div>
    </div>
  )
}
