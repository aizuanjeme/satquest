import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { avatarSrc } from './utils/avatar';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Stats from './components/Stats';
import HowItWorks from './components/HowItWorks';
import Leaderboard from './components/Leaderboard';
import Community from './components/Community';
import Blog from './components/Blog';
import Feedback from './components/Feedback';
import OpenSource from './components/OpenSource';
import Footer from './components/Footer';
import PageNav from './components/PageNav';
import VideoPreview from './components/VideoPreview';
import { useScrollReveal } from './hooks/useScrollReveal';
import TournamentPage from './pages/TournamentPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import EventsPage from './pages/EventsPage';

/* ─── Mascot character shown on the side of each page ── */
// Each snap-page reserves 148px on the mascot side (xl+) so content never overlaps.
function Mascot({ gender, n, message, side = 'right', glow = 'rgba(184,69,255,0.6)' }) {
  const isRight = side === 'right';
  return (
    <div
      aria-hidden
      className={`pointer-events-none hidden xl:flex flex-col items-center justify-center gap-3
        absolute top-0 bottom-0 z-30 w-[148px]
        ${isRight ? 'right-0' : 'left-0'}`}
    >
      {/* Avatar comes first for left-side mascot */}
      {!isRight && (
        <img
          src={avatarSrc(gender, n)}
          alt=""
          className="w-[88px] h-[88px] object-contain animate-float1"
          style={{ filter: `drop-shadow(0 0 22px ${glow})` }}
        />
      )}
      {/* Speech bubble */}
      <div
        className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-3 py-2 max-w-[130px] text-center text-[0.72rem] font-extrabold text-[#FFF7FF] leading-snug shadow-xl"
        style={{ borderColor: glow.replace(/[\d.]+\)$/, '0.35)') }}
      >
        {message}
      </div>
      {/* Avatar comes last for right-side mascot */}
      {isRight && (
        <img
          src={avatarSrc(gender, n)}
          alt=""
          className="w-[88px] h-[88px] object-contain animate-float2"
          style={{ filter: `drop-shadow(0 0 22px ${glow})` }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/tournament" element={<TournamentPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/events" element={<EventsPage />} />
      <Route path="/*" element={<Landing />} />
    </Routes>
  );
}

function Landing() {
  useScrollReveal();

  useEffect(() => {
    const handleAnchorClick = (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (el) {
        e.preventDefault();
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    document.addEventListener('click', handleAnchorClick);
    return () => document.removeEventListener('click', handleAnchorClick);
  }, []);

  return (
    <>
      <Nav />
      <PageNav />
      <div className="snap-container">

        {/* ── Page 1 · Hero + Stats ──────────────────────── */}
        {/* Design: deep purple — hero already paints its own blobs */}
        <div className="snap-page relative" style={{ background: '#0b0030' }}>
          <Hero />
          <Stats />
        </div>

        {/* ── Page 2 · How it Works ─────────────────────── */}
        {/* Design: amber/orange warmth · dot-grid pattern */}
        <div
          className="snap-page relative overflow-hidden xl:pr-[148px]"
          style={{ background: 'linear-gradient(145deg, #0f0022 0%, #1c0800 55%, #0c0018 100%)' }}
        >
          {/* Dot grid */}
          <div className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,149,0,0.28) 1px, transparent 1px)', backgroundSize: '28px 28px', opacity: 0.65 }} />
          {/* Corner glow */}
          <div className="pointer-events-none absolute -bottom-20 -left-20 w-[360px] h-[360px] rounded-full blur-[90px] opacity-25"
            style={{ background: 'radial-gradient(circle, rgba(255,149,0,0.4), transparent 70%)' }} />
          <Mascot
            gender="male" n={7}
            message="Let me walk you through it! 🎯"
            side="right"
            glow="rgba(255,149,0,0.65)"
          />
          <HowItWorks />
        </div>

        {/* ── Page 3 · Video Preview ─────────────────────── */}
        {/* Design: deep purple/violet · soft glow */}
        <div
          className="snap-page relative overflow-hidden"
          style={{ background: 'linear-gradient(145deg, #0d0022 0%, #180030 55%, #0a0018 100%)' }}
        >
          {/* Soft mesh dots */}
          <div className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(184,69,255,0.20) 1px, transparent 1px)', backgroundSize: '32px 32px', opacity: 0.6 }} />
          {/* Purple radial glow */}
          <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full blur-[100px] opacity-20"
            style={{ background: 'radial-gradient(ellipse, rgba(184,69,255,0.6), transparent 70%)' }} />
          <VideoPreview />
        </div>

        {/* ── Page 4 · Leaderboard ──────────────────────── */}
        {/* Design: deep navy/gold · grid-lines pattern */}
        <div
          className="snap-page relative overflow-hidden xl:pl-[148px]"
          style={{ background: 'linear-gradient(145deg, #000c1e 0%, #0c0900 55%, #050018 100%)' }}
        >
          {/* Grid lines */}
          <div className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: 'linear-gradient(rgba(255,215,0,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,215,0,0.18) 1px, transparent 1px)', backgroundSize: '44px 44px', opacity: 0.65 }} />
          <div className="pointer-events-none absolute -top-20 right-0 w-[400px] h-[400px] rounded-full blur-[100px] opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(255,215,0,0.5), transparent 70%)' }} />
          <Mascot
            gender="female" n={5}
            message="Stack sats and climb the ranks! 🏆"
            side="left"
            glow="rgba(255,215,0,0.65)"
          />
          <Leaderboard />
        </div>

        {/* ── Page 4 · Community ────────────────────────── */}
        {/* Design: deep teal/ocean · scatter-dot pattern */}
        <div
          className="snap-page relative overflow-hidden xl:pr-[148px]"
          style={{ background: 'linear-gradient(145deg, #001018 0%, #000d28 55%, #001a10 100%)' }}
        >
          {/* Scatter dots */}
          <div className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(0,229,255,0.30) 1px, transparent 1px)', backgroundSize: '36px 36px', opacity: 0.65 }} />
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[260px] rounded-full blur-[80px] opacity-15"
            style={{ background: 'radial-gradient(ellipse, rgba(0,229,255,0.5), transparent 70%)' }} />
          <Mascot
            gender="male" n={12}
            message="We build Bitcoin together! 🌍"
            side="right"
            glow="rgba(0,229,255,0.6)"
          />
          <Community />
        </div>

        {/* ── Page 5 · Blog ─────────────────────────────── */}
        {/* Design: deep indigo/notebook · horizontal rule pattern */}
        <div
          className="snap-page relative overflow-hidden xl:pl-[148px]"
          style={{ background: 'linear-gradient(145deg, #07001e 0%, #0e0032 55%, #110010 100%)' }}
        >
          {/* Notebook lines */}
          <div className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 31px, rgba(184,69,255,0.20) 31px, rgba(184,69,255,0.20) 32px)', opacity: 0.9 }} />
          <div className="pointer-events-none absolute -bottom-20 right-0 w-[400px] h-[400px] rounded-full blur-[90px] opacity-20"
            style={{ background: 'radial-gradient(circle, rgba(184,69,255,0.5), transparent 70%)' }} />
          <Mascot
            gender="female" n={9}
            message="Fresh Bitcoin reads! 📖"
            side="left"
            glow="rgba(184,69,255,0.65)"
          />
          <Blog />
        </div>

        {/* ── Page 6 · Feedback ─────────────────────────── */}
        {/* Design: deep rose/magenta · diamond-dot pattern */}
        <div
          className="snap-page relative overflow-hidden xl:pr-[148px]"
          style={{ background: 'linear-gradient(145deg, #0f000e 0%, #1c0007 55%, #100015 100%)' }}
        >
          {/* Diamond dots */}
          <div className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,45,146,0.30) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.65 }} />
          <div className="pointer-events-none absolute top-1/2 -translate-y-1/2 -left-20 w-[380px] h-[380px] rounded-full blur-[90px] opacity-15"
            style={{ background: 'radial-gradient(circle, rgba(255,45,146,0.5), transparent 70%)' }} />
          <Mascot
            gender="male" n={3}
            message="Your feedback shapes SatQuest! 💬"
            side="right"
            glow="rgba(255,45,146,0.6)"
          />
          <Feedback />
        </div>

        {/* ── Page 7 · Open Source + Footer ─────────────── */}
        {/* Design: deep forest/green · circuit-grid pattern */}
        <div
          className="snap-page relative overflow-hidden xl:pl-[148px]"
          style={{ background: 'linear-gradient(145deg, #000f08 0%, #04001a 55%, #000b00 100%)' }}
        >
          {/* Circuit grid */}
          <div className="pointer-events-none absolute inset-0"
            style={{ backgroundImage: 'linear-gradient(rgba(0,255,179,0.16) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,179,0.16) 1px, transparent 1px)', backgroundSize: '64px 64px', opacity: 0.75 }} />
          <div className="pointer-events-none absolute -top-20 left-1/4 w-[420px] h-[300px] rounded-full blur-[80px] opacity-12"
            style={{ background: 'radial-gradient(ellipse, rgba(0,255,179,0.4), transparent 70%)' }} />
          <Mascot
            gender="female" n={14}
            message="Fork it. Build on it! 🚀"
            side="left"
            glow="rgba(0,255,179,0.6)"
          />
          <OpenSource />
          <Footer />
        </div>

      </div>
    </>
  );
}



