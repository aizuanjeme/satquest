import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import s from './Nav.module.css'

const ANCHOR_LINKS = [
  { href: '#how',         label: 'How It Works' },
  { href: '#leaderboard', label: 'Leaderboard'  },
  { href: '#feedback',    label: 'Feedback'      },
  { href: '#blog',        label: 'Blog'          },
  { href: '#community',   label: 'Community'     },
]

const APP_URL = 'https://satquests.netlify.app'

export default function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`${s.nav} ${scrolled ? s.scrolled : ''}`}>
      <a href="#" className={s.brand}>
        <span className={s.brandIcon}>⚡</span>
        <span className={s.brandSat}>Sat</span>Quest
      </a>

      {/* Desktop links */}
      <ul className={s.links}>
        <li>
          <Link to="/tournament" className={`${s.link} ${s.tournamentLink}`}>⚔️ Tournament</Link>
        </li>
        {ANCHOR_LINKS.map((l) => (
          <li key={l.href}>
            <a href={l.href} className={s.link}>{l.label}</a>
          </li>
        ))}
      </ul>

      <a href={APP_URL} target="_blank" rel="noopener" className={`btn btn-blue ${s.cta}`}>
        Play Free →
      </a>

      {/* Mobile hamburger */}
      <button
        className={s.hamburger}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        onClick={() => setMenuOpen((o) => !o)}
      >
        <span className={`${s.bar} ${menuOpen ? s.barOpen : ''}`} />
        <span className={`${s.bar} ${menuOpen ? s.barOpen : ''}`} />
        <span className={`${s.bar} ${menuOpen ? s.barOpen : ''}`} />
      </button>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className={s.drawer}>
          <Link to="/tournament" className={s.drawerLink} onClick={() => setMenuOpen(false)}>
            ⚔️ Tournament
          </Link>
          {ANCHOR_LINKS.map((l) => (
            <a key={l.href} href={l.href} className={s.drawerLink} onClick={() => setMenuOpen(false)}>
              {l.label}
            </a>
          ))}
          <a href={APP_URL} target="_blank" rel="noopener" className={`btn btn-solid-blue ${s.drawerCta}`}>
            ⚡ Play Now
          </a>
        </div>
      )}
    </nav>
  )
}

