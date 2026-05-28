import { useState, useEffect } from 'react';
import { avatarIdToSrc } from '../utils/avatar';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000/api';

const STATIC_FEEDBACK = [
  { username: 'nakamoto_fan', rating: 5, message: 'Finally a game that teaches Bitcoin properly. The lightning challenges are insane — completed 3 levels in one sitting!', avatarId: 'avM7', category: 'gameplay', createdAt: '2026-05-20T10:00:00Z' },
  { username: 'sats_stacker', rating: 5, message: 'Love how each question ties back to real Bitcoin concepts. My knowledge of the mempool has never been better.', avatarId: 'avF3', category: 'learning', createdAt: '2026-05-18T09:00:00Z' },
  { username: 'hodl_queen', rating: 4, message: 'The leaderboard keeps me motivated. Competing with friends while learning Bitcoin is genuinely addictive.', avatarId: 'avF11', category: 'social', createdAt: '2026-05-15T14:00:00Z' },
  { username: 'block_explorer', rating: 5, message: 'Went from knowing nothing about UTXOs to confidently explaining them at a meetup. This game works!', avatarId: 'avM2', category: 'learning', createdAt: '2026-05-10T08:00:00Z' },
  { username: 'lightning_rod', rating: 5, message: 'The UI is beautiful and the questions are tough in the best way. Keep shipping!', avatarId: 'avM14', category: 'design', createdAt: '2026-05-05T16:00:00Z' },
  { username: 'satoshi_student', rating: 4, message: 'Been recommending this to everyone in my Bitcoin study group. The progression feels just right.', avatarId: 'avF8', category: 'social', createdAt: '2026-04-28T11:00:00Z' },
];

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1)  return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7)  return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function Stars({ rating }) {
  if (!rating) return null;
  return (
    <div className="text-[#FFE600] text-[0.9rem] tracking-[1px] mb-3">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-[rgba(184,69,255,0.08)] border border-white/10 rounded-[22px] p-6 space-y-3">
      <div className="skeleton h-4 w-20" />
      <div className="skeleton h-3.5 w-full" />
      <div className="skeleton h-3.5 w-[85%]" />
      <div className="skeleton h-3.5 w-[60%]" />
      <div className="flex items-center gap-3 pt-2">
        <div className="skeleton w-9 h-9 rounded-full flex-shrink-0" />
        <div className="skeleton h-3.5 w-20" />
      </div>
    </div>
  );
}

export default function Feedback() {
  const [items, setItems] = useState(STATIC_FEEDBACK);

  useEffect(() => {
    fetch(`${API_BASE}/feedback`)
      .then((res) => { if (!res.ok) throw new Error(res.status); return res.json(); })
      .then((live) => { if (live && live.length > 0) setItems(live); })
      .catch(() => {/* keep static fallback */});
  }, []);

  const shown = items.slice(0, 9);

  return (
    <section
      id="feedback"
      className="py-24 px-[5%] relative"
      style={{
        background:
          'linear-gradient(180deg, transparent, rgba(0,229,255,0.03) 50%, transparent)',
      }}
    >
      {/* Blob */}
      <div className="pointer-events-none absolute -bottom-[60px] -right-[60px] w-[350px] h-[350px] rounded-full blur-[80px] opacity-40 bg-[radial-gradient(circle,rgba(0,229,255,0.15),transparent_70%)]" />

      {/* Heading */}
      <div className="text-center mb-12">
        <span className="block text-[0.8rem] font-extrabold tracking-[2px] uppercase text-[#FF9500] mb-3" style={{ animation: 'fadein 0.45s ease both', animationDelay: '0.1s' }}>
          Community
        </span>
        <h2
          className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-black leading-[1.15] tracking-[-0.5px] mb-4"
          style={{ animation: 'fadein 0.45s ease both', animationDelay: '0.2s' }}
        >
          What Players <span className="grad-text">Say</span>
        </h2>
        <p
          className="text-[#B095E8] text-[1.05rem] max-w-[560px] mx-auto"
          style={{ animation: 'fadein 0.45s ease both', animationDelay: '0.3s' }}
        >
          Real feedback from real players. Straight from the game.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">

        {shown &&
          shown.map((fb, i) => {
            const src = avatarIdToSrc(fb.avatarId);
            return (
              <div
                key={i}
                className="relative bg-[rgba(184,69,255,0.08)] border border-white/10 rounded-[22px] p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_16px_40px_rgba(0,229,255,0.1)] hover:border-[rgba(0,229,255,0.25)]"
                style={{ animation: 'fadein 0.45s ease both', animationDelay: `${0.3 + i * 0.08}s` }}
              >
                {/* Decorative quote mark */}
                <div className="pointer-events-none absolute top-4 right-5 text-[2.5rem] leading-none text-[#B845FF] opacity-50 font-serif select-none">
                  "
                </div>

                <Stars rating={fb.rating} />

                <p className="text-[0.93rem] text-[#B095E8] leading-[1.6] mb-5">
                  {fb.message}
                </p>

                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full overflow-hidden bg-[rgba(184,69,255,0.15)] flex-shrink-0 border-[1.5px] border-[rgba(184,69,255,0.3)]">
                    {src
                      ? <img src={src} alt={fb.username} loading="lazy" className="w-full h-full object-cover object-top" />
                      : <div className="w-full h-full flex items-center justify-center text-lg">👤</div>}
                  </div>
                  <div>
                    <div className="font-extrabold text-[0.88rem] text-[#FFF7FF]">@{fb.username}</div>
                    <div className="text-[0.75rem] text-[#7A5DC9]">{timeAgo(fb.createdAt)}</div>
                  </div>
                  {fb.category && (
                    <span className="ml-auto text-[0.7rem] font-bold px-2 py-0.5 rounded-full bg-[rgba(184,69,255,0.15)] text-[#B845FF] border border-[rgba(184,69,255,0.25)]">
                      {fb.category}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </section>
  );
}
