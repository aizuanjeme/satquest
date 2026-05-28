import { useEffect, useState } from 'react';

const PAGES = [
  { id: 'hero',        label: 'Home' },
  { id: 'how',         label: 'How it Works' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'community',   label: 'Community' },
  { id: 'blog',        label: 'Blog' },
  { id: 'feedback',    label: 'Feedback' },
  { id: 'opensource',  label: 'Open Source' },
];

export default function PageNav() {
  const [active, setActive] = useState('hero');

  useEffect(() => {
    const els = PAGES.map(({ id }) => document.getElementById(id)).filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { rootMargin: '-45% 0px -45% 0px' }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      aria-label="Page navigation"
      className="fixed right-5 top-1/2 -translate-y-1/2 z-[90] flex flex-col items-center gap-3 hidden md:flex"
    >
      {PAGES.map(({ id, label }) => (
        <a
          key={id}
          href={`#${id}`}
          title={label}
          aria-label={label}
          className="group relative flex items-center justify-end"
        >
          {/* Tooltip */}
          <span className="absolute right-7 bg-[rgba(11,0,48,0.9)] border border-white/10 text-[#FFF7FF] text-[0.72rem] font-bold px-2.5 py-1 rounded-full whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
            {label}
          </span>
          {/* Dot */}
          <span
            className={`block rounded-full transition-all duration-300 ${
              active === id
                ? 'w-3 h-3 bg-[#FF9500] shadow-[0_0_10px_rgba(255,149,0,0.7)]'
                : 'w-2 h-2 bg-white/20 hover:bg-white/50'
            }`}
          />
        </a>
      ))}
    </nav>
  );
}
