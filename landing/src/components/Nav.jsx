import { useEffect, useState } from 'react';

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
          <a
            href="https://github.com/aizuanjeme/satquest"
            target="_blank"
            rel="noopener"
            className={linkClass('')}
          >
            GitHub
          </a>
        </li>
        <li>
          <a
            href="https://satquests.netlify.app"
            target="_blank"
            rel="noopener"
            className="bg-gradient-to-br from-[#FF9500] to-[#FF2D92] text-white no-underline px-[1.4rem] py-2 rounded-full font-extrabold text-[0.95rem] shadow-[0_0_20px_rgba(255,149,0,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_30px_rgba(255,149,0,0.5)]"
          >
            Play Now ⚡
          </a>
        </li>
      </ul>
    </nav>
  );
}
