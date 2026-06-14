import s from './HowItWorks.module.css'

const STEPS = [
  {
    num: '01',
    icon: '🧑🏿',
    title: 'Pick Your Avatar',
    desc: 'Choose from 38 custom Nigerian characters — 19 sisters, 19 brothers. Set your username. Your identity lives on your device, no login needed.',
    col: '#2ad8ff',
    glow: 'rgba(42,216,255,0.35)',
  },
  {
    num: '02',
    icon: '🎯',
    title: 'Play the Levels',
    desc: 'Work through 37 progressive Bitcoin lessons. Match pictures to meanings. Each level builds on the last — from satoshis to Lightning mastery.',
    col: '#f7c948',
    glow: 'rgba(247,201,72,0.35)',
  },
  {
    num: '03',
    icon: '🧩',
    title: 'Survive Word Hunt',
    desc: 'Timed Word Hunt levels test your knowledge. Spot real Bitcoin words hidden among decoys like "SWIFT" and "IBAN". Beat the clock, earn bonus sats.',
    col: '#2bd47a',
    glow: 'rgba(43,212,122,0.35)',
  },
  {
    num: '04',
    icon: '🏆',
    title: 'Climb the Board',
    desc: 'Your sats, completions, and best times sync to the global leaderboard. Stack more sats, go faster, rise to the top. Bitcoin is a game of stacking.',
    col: '#9945ff',
    glow: 'rgba(153,69,255,0.35)',
  },
]

export default function HowItWorks() {
  return (
    <section id="how" className={`section ${s.section}`}>
      {/* Background band */}
      <div className={s.band} />

      <div className={s.head}>
        <p className="section-kicker">Getting started</p>
        <h2 className="section-title">
          Four Steps to Stack <span className="grad-blue">Sats</span>
        </h2>
        <p className="section-sub" style={{ margin: '0 auto 56px' }}>
          No sign-up. No bank account. No Bitcoin needed to start.
          Just pick your character and go.
        </p>
      </div>

      <div className={s.grid}>
        {STEPS.map((step, i) => (
          <div key={i} className={s.card} style={{ '--col': step.col, '--glow': step.glow }}>
            {/* Glow orb behind card */}
            <div className={s.cardGlow} />

            {/* Step number + icon */}
            <div className={s.topRow}>
              <span className={s.stepNum} style={{ color: step.col, borderColor: `${step.col}44` }}>
                {step.num}
              </span>
              <span className={s.icon}>{step.icon}</span>
            </div>

            <h3 className={s.cardTitle}>{step.title}</h3>
            <p className={s.cardDesc}>{step.desc}</p>

            {/* Accent line at bottom */}
            <div className={s.accent} style={{ background: `linear-gradient(90deg, ${step.col}, transparent)` }} />
          </div>
        ))}
      </div>
    </section>
  )
}
