import previewVideo from '../videos/Screen Recording 2026-05-26 at 01.46.18.mov';

export default function VideoPreview() {
  return (
    <section
      id="preview"
      className="relative min-h-screen flex flex-col items-center justify-center px-[5%] py-24 gap-12"
    >
      {/* Heading */}
      <div className="text-center max-w-2xl reveal">
        <h2 className="text-3xl md:text-5xl font-extrabold text-white leading-tight">
          See SatQuest{' '}
          <span className="bg-gradient-to-r from-[#b845ff] to-[#ff9500] bg-clip-text text-transparent">
            in Action
          </span>
        </h2>
        <p className="mt-4 text-white/60 text-base md:text-lg">
          A quick look at how you learn, earn sats, and level up your Bitcoin knowledge.
        </p>
      </div>

      {/* Video container */}
      <div className="reveal w-full max-w-4xl">
        {/* Glow frame */}
        <div className="relative rounded-2xl overflow-hidden shadow-[0_0_80px_rgba(184,69,255,0.35)]"
          style={{ border: '1.5px solid rgba(184,69,255,0.35)' }}>
          {/* Corner accent lines */}
          <div className="pointer-events-none absolute inset-0 rounded-2xl"
            style={{ boxShadow: 'inset 0 0 60px rgba(184,69,255,0.12)' }} />

          <video
            src={previewVideo}
            autoPlay
            loop
            muted
            playsInline
            controls
            className="w-full h-auto block"
            style={{ maxHeight: '65vh', objectFit: 'contain', background: '#000' }}
          />
        </div>

        {/* Caption bar */}
        <div className="mt-4 flex items-center justify-center gap-2 text-white/40 text-sm">
          <span className="inline-block w-2 h-2 rounded-full bg-[#b845ff] animate-pulse" />
          Live preview · SatQuest Beta
        </div>

        {/* CTA */}
        {/* <div className="mt-8 flex justify-center">
          <a
            href="https://satquests.netlify.app"
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-2 no-underline bg-gradient-to-br from-[#FF9500] to-[#FF2D92] text-white px-10 py-3.5 rounded-full text-[1.05rem] font-extrabold shadow-[0_0_30px_rgba(255,149,0,0.4)] transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.03] hover:shadow-[0_10px_40px_rgba(255,149,0,0.55)]"
          >
            ⚡ Try It Now — It&apos;s Free
          </a>
        </div> */}
      </div>
    </section>
  );
}
