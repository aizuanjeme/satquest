import { useEffect, useRef } from 'react';

function StatCard({ value, label, colorClass, count, delay = '0s' }) {
  const numRef = useRef(null);

  useEffect(() => {
    if (count === undefined || !numRef.current) return;
    const el = numRef.current;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const duration = 1200;
          const start = performance.now();
          const update = (now) => {
            const progress = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            el.textContent = Math.round(ease * count);
            if (progress < 1) requestAnimationFrame(update);
          };
          requestAnimationFrame(update);
          observer.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [count]);

  return (
    <div
      className="bg-[rgba(184,69,255,0.08)] border border-white/10 rounded-[20px] p-6 text-center backdrop-blur-[10px] transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(184,69,255,0.4)] hover:shadow-[0_12px_40px_rgba(184,69,255,0.15)]"
      style={{ animation: 'fadein 0.45s ease both', animationDelay: delay }}
    >
      <div ref={numRef} className={`text-[2.4rem] font-black leading-none mb-1.5 ${colorClass}`}>
        {value}
      </div>
      <div className="text-[0.85rem] text-[#B095E8] font-semibold">{label}</div>
    </div>
  );
}

export default function Stats() {
  return (
    <div id="stats" className="py-12 px-[5%] relative z-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5 max-w-[900px] mx-auto">
        <StatCard count={26} value="26" colorClass="grad-text"       label="Progressive Levels" delay="0s"   />
        <StatCard count={38} value="38" colorClass="text-[#FFE600]"  label="Unique Avatars"     delay="0.1s" />
        <StatCard count={2}  value="2"  colorClass="grad-text-green" label="Game Modes"          delay="0.2s" />
        <StatCard           value="∞"  colorClass="text-[#FF9500]"  label="Sats to Earn"        delay="0.3s" />
      </div>
    </div>
  );
}
