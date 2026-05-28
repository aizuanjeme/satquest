const APP_URL = import.meta.env.VITE_APP_URL ?? 'https://satquests.netlify.app';

export default function OpenSource() {
  return (
    <section id="opensource" className="py-24 px-[5%] text-center">
      <div className="relative bg-[rgba(184,69,255,0.08)] border border-[rgba(184,69,255,0.2)] rounded-[32px] p-16 max-w-[760px] mx-auto overflow-hidden" style={{ animation: 'fadein 0.45s ease both', animationDelay: '0.1s' }}>
        {/* Blobs */}
        <div className="pointer-events-none absolute -top-[60px] -left-[60px] w-[250px] h-[250px] rounded-full blur-[80px] opacity-35 bg-[radial-gradient(circle,rgba(184,69,255,0.25),transparent_70%)]" />
        <div className="pointer-events-none absolute -bottom-[60px] -right-[40px] w-[200px] h-[200px] rounded-full blur-[80px] opacity-25 bg-[radial-gradient(circle,rgba(255,149,0,0.20),transparent_70%)]" />
        {/* Top radial glow overlay */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,rgba(184,69,255,0.12),transparent)]" />

        <h2 className="relative text-[clamp(1.8rem,3vw,2.5rem)] font-black leading-[1.2] mb-4">
          Built in the Open,
          <br />
          <span className="grad-text">For Everyone.</span>
        </h2>
        <p className="relative text-[#B095E8] text-[1.05rem] mb-8 max-w-[500px] mx-auto">
          SatQuest is fully MIT-licensed. Fork it, remix it, deploy it in your community.
          Bitcoin education should be free and open to all.
        </p>

        <div className="relative flex gap-4 justify-center flex-wrap">
          <a
            href="https://github.com/aizuanjeme/satquest"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 no-underline bg-gradient-to-br from-[#FF9500] to-[#FF2D92] text-white px-9 py-3.5 rounded-full text-[1.05rem] font-extrabold shadow-[0_0_30px_rgba(255,149,0,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_10px_40px_rgba(255,149,0,0.55)]"
          >
            ⭐ Star on GitHub
          </a>
          <a
            href={APP_URL}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 no-underline bg-transparent border-[1.5px] border-white/10 text-[#B095E8] px-8 py-3.5 rounded-full text-[1rem] font-bold transition-all duration-200 hover:border-[#B845FF] hover:text-[#B845FF] hover:-translate-y-0.5"
          >
            ⚡ Open the App
          </a>
        </div>
      </div>
    </section>
  );
}
