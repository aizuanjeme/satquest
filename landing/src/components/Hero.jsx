import AvatarCard from './AvatarCard';
import { avatarSrc } from '../utils/avatar';

const FLOAT_CLASSES = [
  'float-1', 'float-2', 'float-3',
  'float-4', 'float-5', 'float-6',
  'float-7', 'float-8', 'float-9',
];

const HERO_AVATARS = [
  { gender: 'female', n: 3,  label: '⚡ 1,240 sats' },
  { gender: 'male',   n: 7,  label: '⚡ 980 sats'   },
  { gender: 'female', n: 11, label: '⚡ 860 sats'   },
  { gender: 'male',   n: 2,  label: '⚡ 2,100 sats' },
  { gender: 'female', n: 1,  label: '⚡ 3,450 sats', center: true },
  { gender: 'male',   n: 15, label: '⚡ 1,780 sats' },
  { gender: 'female', n: 8,  label: '⚡ 640 sats'   },
  { gender: 'male',   n: 4,  label: '⚡ 1,120 sats' },
  { gender: 'female', n: 19, label: '⚡ 920 sats'   },
];

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen pt-[120px] pb-20 px-[5%] grid grid-cols-1 md:grid-cols-2 gap-16 items-center overflow-hidden"
    >
      {/* Background blobs */}
      <div className="pointer-events-none absolute -top-[100px] -left-[100px] w-[500px] h-[500px] rounded-full blur-[80px] bg-[radial-gradient(circle,rgba(184,69,255,0.25),transparent_70%)]" />
      <div className="pointer-events-none absolute top-[200px] -right-[80px] w-[400px] h-[400px] rounded-full blur-[80px] bg-[radial-gradient(circle,rgba(255,149,0,0.20),transparent_70%)]" />
      <div className="pointer-events-none absolute -bottom-[60px] left-[30%] w-[350px] h-[350px] rounded-full blur-[80px] bg-[radial-gradient(circle,rgba(0,229,255,0.15),transparent_70%)]" />

      {/* ── Hero content ── */}
      <div className="relative z-10 order-2 md:order-1 text-center md:text-left">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-[rgba(255,149,0,0.12)] border border-[rgba(255,149,0,0.3)] rounded-full px-4 py-1.5 text-[0.85rem] font-bold text-[#FF9500] mb-6 animate-fadein">
          <span className="w-2 h-2 bg-[#00FFB3] rounded-full animate-pulse-dot" />
          Open-source · Built for Nigerians
        </div>

        <h1 className="text-[clamp(2.6rem,5vw,4.5rem)] font-black leading-[1.1] tracking-[-1px] mb-5 animate-fadein-1">
          Learn <span className="grad-text">Bitcoin.</span>
          <br />
          Stack <span className="grad-text-green">Real Sats.</span>
        </h1>

        <p className="text-[clamp(1rem,1.8vw,1.2rem)] text-[#B095E8] max-w-[480px] mb-10 animate-fadein-2 mx-auto md:mx-0">
          26 levels of progressive Bitcoin education — from "what is a sat?" to apex Lightning wisdom.
          Pick your avatar, earn sats at every level, and climb the global leaderboard.
        </p>

        <div className="flex gap-4 flex-wrap animate-fadein-3 justify-center md:justify-start">
          <a
            href="https://satquests.netlify.app"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 no-underline bg-gradient-to-br from-[#FF9500] to-[#FF2D92] text-white px-9 py-3.5 rounded-full text-[1.05rem] font-extrabold shadow-[0_0_30px_rgba(255,149,0,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_10px_40px_rgba(255,149,0,0.55)]"
          >
            ⚡ Play Now — It&apos;s Free
          </a>
          <a
            href="#how"
            className="inline-flex items-center gap-2 no-underline bg-transparent border-[1.5px] border-white/10 text-[#B095E8] px-8 py-3.5 rounded-full text-[1rem] font-bold transition-all duration-200 hover:border-[#B845FF] hover:text-[#B845FF] hover:-translate-y-0.5"
          >
            How It Works ↓
          </a>
        </div>
      </div>

      {/* ── Floating avatar grid ── */}
      <div className="relative z-10 order-1 md:order-2 grid grid-cols-3 gap-5 items-center justify-items-center max-w-[420px] md:max-w-none mx-auto md:mx-0">
        {HERO_AVATARS.map((av, i) => (
          <AvatarCard
            key={i}
            src={avatarSrc(av.gender, av.n)}
            alt={`${av.gender} avatar ${av.n}`}
            label={av.label}
            isCenter={!!av.center}
            floatClass={FLOAT_CLASSES[i]}
          />
        ))}
      </div>
    </section>
  );
}
