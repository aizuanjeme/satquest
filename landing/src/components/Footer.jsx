import s from './Footer.module.css'

const APP_URL = 'https://satquests.netlify.app'

const NAV = [
  { href: '#how',       label: 'How It Works' },
  { href: '#stats',     label: 'Stats'        },
  { href: '#community', label: 'Community'    },
  { href: APP_URL,      label: 'Play the App', external: true },
  { href: 'https://github.com/aizuanjeme/satquest', label: 'GitHub', external: true },
]

export default function Footer() {
  return (
    <footer className={s.footer}>
      {/* Top CTA */}
      <div className={s.cta}>
        <div className={s.ctaGlow} />
        <h2 className={s.ctaTitle}>
          Ready to stack <span className="grad-gold">sats?</span>
        </h2>
        <p className={s.ctaSub}>
          No account. No fees. Just Bitcoin education — free, forever.
        </p>
        <a href={APP_URL} target="_blank" rel="noopener" className={`btn btn-solid-blue ${s.ctaBtn}`}>
          ⚡ Start Your Quest
        </a>
      </div>

      {/* Divider */}
      <div className={s.divider} />

      {/* Bottom bar */}
      <div className={s.bottom}>
        <a href="#" className={s.brand}>
          <span className={s.brandIcon}>⚡</span>
          <span className={s.brandSat}>Sat</span>Quest
        </a>

        <ul className={s.links}>
          {NAV.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                target={l.external ? '_blank' : undefined}
                rel={l.external ? 'noopener' : undefined}
                className={s.link}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <p className={s.copy}>MIT Licensed · Built with ⚡ by the community</p>
      </div>
    </footer>
  )
}
