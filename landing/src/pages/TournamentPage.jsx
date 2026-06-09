import { useState } from 'react';
import { Link } from 'react-router-dom';
import { avatarSrc } from '../utils/avatar';

/* ── Floating avatar circles positioned around the page ── */
const ORBIT_AVATARS = [
  // top-left cluster
  { gender: 'female', n: 3,  top: '6%',  left: '6%',   size: 96,  anim: 'animate-float1', delay: '0s'    },
  { gender: 'male',   n: 7,  top: '14%', left: '22%',  size: 72,  anim: 'animate-float2', delay: '0.4s'  },
  // top-right cluster
  { gender: 'female', n: 11, top: '5%',  right: '8%',  size: 88,  anim: 'animate-float3', delay: '0.2s'  },
  { gender: 'male',   n: 2,  top: '18%', right: '20%', size: 68,  anim: 'animate-float1', delay: '0.7s'  },
  // left
  { gender: 'female', n: 8,  top: '46%', left: '3%',   size: 80,  anim: 'animate-float2', delay: '0.5s'  },
  // right
  { gender: 'male',   n: 15, top: '44%', right: '4%',  size: 80,  anim: 'animate-float3', delay: '0.3s'  },
  // bottom-left cluster
  { gender: 'female', n: 19, bottom: '8%',  left: '7%',  size: 84, anim: 'animate-float1', delay: '0.6s' },
  { gender: 'male',   n: 4,  bottom: '16%', left: '22%', size: 66, anim: 'animate-float2', delay: '0.1s' },
  // bottom-right cluster
  { gender: 'female', n: 1,  bottom: '7%',  right: '6%',  size: 90, anim: 'animate-float3', delay: '0.8s' },
  { gender: 'male',   n: 13, bottom: '17%', right: '21%', size: 64, anim: 'animate-float1', delay: '0.35s'},
];

const HOW_STEPS = [
  {
    icon: '🎟️',
    title: 'Pick Your Entry Type',
    body: 'Choose Free Entry for a no-cost bracket, or buy into a Paid bracket with sats for a chance at a bigger pot.',
    color: '#00FFB3',
  },
  {
    icon: '🗣️',
    title: 'Join the Discord',
    body: 'All tournament coordination happens in our Discord server. You must be a member to register and receive match alerts.',
    color: '#5865F2',
  },
  {
    icon: '⚔️',
    title: '2–5 Players Per Bracket',
    body: "Each bracket holds between 2 and 5 participants. You're matched against real opponents in head-to-head quiz rounds.",
    color: '#FF9500',
  },
  {
    icon: '🧠',
    title: 'Quiz Battles',
    body: 'Each match is a timed Bitcoin quiz duel on SatQuest. Whoever answers faster and more accurately advances.',
    color: '#B845FF',
  },
  {
    icon: '🏆',
    title: 'Winner Takes Sats',
    body: 'The last player standing in Free brackets earns community-sponsored sats. Paid brackets award the full entry pot to the champion.',
    color: '#FFD700',
  },
];

function HowItWorksModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(11,0,48,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl p-8 flex flex-col gap-6"
        style={{
          background: 'linear-gradient(145deg, #120028 0%, #1a0035 100%)',
          border: '1.5px solid rgba(184,69,255,0.3)',
          boxShadow: '0 0 80px rgba(184,69,255,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/10 transition-all duration-150 text-lg leading-none"
        >
          ✕
        </button>

        <div>
          <h2 className="text-[1.6rem] font-black text-[#FFF7FF] mb-1">How Tournaments Work</h2>
          <p className="text-[0.85rem] text-white/40">Everything you need to know before we launch.</p>
        </div>

        <div className="flex flex-col gap-4">
          {HOW_STEPS.map((step, i) => (
            <div
              key={i}
              className="flex gap-4 items-start rounded-2xl p-4"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${step.color}22`,
              }}
            >
              <div
                className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                style={{ background: `${step.color}18`, border: `1px solid ${step.color}40` }}
              >
                {step.icon}
              </div>
              <div>
                <p className="font-black text-[0.95rem] mb-1" style={{ color: step.color }}>
                  {step.title}
                </p>
                <p className="text-[0.82rem] text-white/50 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Discord CTA */}
        <a
          href="https://discord.gg/Ttwg2yrzYC"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2.5 py-3 rounded-2xl font-black text-[0.95rem] no-underline transition-all duration-200 hover:-translate-y-0.5"
          style={{
            background: 'linear-gradient(135deg, rgba(88,101,242,0.25), rgba(88,101,242,0.12))',
            border: '1.5px solid rgba(88,101,242,0.5)',
            color: '#7289DA',
          }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.003.022.015.043.03.056A19.9 19.9 0 0 0 5.83 20.99a.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.034.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
          </svg>
          Join our Discord — get notified at launch
        </a>
      </div>
    </div>
  );
}

export default function TournamentPage() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden flex items-center justify-center"
      style={{ background: 'linear-gradient(145deg, #08001e 0%, #130030 50%, #060018 100%)' }}
    >
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(184,69,255,0.18) 1px, transparent 1px)', backgroundSize: '34px 34px', opacity: 0.6 }} />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] rounded-full blur-[140px] opacity-15"
        style={{ background: 'radial-gradient(ellipse, rgba(184,69,255,0.8), transparent 70%)' }} />

      {/* ── Floating avatars ── */}
      {ORBIT_AVATARS.map((av, i) => {
        const pos = {};
        if (av.top)    pos.top    = av.top;
        if (av.bottom) pos.bottom = av.bottom;
        if (av.left)   pos.left   = av.left;
        if (av.right)  pos.right  = av.right;

        return (
          <div
            key={i}
            className={`pointer-events-none absolute ${av.anim}`}
            style={{ ...pos, animationDelay: av.delay }}
          >
            <img
              src={avatarSrc(av.gender, av.n)}
              alt=""
              className="rounded-full object-cover object-top"
              style={{
                width: av.size,
                height: av.size,
                border: '2.5px solid rgba(184,69,255,0.35)',
                boxShadow: '0 0 24px rgba(184,69,255,0.3), 0 8px 32px rgba(0,0,0,0.4)',
              }}
            />
          </div>
        );
      })}

      {/* ── Back link ── */}
      <Link
        to="/"
        className="absolute top-5 left-5 z-10 flex items-center gap-2 no-underline text-[0.82rem] font-bold text-white/35 hover:text-white/70 transition-colors duration-200"
      >
        ← Back
      </Link>

      {/* ── Centre content ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 gap-6 animate-zoom-out">
        {/* Coming soon pill */}
        <div
          className="inline-flex items-center gap-2 rounded-full px-5 py-1.5 text-[0.78rem] font-black tracking-[0.18em] uppercase"
          style={{
            background: 'rgba(184,69,255,0.12)',
            border: '1px solid rgba(184,69,255,0.4)',
            color: '#B845FF',
          }}
        >
          <span className="w-2 h-2 rounded-full bg-[#B845FF] animate-pulse" />
          Coming Soon
        </div>

        {/* Title */}
        <div>
          <p className="text-[0.95rem] font-bold text-white/30 mb-2 tracking-widest uppercase">⚔️ SatQuest</p>
          <h1 className="text-[clamp(3rem,8vw,6rem)] font-black leading-none tracking-tight grad-text">
            Tournaments
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-[clamp(0.9rem,1.8vw,1.1rem)] text-white/45 max-w-[400px] leading-relaxed">
          Bracket-style Bitcoin battles. 2–5 players. Free or paid entry. Winner takes the sats.
        </p>

        {/* Buttons row */}
        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full text-[1rem] font-extrabold text-white transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.03]"
            style={{
              background: 'linear-gradient(135deg, #B845FF, #FF2D92)',
              boxShadow: '0 0 30px rgba(184,69,255,0.45)',
            }}
          >
            How It Works →
          </button>

          <a
            href="https://discord.gg/Ttwg2yrzYC"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-[0.95rem] font-bold no-underline transition-all duration-200 hover:-translate-y-0.5"
            style={{
              background: 'rgba(88,101,242,0.15)',
              border: '1.5px solid rgba(88,101,242,0.45)',
              color: '#7289DA',
            }}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.003.022.015.043.03.056A19.9 19.9 0 0 0 5.83 20.99a.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.034.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.030z" />
            </svg>
            Join Discord
          </a>
        </div>

        {/* Entry type pills */}
        <div className="flex gap-3 mt-1">
          <span
            className="px-4 py-1.5 rounded-full text-[0.75rem] font-black tracking-wider uppercase"
            style={{ background: 'rgba(0,255,179,0.1)', border: '1px solid rgba(0,255,179,0.3)', color: '#00FFB3' }}
          >
            🎟️ Free Entry
          </span>
          <span
            className="px-4 py-1.5 rounded-full text-[0.75rem] font-black tracking-wider uppercase"
            style={{ background: 'rgba(255,149,0,0.1)', border: '1px solid rgba(255,149,0,0.3)', color: '#FF9500' }}
          >
            ⚡ Paid Entry
          </span>
        </div>
      </div>

      {/* ── Modal ── */}
      {showModal && <HowItWorksModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
