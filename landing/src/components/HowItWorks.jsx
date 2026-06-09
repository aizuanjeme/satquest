const STEPS = [
  {
    icon: '🧑🏿',
    title: 'Pick Your Avatar',
    desc: 'Choose from 38 custom Nigerian characters — 19 sisters, 19 brothers. Set your username. Your identity lives on your device, no login needed.',
    glow: 'rgba(184,69,255,0.4)',
    numBg: 'rgba(184,69,255,0.2)',
  },
  {
    icon: '🎯',
    title: 'Play the Levels',
    desc: 'Work through 26 progressive Bitcoin lessons. Match pictures to meanings. Each level builds on the last — from satoshis to the Lightning Network.',
    glow: 'rgba(255,149,0,0.4)',
    numBg: 'rgba(255,149,0,0.2)',
  },
  {
    icon: '🧩',
    title: 'Survive Word Hunt',
    desc: 'Every 4th level is a timed Word Hunt. Spot the real Bitcoin words hidden among decoys like "SWIFT", "IBAN", and "bank". Beat the clock, earn bonus sats.',
    glow: 'rgba(0,255,179,0.4)',
    numBg: 'rgba(0,255,179,0.2)',
  },
  {
    icon: '🏆',
    title: 'Climb the Board',
    desc: 'Your sats, level completions, and best times are synced to the global leaderboard. Stack more sats. Go faster. Rise to the top.',
    glow: 'rgba(255,45,146,0.4)',
    numBg: 'rgba(255,45,146,0.2)',
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how"
      className="py-24 px-[5%] relative"
      style={{
        background:
          'linear-gradient(180deg, transparent, rgba(184,69,255,0.04) 50%, transparent)',
      }}
    >
      {/* Blob */}
      <div className="pointer-events-none absolute -bottom-[100px] -right-[80px] w-[500px] h-[500px] rounded-full blur-[80px] opacity-40 bg-[radial-gradient(circle,rgba(184,69,255,0.25),transparent_70%)]" />

      {/* Heading */}
      <div className="text-center">
        <span className="block text-[0.8rem] font-extrabold tracking-[2px] uppercase text-[#FF9500] mb-3" style={{ animation: 'fadein 0.45s ease both', animationDelay: '0.1s' }}>
          Getting Started
        </span>
        <h2
          className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-black leading-[1.15] tracking-[-0.5px] mb-4"
          style={{ animation: 'fadein 0.45s ease both', animationDelay: '0.2s' }}
        >
          Four Steps to Stack <span className="grad-text">Sats</span>
        </h2>
        <p
          className="text-[#B095E8] text-[1.05rem] max-w-[560px] mx-auto mb-12"
          style={{ animation: 'fadein 0.45s ease both', animationDelay: '0.3s' }}
        >
          No sign-up. No bank account. No Bitcoin needed to start. Just pick your character and go.
        </p>
      </div>

      {/* Step cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {STEPS.map((step, i) => (
          <div
            key={i}
            className="relative bg-[rgba(184,69,255,0.08)] border border-white/10 rounded-[24px] p-8 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_rgba(184,69,255,0.12)] hover:border-[rgba(184,69,255,0.35)]"
            style={{ animation: 'fadein 0.45s ease both', animationDelay: `${0.4 + i * 0.08}s` }}
          >
            {/* Corner glow */}
            <div
              className="pointer-events-none absolute -top-10 -right-10 w-[100px] h-[100px] rounded-full blur-[30px] opacity-40"
              style={{ background: step.glow }}
            />
            {/* Icon */}
            <div
              className="w-11 h-11 rounded-[14px] flex items-center justify-center text-[1.3rem] mb-5"
              style={{ background: step.numBg }}
            >
              {step.icon}
            </div>
            <h3 className="text-[1.1rem] font-extrabold mb-2.5 text-[#FFF7FF]">{step.title}</h3>
            <p className="text-[0.92rem] text-[#B095E8] leading-[1.55]">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
