import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// Full page style — background colour + the same pattern as each snap-page in App.jsx
const PAGE_STYLE = {
  hero:        { backgroundColor: 'rgba(11,0,48,0.55)' },
  stats:       { backgroundColor: 'rgba(11,0,48,0.55)' },
  how:         { backgroundColor: 'rgba(28,8,0,0.55)' },
  leaderboard: { backgroundColor: 'rgba(0,12,30,0.55)' },
  community:   { backgroundColor: 'rgba(0,16,24,0.55)' },
  blog:        { backgroundColor: 'rgba(7,0,30,0.55)' },
  feedback:    { backgroundColor: 'rgba(15,0,14,0.55)' },
  opensource:  { backgroundColor: 'rgba(0,15,8,0.55)' },
};

export default function Nav() {
  const [activeSection, setActiveSection] = useState('hero');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const sections = document.querySelectorAll('section[id], div[id="stats"]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { rootMargin: '-40% 0px -40% 0px' }
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const navBg = PAGE_STYLE[activeSection] ?? PAGE_STYLE.hero;

  const linkClass = (id) =>
    `font-semibold text-[0.95rem] no-underline transition-colors duration-200 ${
      activeSection === id ? 'text-[#FFF7FF]' : 'text-[#B095E8] hover:text-[#FFF7FF]'
    }`;

  return (
    <>
    <nav
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-[5%] h-[68px] border-b border-white/10"
      style={{
        ...navBg,
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        transition: 'background-color 0.45s ease',
      }}
    >
      <a href="#" className="text-[1.4rem] font-black tracking-tight no-underline text-[#FFF7FF]">
        ⚡ <span className="text-[#FF9500]">Sat</span>Quest
      </a>

      <ul className="flex items-center gap-8 list-none m-0 p-0">
        <li className="hidden sm:block">
          <a href="#how" className={linkClass('how')}>How it Works</a>
        </li>
        <li className="hidden sm:block">
          <a href="#leaderboard" className={linkClass('leaderboard')}>Leaderboard</a>
        </li>
        <li className="hidden sm:block">
          <a href="#community" className={linkClass('community')}>Community</a>
        </li>
        <li className="hidden sm:block">
          <a href="#blog" className={linkClass('blog')}>Blog</a>
        </li>
        <li className="hidden sm:block">
          <a href="#feedback" className={linkClass('feedback')}>Feedback</a>
        </li>
        <li className="hidden sm:block">
          <Link
            to="/tournament"
            className="font-semibold text-[0.95rem] no-underline transition-colors duration-200 text-[#B845FF] hover:text-[#FFF7FF]"
          >
            ⚔️ Tournament
          </Link>
        </li>
        <li className="hidden sm:block">
          <Link
            to="/events"
            className="font-semibold text-[0.95rem] no-underline transition-colors duration-200 text-[#B095E8] hover:text-[#FFF7FF]"
          >
            📅 Events
          </Link>
        </li>
        <li className="hidden sm:block">
          <a
            href="https://github.com/aizuanjeme/satquest"
            target="_blank"
            rel="noopener"
            className={linkClass('')}
          >
            GitHub
          </a>
        </li>
        <li className="hidden sm:block">
          <a
            href="https://satquests.netlify.app"
            target="_blank"
            rel="noopener"
            className="bg-gradient-to-br from-[#FF9500] to-[#FF2D92] text-white no-underline px-[1.4rem] py-2 rounded-full font-extrabold text-[0.95rem] shadow-[0_0_20px_rgba(255,149,0,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_30px_rgba(255,149,0,0.5)]"
          >
            Play Now ⚡
          </a>
        </li>

        {/* Hamburger — mobile only */}
        <li className="sm:hidden">
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Toggle menu"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 8,
              padding: '6px 10px',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{
              display: 'block', width: 18, height: 2,
              background: '#fff', borderRadius: 2,
              transition: 'transform 0.25s, opacity 0.25s',
              transform: menuOpen ? 'translateY(6px) rotate(45deg)' : 'none',
            }} />
            <span style={{
              display: 'block', width: 18, height: 2,
              background: '#fff', borderRadius: 2,
              transition: 'opacity 0.2s',
              opacity: menuOpen ? 0 : 1,
            }} />
            <span style={{
              display: 'block', width: 18, height: 2,
              background: '#fff', borderRadius: 2,
              transition: 'transform 0.25s, opacity 0.25s',
              transform: menuOpen ? 'translateY(-6px) rotate(-45deg)' : 'none',
            }} />
          </button>
        </li>
      </ul>
    </nav>

    {/* Mobile dropdown menu */}
    <div
      className="sm:hidden fixed left-0 right-0 z-[99]"
      style={{
        top: 68,
        background: 'rgba(7,0,30,0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        maxHeight: menuOpen ? 520 : 0,
        overflow: 'hidden',
        transition: 'max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div style={{ padding: '8px 0 16px' }}>
        {[
          { label: 'How it Works',  href: '#how',         isAnchor: true },
          { label: 'Leaderboard',   href: '#leaderboard', isAnchor: true },
          { label: 'Community',     href: '#community',   isAnchor: true },
          { label: 'Blog',          href: '#blog',        isAnchor: true },
          { label: 'Feedback',      href: '#feedback',    isAnchor: true },
          { label: '⚔️ Tournament', href: '/tournament',  isAnchor: false, color: '#c77dff' },
          { label: '📅 Events',     href: '/events',      isAnchor: false, color: '#B095E8' },
          { label: 'GitHub',        href: 'https://github.com/aizuanjeme/satquest', isAnchor: true, external: true },
        ].map(item => (
          item.isAnchor ? (
            <a
              key={item.label}
              href={item.href}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noopener' : undefined}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block',
                padding: '12px 24px',
                color: item.color || '#B095E8',
                textDecoration: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {item.label}
            </a>
          ) : (
            <Link
              key={item.label}
              to={item.href}
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'block',
                padding: '12px 24px',
                color: item.color,
                textDecoration: 'none',
                fontSize: '1rem',
                fontWeight: 600,
                borderBottom: '1px solid rgba(255,255,255,0.04)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {item.label}
            </Link>
          )
        ))}

        {/* Play Now CTA */}
        <div style={{ padding: '14px 24px 4px' }}>
          <a
            href="https://satquests.netlify.app"
            target="_blank"
            rel="noopener"
            onClick={() => setMenuOpen(false)}
            style={{
              display: 'block',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #FF9500, #FF2D92)',
              color: '#fff',
              textDecoration: 'none',
              padding: '12px',
              borderRadius: 12,
              fontWeight: 800,
              fontSize: '1rem',
            }}
          >
            Play Now ⚡
          </a>
        </div>
      </div>
    </div>
    </>
  );
}
