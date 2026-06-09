import { Link } from 'react-router-dom';

const APP_URL = import.meta.env.VITE_APP_URL ?? 'https://satquests.netlify.app';

const LINKS = [
  { href: 'https://github.com/aizuanjeme/satquest', label: 'GitHub',       external: true },
  { href: APP_URL,                                  label: 'Play the App', external: true },
  { href: '#leaderboard',                           label: 'Leaderboard'                  },
  { href: '#community',                             label: 'Community'                     },
  { href: '#blog',                                  label: 'Blog'                          },
  { href: '#feedback',                              label: 'Feedback'                      },
  { href: '#how',                                   label: 'How it Works'                  },
];

export default function Footer() {
  return (
    <footer className="py-12 px-[5%] border-t border-white/10 flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-6">
        <a href="#" className="text-[1.3rem] font-black no-underline text-[#FFF7FF]">
          ⚡ <span className="text-[#FF9500]">Sat</span>Quest
        </a>

        <ul className="flex gap-7 list-none m-0 p-0 flex-wrap">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                target={l.external ? '_blank' : undefined}
                rel={l.external ? 'noopener' : undefined}
                className="no-underline text-[#7A5DC9] text-[0.88rem] font-semibold transition-colors duration-200 hover:text-[#FFF7FF]"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>

        <p className="text-[#7A5DC9] text-[0.82rem] m-0">
          MIT Licensed · Built with ⚡ by the SatQuest community
        </p>
      </div>

      {/* Legal links */}
      <div className="flex items-center gap-5 border-t border-white/5 pt-5">
        <Link
          to="/events"
          className="no-underline text-[#7A5DC9] text-[0.78rem] font-semibold hover:text-[#FFF7FF] transition-colors duration-200"
        >
          Events
        </Link>
        <Link
          to="/terms"
          className="no-underline text-[#7A5DC9] text-[0.78rem] font-semibold hover:text-[#FFF7FF] transition-colors duration-200"
        >
          Terms &amp; Conditions
        </Link>
        <Link
          to="/privacy"
          className="no-underline text-[#7A5DC9] text-[0.78rem] font-semibold hover:text-[#FFF7FF] transition-colors duration-200"
        >
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
