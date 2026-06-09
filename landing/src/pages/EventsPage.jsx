import { useState, useEffect } from 'react';

function useWidth() {
  const [w, setW] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return w;
}
import { Link } from 'react-router-dom';

/* ─── Real Bitcoin open-source projects (github.com/topics/bitcoin) ─── */
const PROJECTS = [
  {
    id: 1,
    name: 'Bitcoin Core',
    repo: 'bitcoin/bitcoin',
    url: 'https://github.com/bitcoin/bitcoin',
    desc: 'The reference implementation of Bitcoin — security software protecting billions in assets, maintained by contributors worldwide.',
    lang: 'C++',
    langColor: '#f34b7d',
    stars: '82k',
    tags: ['p2p', 'cryptography', 'full-node'],
    updated: '27 min ago',
  },
  {
    id: 2,
    name: 'LND – Lightning Daemon',
    repo: 'lightningnetwork/lnd',
    url: 'https://github.com/lightningnetwork/lnd',
    desc: 'Complete Lightning Network node implementation enabling instant, near-zero-fee Bitcoin micropayments via payment channels.',
    lang: 'Go',
    langColor: '#00ADD8',
    stars: '7.9k',
    tags: ['lightning', 'payments', 'micropayments'],
    updated: 'yesterday',
  },
  {
    id: 3,
    name: 'Electrum',
    repo: 'spesmilo/electrum',
    url: 'https://github.com/spesmilo/electrum',
    desc: 'Lightweight Bitcoin wallet with hardware wallet support and built-in Lightning Network integration. Fast, secure, no blockchain download.',
    lang: 'Python',
    langColor: '#3572A5',
    stars: '7.5k',
    tags: ['wallet', 'lightning-network', 'bitcoin-wallet'],
    updated: '10 hours ago',
  },
  {
    id: 4,
    name: 'BTCPay Server',
    repo: 'btcpayserver/btcpayserver',
    url: 'https://github.com/btcpayserver/btcpayserver',
    desc: 'Free, open-source, self-hosted Bitcoin payment processor. Accept Bitcoin payments with no fees, no KYC, no third parties.',
    lang: 'C#',
    langColor: '#178600',
    stars: '7.2k',
    tags: ['payment-gateway', 'self-hosted', 'crowdfunding'],
    updated: '7 hours ago',
  },
  {
    id: 5,
    name: 'Umbrel',
    repo: 'getumbrel/umbrel',
    url: 'https://github.com/getumbrel/umbrel',
    desc: 'Elegant home server OS. Run a Bitcoin full node, self-host 300+ apps, and take control of your data on a Raspberry Pi.',
    lang: 'TypeScript',
    langColor: '#3178c6',
    stars: '6.9k',
    tags: ['self-hosted', 'raspberry-pi', 'homeserver'],
    updated: '2 weeks ago',
  },
  {
    id: 6,
    name: 'btcd',
    repo: 'btcsuite/btcd',
    url: 'https://github.com/btcsuite/btcd',
    desc: 'An alternative full node Bitcoin implementation written in Go — used as the foundation for many Bitcoin wallets and tools.',
    lang: 'Go',
    langColor: '#00ADD8',
    stars: '6.2k',
    tags: ['full-node', 'btcd', 'golang'],
    updated: '2 weeks ago',
  },
  {
    id: 7,
    name: 'Mastering Bitcoin',
    repo: 'bitcoinbook/bitcoinbook',
    url: 'https://github.com/bitcoinbook/bitcoinbook',
    desc: 'Mastering Bitcoin 3rd Edition by Andreas M. Antonopoulos — the definitive technical guide to programming the open blockchain. Free to read.',
    lang: 'HTML',
    langColor: '#e34c26',
    stars: '23k',
    tags: ['book', 'education', 'open-blockchain'],
    updated: 'Dec 2024',
  },
];

/* ─── Events (BitDevs + SatQuest) ─────────────────────── */
const EVENTS = [
  {
    id: 1,
    day: '07',
    month: 'JUN',
    title: 'Bitcoin 101 Live Session',
    type: 'Workshop',
    typeColor: '#a78bfa',
    host: 'SatQuest',
    desc: 'Beginner-friendly live session covering Bitcoin fundamentals — wallets, keys, transactions, and how to get started safely.',
    link: 'https://discord.gg/Ttwg2yrzYC',
    external: true,
    discord: true,
  },
  {
    id: 2,
    day: '14',
    month: 'JUN',
    title: 'Lightning Network Deep Dive',
    type: 'Workshop',
    typeColor: '#a78bfa',
    host: 'SatQuest',
    desc: 'Technical deep dive into the Lightning Network — payment channels, routing algorithms, and running your own LND node.',
    link: 'https://discord.gg/Ttwg2yrzYC',
    external: true,
    discord: true,
  },
  {
    id: 3,
    day: '18',
    month: 'JUN',
    title: 'BitDevs NYC Socratic Seminar 159',
    type: 'Seminar',
    typeColor: '#34d399',
    host: 'BitDevs NYC',
    desc: 'Monthly Socratic Seminar discussing the latest Bitcoin protocol research, BIPs, and development updates from the global Bitcoin dev community.',
    link: 'https://bitdevs.org/2026-06-18-socratic-seminar-159',
    external: true,
    discord: false,
  },
  {
    id: 4,
    day: '21',
    month: 'JUN',
    title: 'Community Q&A',
    type: 'Community',
    typeColor: '#f59e0b',
    host: 'SatQuest',
    desc: 'Open floor Q&A session — ask anything about Bitcoin, the quiz platform, upcoming tournaments, or the SatQuest roadmap.',
    link: 'https://discord.gg/Ttwg2yrzYC',
    external: true,
    discord: true,
  },
  {
    id: 5,
    day: '05',
    month: 'JUL',
    title: 'Tournament Alpha Round',
    type: 'Tournament',
    typeColor: '#f472b6',
    host: 'SatQuest',
    desc: 'The first public SatQuest quiz tournament. Compete in teams of 2-5 across Bitcoin knowledge categories and win BTC prizes.',
    link: '/tournament',
    external: false,
    discord: false,
  },
  {
    id: 6,
    day: '19',
    month: 'JUL',
    title: 'Open Source Sprint',
    type: 'Dev',
    typeColor: '#60a5fa',
    host: 'SatQuest',
    desc: 'A focused hackathon sprint contributing to Bitcoin open-source projects. Guided sessions, code review mentors, and prizes for merged PRs.',
    link: 'https://discord.gg/Ttwg2yrzYC',
    external: true,
    discord: true,
  },
];

/* ─── Project card ────────────────────────────────────── */
function ProjectCard({ project }) {
  return (
    <a href={project.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 14,
          padding: '16px 18px',
          marginBottom: 10,
          transition: 'background 0.2s, border-color 0.2s, transform 0.2s',
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(184,69,255,0.07)';
          e.currentTarget.style.borderColor = 'rgba(184,69,255,0.3)';
          e.currentTarget.style.transform = 'translateX(5px)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)';
          e.currentTarget.style.transform = 'translateX(0)';
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 7 }}>
          <div>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.92rem' }}>{project.name}</span>
            <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.68rem', fontFamily: 'monospace', marginTop: 2 }}>
              {project.repo}
            </div>
          </div>
          <span style={{
            background: 'rgba(255,255,255,0.06)',
            borderRadius: 6,
            padding: '2px 8px',
            fontSize: '0.7rem',
            color: 'rgba(255,255,255,0.45)',
            marginLeft: 8,
            whiteSpace: 'nowrap',
          }}>
            ★ {project.stars}
          </span>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.77rem', lineHeight: 1.55, margin: '0 0 10px' }}>
          {project.desc}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginRight: 2 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: project.langColor, display: 'inline-block', flexShrink: 0 }} />
            {project.lang}
          </span>
          {project.tags.map(t => (
            <span key={t} style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 20,
              padding: '1px 8px',
              fontSize: '0.66rem',
              color: 'rgba(255,255,255,0.38)',
            }}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </a>
  );
}

/* ─── Event row ───────────────────────────────────────── */
function EventRow({ event, isActive, onClick }) {
  const btnBase = {
    display: 'inline-block',
    borderRadius: 8,
    padding: '4px 13px',
    fontSize: '0.72rem',
    fontWeight: 600,
    textDecoration: 'none',
    cursor: 'pointer',
  };

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        gap: 13,
        padding: '13px 14px',
        borderRadius: 12,
        marginBottom: 8,
        cursor: 'pointer',
        background: isActive ? 'rgba(184,69,255,0.1)' : 'rgba(255,255,255,0.02)',
        border: isActive ? '1px solid rgba(184,69,255,0.28)' : '1px solid rgba(255,255,255,0.055)',
        transition: 'all 0.2s ease',
      }}
    >
      {/* Date block */}
      <div style={{
        minWidth: 42,
        textAlign: 'center',
        background: isActive ? 'rgba(184,69,255,0.18)' : 'rgba(255,255,255,0.04)',
        borderRadius: 8,
        padding: '6px 4px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: '1.05rem', fontWeight: 800, color: isActive ? '#d880ff' : '#fff', lineHeight: 1 }}>
          {event.day}
        </span>
        <span style={{ fontSize: '0.58rem', fontWeight: 700, color: 'rgba(255,255,255,0.38)', letterSpacing: 1, marginTop: 2 }}>
          {event.month}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
          <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.85rem' }}>{event.title}</span>
          <span style={{
            background: event.typeColor + '1a',
            border: '1px solid ' + event.typeColor + '44',
            color: event.typeColor,
            borderRadius: 20,
            padding: '1px 7px',
            fontSize: '0.62rem',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}>
            {event.type}
          </span>
        </div>

        <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.71rem', marginBottom: isActive ? 8 : 0 }}>
          Hosted by {event.host}
        </div>

        {isActive && (
          <>
            <p style={{ color: 'rgba(255,255,255,0.62)', fontSize: '0.76rem', lineHeight: 1.55, margin: '0 0 10px' }}>
              {event.desc}
            </p>
            {!event.external ? (
              <Link
                to={event.link}
                onClick={e => e.stopPropagation()}
                style={{ ...btnBase, background: 'rgba(244,114,182,0.16)', border: '1px solid rgba(244,114,182,0.38)', color: '#f472b6' }}
              >
                View Tournament →
              </Link>
            ) : event.discord ? (
              <a
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{ ...btnBase, background: 'rgba(88,101,242,0.16)', border: '1px solid rgba(88,101,242,0.38)', color: '#7289da' }}
              >
                Join on Discord →
              </a>
            ) : (
              <a
                href={event.link}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{ ...btnBase, background: 'rgba(184,69,255,0.16)', border: '1px solid rgba(184,69,255,0.38)', color: '#d880ff' }}
              >
                View Event →
              </a>
            )}
          </>
        )}
      </div>

      {/* Chevron */}
      <div style={{
        color: 'rgba(255,255,255,0.25)',
        fontSize: '0.75rem',
        alignSelf: 'flex-start',
        paddingTop: 3,
        transition: 'transform 0.2s',
        transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)',
        flexShrink: 0,
      }}>
        ▾
      </div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────── */
export default function EventsPage() {
  const [activeEvent, setActiveEvent] = useState(0);
  const w = useWidth();
  const isMobile = w < 768;
  const isTablet = w >= 768 && w < 1024;

  return (
    <div style={{
      minHeight: '100vh',
      height: isMobile ? 'auto' : '100vh',
      background: 'linear-gradient(145deg, #07001e 0%, #0e0032 60%, #110010 100%)',
      display: 'flex',
      flexDirection: 'column',
      overflow: isMobile ? 'auto' : 'hidden',
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>

      {/* Top bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 8,
        padding: isMobile ? '12px 16px' : '14px 28px',
        borderBottom: '1px solid rgba(255,255,255,0.055)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link
            to="/"
            style={{ color: 'rgba(255,255,255,0.38)', textDecoration: 'none', fontSize: '0.78rem' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.38)')}
          >
            ← SatQuest
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.12)', fontSize: '0.78rem' }}>/</span>
          <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>Events</span>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{
            background: 'rgba(52,211,153,0.1)',
            border: '1px solid rgba(52,211,153,0.28)',
            color: '#34d399',
            borderRadius: 20,
            padding: '3px 10px',
            fontSize: '0.68rem',
            fontWeight: 700,
          }}>
            ● {EVENTS.length} upcoming
          </span>
          <a
            href="https://discord.gg/Ttwg2yrzYC"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: 'rgba(114,137,218,0.12)',
              border: '1px solid rgba(114,137,218,0.28)',
              color: '#7289da',
              borderRadius: 8,
              padding: '5px 14px',
              fontSize: '0.73rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Join Discord
          </a>
        </div>
      </div>

      {/* Two-column body */}
      <div style={{
        display: 'flex',
        flex: isMobile ? 'none' : 1,
        flexDirection: isMobile ? 'column' : 'row',
        overflow: isMobile ? 'visible' : 'hidden',
      }}>

        {/* Left — Open Source Projects */}
        <div style={{
          width: isMobile ? '100%' : isTablet ? '52%' : '58%',
          borderRight: isMobile ? 'none' : '1px solid rgba(255,255,255,0.055)',
          borderBottom: isMobile ? '1px solid rgba(255,255,255,0.055)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          overflow: isMobile ? 'visible' : 'hidden',
        }}>
          <div style={{ padding: isMobile ? '18px 16px 10px' : '22px 28px 12px', flexShrink: 0 }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: 2.5, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', marginBottom: 4 }}>
              Bitcoin Ecosystem
            </div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.2rem', letterSpacing: -0.3 }}>
              Open Source Projects
            </div>
            <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.76rem', marginTop: 5 }}>
              Real projects from GitHub — explore, contribute, and build on Bitcoin.
            </div>
          </div>

          <div style={{
            flex: isMobile ? 'none' : 1,
            overflowY: isMobile ? 'visible' : 'auto',
            padding: isMobile ? '4px 16px 24px' : '4px 28px 28px',
          }}>
            {PROJECTS.map(p => <ProjectCard key={p.id} project={p} />)}
          </div>
        </div>

        {/* Right — Upcoming Events */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: isMobile ? 'visible' : 'hidden',
        }}>
          <div style={{ padding: isMobile ? '18px 16px 10px' : '22px 22px 12px', flexShrink: 0 }}>
            <div style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: 2.5, color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase', marginBottom: 4 }}>
              2026
            </div>
            <div style={{ color: '#fff', fontWeight: 800, fontSize: '1.2rem', letterSpacing: -0.3 }}>
              Upcoming Events
            </div>
            <div style={{ color: 'rgba(255,255,255,0.38)', fontSize: '0.76rem', marginTop: 5 }}>
              Click any event to expand details.
            </div>
          </div>

          <div style={{
            flex: isMobile ? 'none' : 1,
            overflowY: isMobile ? 'visible' : 'auto',
            padding: isMobile ? '4px 16px 16px' : '4px 22px 16px',
          }}>
            {EVENTS.map((ev, i) => (
              <EventRow
                key={ev.id}
                event={ev}
                isActive={activeEvent === i}
                onClick={() => setActiveEvent(activeEvent === i ? null : i)}
              />
            ))}
          </div>

          <div style={{
            padding: isMobile ? '10px 16px' : '10px 22px',
            borderTop: '1px solid rgba(255,255,255,0.055)',
            display: 'flex',
            gap: 16,
            alignItems: 'center',
            flexShrink: 0,
          }}>
            <Link to="/terms"   style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', textDecoration: 'none' }}>Terms</Link>
            <Link to="/privacy" style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.7rem', textDecoration: 'none' }}>Privacy</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
