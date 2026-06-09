import { useState, useEffect } from 'react';
import { avatarIdToSrc } from '../utils/avatar';

const API_BASE = import.meta.env.VITE_API_BASE ?? '/api';

function RankBadge({ rank }) {
  const base = 'w-[30px] h-[30px] rounded-full inline-flex items-center justify-center text-[0.78rem] font-black';
  if (rank === 1) return <span className={`${base} bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#1a0a00]`}>🥇</span>;
  if (rank === 2) return <span className={`${base} bg-gradient-to-br from-[#C0C0C0] to-[#A0A0A0] text-[#1a1a1a]`}>🥈</span>;
  if (rank === 3) return <span className={`${base} bg-gradient-to-br from-[#CD7F32] to-[#8B4513] text-white`}>🥉</span>;
  return <span className={`${base} bg-[rgba(184,69,255,0.15)] text-[#B095E8]`}>#{rank}</span>;
}

function SkeletonRows() {
  return (
    <div className="p-8 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="skeleton h-12 rounded-lg" />
      ))}
    </div>
  );
}

export default function Leaderboard() {
  const [rows, setRows]   = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/leaderboard?limit=10`)
      .then((res) => { if (!res.ok) throw new Error(res.status); return res.json(); })
      .then(setRows)
      .catch(() => setError(true));
  }, []);

  return (
    <section id="leaderboard" className="py-24 px-[5%] relative overflow-hidden">
      {/* Blob */}
      <div className="pointer-events-none absolute -top-20 -left-[60px] w-[400px] h-[400px] rounded-full blur-[80px] opacity-30 bg-[radial-gradient(circle,rgba(255,149,0,0.20),transparent_70%)]" />

      <span className="block text-[0.8rem] font-extrabold tracking-[2px] uppercase text-[#FF9500] mb-3" style={{ animation: 'fadein 0.45s ease both', animationDelay: '0.1s' }}>
        Live Rankings
      </span>
      <h2
        className="text-[clamp(1.8rem,3.5vw,2.8rem)] font-black leading-[1.15] tracking-[-0.5px] mb-4"
        style={{ animation: 'fadein 0.45s ease both', animationDelay: '0.2s' }}
      >
        🏆 Global <span className="grad-text">Leaderboard</span>
      </h2>
      <p
        className="text-[#B095E8] text-[1.05rem] max-w-[560px] mb-12"
        style={{ animation: 'fadein 0.45s ease both', animationDelay: '0.3s' }}
      >
        Top players ranked by lifetime sats earned. Speed is the tiebreaker — fastest total time wins.
      </p>

      {/* Table card */}
      <div
        className="bg-[rgba(184,69,255,0.08)] border border-white/10 rounded-[28px] overflow-hidden backdrop-blur-[10px]"
        style={{ animation: 'fadein 0.45s ease both', animationDelay: '0.4s' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 bg-[rgba(184,69,255,0.08)] border-b border-white/10">
          <span className="font-extrabold flex items-center gap-2 text-[#FFF7FF]">🏆 Top Players</span>
          <span className="flex items-center gap-1.5 bg-[rgba(0,255,179,0.15)] border border-[rgba(0,255,179,0.3)] text-[#00FFB3] text-[0.72rem] font-extrabold px-2.5 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 bg-[#00FFB3] rounded-full animate-pulse-dot" />
            Live
          </span>
        </div>

        {/* States */}
        {!rows && !error && <SkeletonRows />}

        {error && (
          <div className="p-12 text-center text-[#7A5DC9]">
            <div className="text-3xl mb-3">📡</div>
            <div className="font-bold mb-1 text-[#FFF7FF]">Could not reach the API</div>
            <div className="text-[0.82rem]">
              Make sure the backend is running at{' '}
              <code className="text-[#B845FF]">{API_BASE}</code>
            </div>
          </div>
        )}

        {rows && rows.length === 0 && (
          <div className="p-12 text-center text-[#7A5DC9]">
            No players yet — be the first to play! 🏆
          </div>
        )}

        {rows && rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['#', 'Player', '⚡ Sats', 'Levels', 'Best Time'].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3.5 text-left text-[0.78rem] font-extrabold text-[#7A5DC9] uppercase tracking-[1px] border-b border-white/10"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const src = avatarIdToSrc(r.avatarId);
                  const ms = r.bestTotalTimeMs || 0;
                  const timeStr = ms > 0 ? `${(ms / 1000).toFixed(1)}s` : '—';

                  return (
                    <tr
                      key={r.rank}
                      className="border-b border-white/[0.04] last:border-0 transition-colors duration-200 hover:bg-[rgba(184,69,255,0.06)]"
                    >
                      <td className="px-6 py-3.5">
                        <RankBadge rank={r.rank} />
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-[34px] h-[34px] rounded-full overflow-hidden bg-[rgba(184,69,255,0.15)] flex-shrink-0 border-[1.5px] border-[rgba(184,69,255,0.3)]">
                            {src
                              ? <img src={src} alt={r.username} loading="lazy" className="w-full h-full object-cover object-top" />
                              : <div className="w-full h-full flex items-center justify-center">👤</div>}
                          </div>
                          <span className="font-semibold text-[#FFF7FF]">@{r.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 text-[#FFE600] font-extrabold">
                        ⚡ {(r.sats ?? 0).toLocaleString()}
                      </td>
                      <td className="px-6 py-3.5 text-[#00E5FF] font-bold">
                        {r.levelsCompleted ?? 0} / 26
                      </td>
                      <td className="px-6 py-3.5 text-[#B095E8] text-[0.88rem]">{timeStr}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
