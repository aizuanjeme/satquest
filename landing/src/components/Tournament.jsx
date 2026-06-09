/* ─── Tournament Page ─────────────────────────────────── */

const TOURNAMENT_TYPES = [
  {
    id: 'free',
    title: 'Free Entry',
    icon: '🎟️',
    badge: 'FREE',
    badgeColor: '#00FFB3',
    badgeBg: 'rgba(0,255,179,0.12)',
    badgeBorder: 'rgba(0,255,179,0.3)',
    glow: 'rgba(0,255,179,0.35)',
    borderColor: 'rgba(0,255,179,0.25)',
    description: 'No cost to join. Perfect for beginners wanting to test their Bitcoin knowledge and compete for glory.',
    prizeHint: '⚡ Sat prizes sponsored by the community',
    discord: true,
  },
  {
    id: 'paid',
    title: 'Entry Fee',
    icon: '⚡',
    badge: 'PAID',
    badgeColor: '#FF9500',
    badgeBg: 'rgba(255,149,0,0.12)',
    badgeBorder: 'rgba(255,149,0,0.3)',
    glow: 'rgba(255,149,0,0.35)',
    borderColor: 'rgba(255,149,0,0.25)',
    description: 'Buy in with sats to enter higher-stakes brackets. Winner takes the pot — minus a small platform fee.',
    prizeHint: '🏆 Winner-takes-all sat pot',
    discord: true,
  },
];

const MEMBER_SLOTS = [2, 3, 4, 5];

function MemberSlots({ count }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="relative w-8 h-8 rounded-full flex items-center justify-center text-[0.65rem] font-black transition-all duration-300"
          style={{
            background:
              i < count
                ? 'linear-gradient(135deg, #B845FF, #FF2D92)'
                : 'rgba(255,255,255,0.06)',
            border: `1.5px solid ${i < count ? 'rgba(184,69,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
            boxShadow: i < count ? '0 0 10px rgba(184,69,255,0.4)' : 'none',
          }}
        >
          {i < count ? '👤' : ''}
        </div>
      ))}
      <span className="ml-2 text-[0.78rem] font-bold text-white/40">
        {count} – 5 players
      </span>
    </div>
  );
}

function TournamentCard({ t }) {
  return (
    <div
      className="relative rounded-2xl p-6 flex flex-col gap-4 w-full max-w-[360px]"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: `1.5px solid ${t.borderColor}`,
        boxShadow: `0 0 40px ${t.glow}`,
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Top badge */}
      <div className="flex items-center justify-between">
        <span
          className="text-[0.7rem] font-black tracking-widest px-3 py-1 rounded-full"
          style={{
            color: t.badgeColor,
            background: t.badgeBg,
            border: `1px solid ${t.badgeBorder}`,
          }}
        >
          {t.badge}
        </span>
        <span className="text-2xl">{t.icon}</span>
      </div>

      {/* Title */}
      <h3 className="text-[1.25rem] font-black text-[#FFF7FF]">{t.title}</h3>

      {/* Description */}
      <p className="text-[0.88rem] text-white/55 leading-relaxed">{t.description}</p>

      {/* Members range */}
      <div className="flex flex-col gap-2">
        <span className="text-[0.72rem] font-bold text-white/30 uppercase tracking-wider">
          Players per bracket
        </span>
        <MemberSlots count={3} />
      </div>

      {/* Prize hint */}
      <div
        className="text-[0.8rem] font-bold rounded-xl px-4 py-2.5 text-center"
        style={{ background: t.badgeBg, color: t.badgeColor, border: `1px solid ${t.badgeBorder}` }}
      >
        {t.prizeHint}
      </div>

      {/* Discord requirement */}
      {t.discord && (
        <div className="flex items-center gap-2 text-[0.78rem] text-white/40 font-semibold">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#5865F2' }}>
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.003.022.015.043.03.056A19.9 19.9 0 0 0 5.83 20.99a.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.034.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
          </svg>
          Must join our Discord to participate
        </div>
      )}

      {/* Coming Soon lock */}
      <div className="absolute inset-0 rounded-2xl flex items-center justify-center bg-[rgba(11,0,48,0.55)] backdrop-blur-[2px] z-10">
        <div className="text-center">
          <div className="text-3xl mb-1">🔒</div>
          <span className="text-[0.75rem] font-black tracking-[0.15em] text-white/40 uppercase">
            Coming Soon
          </span>
        </div>
      </div>
    </div>
  );
}

function BracketVisual() {
  const players = ['You', 'Rival A', 'Rival B', 'Rival C'];
  return (
    <div className="flex flex-col items-center gap-3 select-none">
      {/* Round 1 */}
      <div className="text-[0.65rem] font-black tracking-widest text-white/25 uppercase">Round 1</div>
      <div className="flex gap-4">
        {players.map((p, i) => (
          <div
            key={p}
            className="relative w-[68px] h-[36px] rounded-xl flex items-center justify-center text-[0.7rem] font-black"
            style={{
              background:
                p === 'You'
                  ? 'linear-gradient(135deg,#FF9500,#FF2D92)'
                  : 'rgba(255,255,255,0.06)',
              border: `1.5px solid ${p === 'You' ? 'rgba(255,149,0,0.5)' : 'rgba(255,255,255,0.1)'}`,
              color: p === 'You' ? '#fff' : 'rgba(255,255,255,0.35)',
              boxShadow: p === 'You' ? '0 0 16px rgba(255,149,0,0.4)' : 'none',
            }}
          >
            {p === 'You' ? '⚡ You' : `P${i + 1}`}
          </div>
        ))}
      </div>

      {/* Connector lines */}
      <div className="flex gap-4 items-center">
        <div className="w-[68px] h-px bg-white/10" />
        <div className="w-[4px] h-[24px] rounded-full bg-white/10" />
        <div className="w-[68px] h-px bg-white/10" />
        <div className="w-[4px] h-[24px] rounded-full bg-white/10" />
      </div>

      {/* Semi finals */}
      <div className="text-[0.65rem] font-black tracking-widest text-white/25 uppercase">Semi Finals</div>
      <div className="flex gap-12">
        {['Match 1', 'Match 2'].map((m) => (
          <div
            key={m}
            className="w-[80px] h-[36px] rounded-xl flex items-center justify-center text-[0.65rem] font-bold text-white/25"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1.5px dashed rgba(255,255,255,0.1)' }}
          >
            {m}
          </div>
        ))}
      </div>

      {/* Final connector */}
      <div className="flex gap-12 items-center">
        <div className="w-[80px] h-px bg-white/10" />
        <div className="w-[4px] h-[20px] rounded-full bg-white/10" />
        <div className="w-[80px] h-px bg-white/10" />
      </div>

      {/* Final */}
      <div className="text-[0.65rem] font-black tracking-widest text-white/25 uppercase">Final</div>
      <div
        className="w-[120px] h-[44px] rounded-2xl flex items-center justify-center text-[0.85rem] font-black"
        style={{
          background: 'linear-gradient(135deg, rgba(255,215,0,0.15), rgba(255,149,0,0.15))',
          border: '1.5px solid rgba(255,215,0,0.3)',
          color: 'rgba(255,215,0,0.6)',
          boxShadow: '0 0 24px rgba(255,215,0,0.15)',
        }}
      >
        🏆 Champion
      </div>
    </div>
  );
}

export default function Tournament() {
  return (
    <section
      id="tournament"
      className="relative min-h-screen py-20 px-[5%] flex flex-col items-center justify-center gap-12 overflow-hidden"
    >
      {/* ── Header ── */}
      <div className="text-center z-10">
        {/* Coming Soon badge */}
        <div className="inline-flex items-center gap-2 rounded-full px-5 py-1.5 mb-5 text-[0.8rem] font-black tracking-widest uppercase"
          style={{
            background: 'rgba(184,69,255,0.12)',
            border: '1px solid rgba(184,69,255,0.35)',
            color: '#B845FF',
          }}
        >
          <span className="w-2 h-2 rounded-full bg-[#B845FF] animate-pulse" />
          Coming Soon
        </div>

        <h2 className="text-[clamp(2rem,4.5vw,3.6rem)] font-black leading-tight tracking-tight mb-4">
          <span className="grad-text">Tournaments</span>
        </h2>
        <p className="text-[clamp(0.9rem,1.5vw,1.1rem)] text-white/45 max-w-[520px] mx-auto leading-relaxed">
          Compete against 2–5 Bitcoin learners in bracket-style battles.
          Stack knowledge, stack sats, claim the throne.
        </p>

        {/* Discord join notice */}
        <a
          href="https://discord.gg/satquest"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 mt-6 px-5 py-2.5 rounded-full font-bold text-[0.88rem] no-underline transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(88,101,242,0.4)]"
          style={{
            background: 'rgba(88,101,242,0.15)',
            border: '1.5px solid rgba(88,101,242,0.4)',
            color: '#7289DA',
          }}
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.003.022.015.043.03.056A19.9 19.9 0 0 0 5.83 20.99a.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.034.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
          </svg>
          Join our Discord to get early access
        </a>
      </div>

      {/* ── Tournament type cards ── */}
      <div className="z-10 flex flex-wrap gap-6 justify-center">
        {TOURNAMENT_TYPES.map((t) => (
          <TournamentCard key={t.id} t={t} />
        ))}
      </div>

      {/* ── Bracket visual ── */}
      <div className="z-10 flex flex-col items-center gap-4">
        <div className="text-[0.72rem] font-black tracking-widest text-white/25 uppercase">
          Example bracket — 4 players
        </div>
        <div
          className="rounded-2xl px-8 py-6"
          style={{
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <BracketVisual />
        </div>
        <p className="text-[0.72rem] text-white/25 text-center max-w-[300px]">
          Brackets support 2 to 5 participants. All fights happen through SatQuest quizzes.
        </p>
      </div>
    </section>
  );
}
