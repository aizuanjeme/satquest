const ORGS = [
  {
    name: 'BTrust',
    url: 'https://btrust.tech',
    logo: '/logos/btrust.png',
    color: 'rgba(255,149,0,0.4)',
    border: 'rgba(255,149,0,0.3)',
    tag: 'Grants · Africa',
    desc:
      'Funding African Bitcoin developers through grants, education, and mentorship. Building the next generation of builders on the continent.',
  },
  {
    name: 'Dada Bitcoin',
    url: 'https://dadabitcoin.com',
    initials: 'DB',
    color: 'rgba(255,45,146,0.4)',
    border: 'rgba(255,45,146,0.3)',
    tag: 'Women · Africa',
    desc:
      "A community championing women's participation in Bitcoin across Africa — education, meetups, and financial sovereignty for every woman.",
  },
  {
    name: 'Bitcoin Design',
    url: 'https://bitcoin.design',
    logo: '/logos/bitcoin-design.png',
    color: 'rgba(184,69,255,0.4)',
    border: 'rgba(184,69,255,0.3)',
    tag: 'Open Design',
    desc:
      'An open-source community of designers making Bitcoin products more intuitive and accessible for everyone on the planet.',
  },
  {
    name: 'Summer of Bitcoin',
    url: 'https://www.summerofbitcoin.org',
    logo: '/logos/summer-of-bitcoin.png',
    color: 'rgba(255,230,0,0.4)',
    border: 'rgba(255,230,0,0.3)',
    tag: 'Students · Global',
    desc:
      'A global summer internship programme placing university students into Bitcoin open-source projects to kickstart their careers.',
  },
  {
    name: 'OpenSats',
    url: 'https://opensats.org',
    logo: '/logos/opensats.png',
    color: 'rgba(0,229,255,0.4)',
    border: 'rgba(0,229,255,0.3)',
    tag: 'Grants · Global',
    desc:
      'A non-profit organisation funding Bitcoin and free open-source software maintainers through community donations and grants.',
  },
  {
    name: 'Africa Bitcoin Conf',
    url: 'https://africabitcoinconference.org',
    initials: 'ABC',
    color: 'rgba(0,255,179,0.4)',
    border: 'rgba(0,255,179,0.3)',
    tag: 'Events · Africa',
    desc:
      'The premier Bitcoin-only conference in Africa, bringing together builders, educators, and advocates from across the continent every year.',
  },
];

function LogoBadge({ org }) {
  const bg = org.color.replace('0.4', '0.18');
  if (org.logo) {
    return (
      <div
        className="w-11 h-11 rounded-[14px] overflow-hidden flex-shrink-0 flex items-center justify-center"
        style={{ background: bg }}
      >
        <img
          src={org.logo}
          alt={`${org.name} logo`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }
  // Styled initials fallback
  return (
    <div
      className="w-11 h-11 rounded-[14px] flex-shrink-0 flex items-center justify-center font-black text-[0.75rem] tracking-tight"
      style={{
        background: `linear-gradient(135deg, ${org.color}, ${org.border})`,
        color: '#FFF7FF',
        textShadow: '0 1px 2px rgba(0,0,0,0.4)',
      }}
    >
      {org.initials}
    </div>
  );
}

function OrgCard({ org, delay }) {
  return (
    <a
      href={org.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col gap-3 bg-[rgba(184,69,255,0.07)] border border-white/10 rounded-[22px] p-6 no-underline transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_48px_rgba(184,69,255,0.18)]"
      style={{ animation: 'fadein 0.45s ease both', animationDelay: delay, borderColor: 'rgba(255,255,255,0.1)' }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = org.border)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
    >
      {/* Corner glow */}
      <div
        className="pointer-events-none absolute -top-8 -right-8 w-[100px] h-[100px] rounded-full blur-[30px] opacity-0 group-hover:opacity-50 transition-opacity duration-300"
        style={{ background: org.color }}
      />

      <div className="flex items-center gap-3">
        <LogoBadge org={org} />
        <div>
          <div className="font-extrabold text-[#FFF7FF] text-[1rem] leading-tight">{org.name}</div>
          <div
            className="text-[0.7rem] font-bold uppercase tracking-[1px] mt-0.5"
            style={{ color: org.border.replace('0.3', '0.9') }}
          >
            {org.tag}
          </div>
        </div>
      </div>

      <p className="text-[#B095E8] text-[0.875rem] leading-relaxed m-0">{org.desc}</p>

      <div className="flex items-center gap-1 text-[0.78rem] font-bold text-[#7A5DC9] group-hover:text-[#B845FF] transition-colors mt-auto">
        Visit →
      </div>
    </a>
  );
}

export default function Community() {
  return (
    <section
      id="community"
      className="py-24 px-[5%] relative overflow-hidden flex flex-col justify-center"
    >
      {/* Background blobs */}
      <div className="pointer-events-none absolute -top-[80px] -right-[80px] w-[420px] h-[420px] rounded-full blur-[90px] opacity-25 bg-[radial-gradient(circle,rgba(255,149,0,0.25),transparent_70%)]" />
      <div className="pointer-events-none absolute -bottom-[60px] -left-[60px] w-[380px] h-[380px] rounded-full blur-[80px] opacity-25 bg-[radial-gradient(circle,rgba(184,69,255,0.25),transparent_70%)]" />

      {/* Heading */}
      <div className="text-center mb-12">
        <span className="block text-[0.8rem] font-extrabold tracking-[2px] uppercase text-[#FF9500] mb-3" style={{ animation: 'fadein 0.45s ease both', animationDelay: '0.1s' }}>
          Bitcoin Ecosystem
        </span>
        <h2
          className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-black leading-[1.15] tracking-[-0.5px] mb-4"
          style={{ animation: 'fadein 0.45s ease both', animationDelay: '0.2s' }}
        >
          Built With the <span className="grad-text">Community</span>
        </h2>
        <p
          className="text-[#B095E8] text-[1.05rem] max-w-[580px] mx-auto"
          style={{ animation: 'fadein 0.45s ease both', animationDelay: '0.3s' }}
        >
          SatQuest stands on the shoulders of a vibrant Bitcoin open-source ecosystem.
          These are the organisations building a free and open financial future.
        </p>
      </div>

      {/* Org grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-[1100px] mx-auto w-full">
        {ORGS.map((org, i) => (
          <OrgCard key={org.name} org={org} delay={`${i * 0.08}s`} />
        ))}
      </div>

      {/* Bottom CTA */}
      <p
        className="text-center text-[#7A5DC9] text-[0.85rem] mt-10"
        style={{ animation: 'fadein 0.45s ease both', animationDelay: '0.5s' }}
      >
        Know an org that should be here?{' '}
        <a
          href="https://github.com/aizuanjeme/satquest"
          target="_blank"
          rel="noopener"
          className="text-[#B845FF] hover:text-[#FFF7FF] transition-colors font-bold"
        >
          Open a PR on GitHub →
        </a>
      </p>
    </section>
  );
}
