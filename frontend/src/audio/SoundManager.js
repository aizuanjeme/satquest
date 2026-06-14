/*
  SoundManager — immersive, procedural game audio (Web Audio API).

  No audio files are shipped. Everything is synthesised live, so the bundle
  stays tiny and the soundscape feels reactive.

  Ambient tracks (one per theme — cross-fades on theme change):
   🌌 dark   — Deep space drone: detuned sawtooth pads, LFO-swept lowpass, sub
   ☀️ light  — Bright chiptune: triangle pads C3/G3/C4, sparkle sine, fast LFO
   📈 market — Trading terminal: square bass pulsed at 2hz, glitchy bandpass layer
   🏦 bank   — Vault classic: warm sine chord G1/D2/G2, very slow filter sweep
   🌧️ rainy  — Lo-fi moody: detuned beating pads + white-noise rain through bandpass
   🪩 disco  — Party mode: square-gated kick bass, bright lead, hi-hat shimmer

  SFX: hover, tap, click, select, correct, wrong, success, win, tick.

  Persistence:
   sfxEnabled   ('0' to mute sfx)
   musicEnabled ('0' to mute ambient)
*/

const SFX_KEY   = 'sfxEnabled'
const MUSIC_KEY = 'musicEnabled'

/* =========================================================================
   AMBIENT TRACK BUILDERS
   Each fn(ac, out) wires oscillators/buffers into `out` (a GainNode already
   connected to master) and returns an array of nodes to .stop() on teardown.
   ========================================================================= */
const TRACK_BUILDERS = {

  /* 🌌 Space Dark — evolving deep-space drone */
  dark(ac, out) {
    const filter = ac.createBiquadFilter()
    filter.type = 'lowpass'; filter.frequency.value = 420; filter.Q.value = 6
    filter.connect(out)

    const padGain = ac.createGain(); padGain.gain.value = 0.14
    const padA = ac.createOscillator(); padA.type = 'sawtooth'; padA.frequency.value = 55       // A1
    const padB = ac.createOscillator(); padB.type = 'sawtooth'; padB.frequency.value = 82.4; padB.detune.value = 6  // ~E2
    padA.connect(padGain); padB.connect(padGain); padGain.connect(filter)

    const subGain = ac.createGain(); subGain.gain.value = 0.18
    const sub = ac.createOscillator(); sub.type = 'sine'; sub.frequency.value = 41.2           // E1
    sub.connect(subGain); subGain.connect(out)

    const lfoGain = ac.createGain(); lfoGain.gain.value = 260
    const lfo = ac.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.05
    lfo.connect(lfoGain); lfoGain.connect(filter.frequency)

    const all = [padA, padB, sub, lfo]; all.forEach(o => o.start()); return all
  },

  /* ☀️ Clean Light — bright, airy triangle pads with breathing filter */
  light(ac, out) {
    const filter = ac.createBiquadFilter()
    filter.type = 'lowpass'; filter.frequency.value = 1800; filter.Q.value = 1.2
    filter.connect(out)

    const padGain = ac.createGain(); padGain.gain.value = 0.09
    const pads = [[130.8, 0], [196.0, 5], [261.6, -3]].map(([freq, det]) => { // C3 G3 C4
      const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = freq; o.detune.value = det
      o.connect(padGain); return o
    })
    padGain.connect(filter)

    // Sparkle high C5
    const sparkleGain = ac.createGain(); sparkleGain.gain.value = 0.032
    const sparkle = ac.createOscillator(); sparkle.type = 'sine'; sparkle.frequency.value = 523.25
    sparkle.connect(sparkleGain); sparkleGain.connect(out)

    // Faster filter sweep for "airy" feel
    const lfoGain = ac.createGain(); lfoGain.gain.value = 900
    const lfo = ac.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.14
    lfo.connect(lfoGain); lfoGain.connect(filter.frequency)

    // Volume breath adds gentle swell
    const breathGain = ac.createGain(); breathGain.gain.value = 0.035
    const breathLfo = ac.createOscillator(); breathLfo.type = 'sine'; breathLfo.frequency.value = 0.07
    breathLfo.connect(breathGain); breathGain.connect(padGain.gain)

    const all = [...pads, sparkle, lfo, breathLfo]; all.forEach(o => o.start()); return all
  },

  /* 📈 Market — tense square bass pulsed at 120BPM + glitchy mid layer */
  market(ac, out) {
    // Square bass at D2, tremolo-gated at 2hz (~120BPM quarter-note pulse)
    const bassGain = ac.createGain(); bassGain.gain.value = 0.12
    const bass = ac.createOscillator(); bass.type = 'square'; bass.frequency.value = 73.4      // D2
    bass.connect(bassGain); bassGain.connect(out)

    const tremoloGain = ac.createGain(); tremoloGain.gain.value = 0.09
    const tremolo = ac.createOscillator(); tremolo.type = 'sine'; tremolo.frequency.value = 2
    tremolo.connect(tremoloGain); tremoloGain.connect(bassGain.gain)

    // Glitchy detuned sawtooth pair through a nervous bandpass
    const bp = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 700; bp.Q.value = 5
    bp.connect(out)
    const glitchGain = ac.createGain(); glitchGain.gain.value = 0.055
    const glitchA = ac.createOscillator(); glitchA.type = 'sawtooth'; glitchA.frequency.value = 146.8 // D3
    const glitchB = ac.createOscillator(); glitchB.type = 'sawtooth'; glitchB.frequency.value = 150.4
    glitchA.connect(glitchGain); glitchB.connect(glitchGain); glitchGain.connect(bp)

    // Sawtooth LFO for nervousness
    const lfoGain = ac.createGain(); lfoGain.gain.value = 280
    const lfo = ac.createOscillator(); lfo.type = 'sawtooth'; lfo.frequency.value = 0.35
    lfo.connect(lfoGain); lfoGain.connect(bp.frequency)

    // Deep sub D1
    const subGain = ac.createGain(); subGain.gain.value = 0.14
    const sub = ac.createOscillator(); sub.type = 'sine'; sub.frequency.value = 36.7
    sub.connect(subGain); subGain.connect(out)

    const all = [bass, tremolo, glitchA, glitchB, lfo, sub]; all.forEach(o => o.start()); return all
  },

  /* 🏦 Bank Vault — warm, stately sine chord with very slow filter breathing */
  bank(ac, out) {
    const filter = ac.createBiquadFilter()
    filter.type = 'lowpass'; filter.frequency.value = 320; filter.Q.value = 2.5
    filter.connect(out)

    const chordGain = ac.createGain(); chordGain.gain.value = 0.14
    const notes = [49, 73.4, 98, 130.8].map((freq, i) => {   // G1 D2 G2 C3
      const o = ac.createOscillator(); o.type = 'sine'; o.frequency.value = freq
      if (i === 2) o.detune.value = 7  // slight warmth on G2
      o.connect(chordGain); return o
    })
    chordGain.connect(filter)

    // Very slow swell — 0.022hz ≈ 45-second breath cycle
    const lfoGain = ac.createGain(); lfoGain.gain.value = 90
    const lfo = ac.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.022
    lfo.connect(lfoGain); lfoGain.connect(filter.frequency)

    // Heavy sub G0 for vault weight
    const subGain = ac.createGain(); subGain.gain.value = 0.22
    const sub = ac.createOscillator(); sub.type = 'sine'; sub.frequency.value = 24.5
    sub.connect(subGain); subGain.connect(out)

    const all = [...notes, lfo, sub]; all.forEach(o => o.start()); return all
  },

  /* 🌧️ Rainy City — detuned beating pads + white-noise rain shimmer */
  rainy(ac, out) {
    const filter = ac.createBiquadFilter()
    filter.type = 'lowpass'; filter.frequency.value = 200; filter.Q.value = 7
    filter.connect(out)

    // A1 pair detuned by 1.6hz creates a slow shimmery beat
    const padGain = ac.createGain(); padGain.gain.value = 0.16
    const padA = ac.createOscillator(); padA.type = 'sawtooth'; padA.frequency.value = 55.0
    const padB = ac.createOscillator(); padB.type = 'sawtooth'; padB.frequency.value = 56.6
    padA.connect(padGain); padB.connect(padGain); padGain.connect(filter)

    // Rain texture: white noise → bandpass around 3.5 kHz
    const bufSize = Math.floor(ac.sampleRate * 4)
    const noiseBuf = ac.createBuffer(1, bufSize, ac.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1
    const noise = ac.createBufferSource(); noise.buffer = noiseBuf; noise.loop = true
    const noiseBp = ac.createBiquadFilter(); noiseBp.type = 'bandpass'; noiseBp.frequency.value = 3500; noiseBp.Q.value = 0.4
    const noiseGain = ac.createGain(); noiseGain.gain.value = 0.042
    noise.connect(noiseBp); noiseBp.connect(noiseGain); noiseGain.connect(out)
    noise.start()

    const lfoGain = ac.createGain(); lfoGain.gain.value = 55
    const lfo = ac.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.028
    lfo.connect(lfoGain); lfoGain.connect(filter.frequency)

    padA.start(); padB.start(); lfo.start()
    return [padA, padB, lfo, noise]   // noise is a BufferSource — also has .stop()
  },

  /* 🪩 Disco — square-gated kick bass, bright triangle lead, hi-hat shimmer */
  disco(ac, out) {
    // Kick: sine A1, gain gated by square LFO at 2hz (120BPM)
    const bassGain = ac.createGain(); bassGain.gain.value = 0.18
    const bass = ac.createOscillator(); bass.type = 'sine'; bass.frequency.value = 55
    bass.connect(bassGain); bassGain.connect(out)

    const kickGain = ac.createGain(); kickGain.gain.value = 0.14
    const kickLfo = ac.createOscillator(); kickLfo.type = 'square'; kickLfo.frequency.value = 2
    kickLfo.connect(kickGain); kickGain.connect(bassGain.gain)

    // Deep sub A0
    const subGain = ac.createGain(); subGain.gain.value = 0.10
    const sub = ac.createOscillator(); sub.type = 'sine'; sub.frequency.value = 27.5
    sub.connect(subGain); subGain.connect(out)

    // Bright synth lead through lowpass, tremolo at 4hz
    const leadFilter = ac.createBiquadFilter(); leadFilter.type = 'lowpass'; leadFilter.frequency.value = 4000
    leadFilter.connect(out)
    const leadGain = ac.createGain(); leadGain.gain.value = 0.058
    const lead = ac.createOscillator(); lead.type = 'triangle'; lead.frequency.value = 880    // A5
    lead.connect(leadGain); leadGain.connect(leadFilter)

    const leadTremoloGain = ac.createGain(); leadTremoloGain.gain.value = 0.05
    const leadTremolo = ac.createOscillator(); leadTremolo.type = 'sine'; leadTremolo.frequency.value = 4
    leadTremolo.connect(leadTremoloGain); leadTremoloGain.connect(leadGain.gain)

    // Hi-hat shimmer: detuned pair at 1760hz
    const hiGain = ac.createGain(); hiGain.gain.value = 0.020
    const hiA = ac.createOscillator(); hiA.type = 'sine'; hiA.frequency.value = 1760
    const hiB = ac.createOscillator(); hiB.type = 'sine'; hiB.frequency.value = 1774
    hiA.connect(hiGain); hiB.connect(hiGain); hiGain.connect(out)

    // Slow pitch wobble on lead for that disco feel
    const wobbleGain = ac.createGain(); wobbleGain.gain.value = 18
    const wobbleLfo = ac.createOscillator(); wobbleLfo.type = 'sine'; wobbleLfo.frequency.value = 0.5
    wobbleLfo.connect(wobbleGain); wobbleGain.connect(lead.detune)

    const all = [bass, kickLfo, sub, lead, leadTremolo, hiA, hiB, wobbleLfo]
    all.forEach(o => o.start()); return all
  },
}

/* =========================================================================
   SOUND MANAGER
   ========================================================================= */
class SoundManagerImpl {
  constructor() {
    this.ctx    = null
    this.master = null
    this.ambientNodes = null
    this._ambientOn   = false
    this._currentTrackId = localStorage.getItem('satquest.theme') || 'dark'

    // Switch tracks automatically when the user changes theme.
    window.addEventListener('satquest:theme', (e) => this.setTrack(e.detail))
  }

  /* ---- context lifecycle ---- */
  _ac() {
    if (!this.ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.9
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') this.ctx.resume()
    return this.ctx
  }

  /** Call once on the first user gesture to unlock audio. */
  unlock() {
    this._currentTrackId = localStorage.getItem('satquest.theme') || 'dark'
    this._ac()
    if (this.musicEnabled() && !this._ambientOn) this.startAmbient()
  }

  /* ---- enabled flags ---- */
  sfxEnabled()  { return localStorage.getItem(SFX_KEY)   !== '0' }
  setSfxEnabled(v)   { localStorage.setItem(SFX_KEY,   v ? '1' : '0') }

  musicEnabled() { return localStorage.getItem(MUSIC_KEY) !== '0' }
  setMusicEnabled(v) {
    localStorage.setItem(MUSIC_KEY, v ? '1' : '0')
    if (v) this.startAmbient()
    else   this.stopAmbient()
  }

  /* ---- low-level note helper ---- */
  _note(freq, type, dur, gain, freqEnd = null, delay = 0, dest = null) {
    if (!this.sfxEnabled()) return
    try {
      const ac = this._ac()
      const t  = ac.currentTime + delay
      const osc = ac.createOscillator()
      const env = ac.createGain()
      osc.connect(env); env.connect(dest || this.master)
      osc.type = type
      osc.frequency.setValueAtTime(freq, t)
      if (freqEnd !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + dur)
      env.gain.setValueAtTime(0.0001, t)
      env.gain.exponentialRampToValueAtTime(gain, t + 0.008)
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      osc.start(t); osc.stop(t + dur + 0.02)
    } catch (_) { /* audio is enhancement-only */ }
  }

  /* =========================================================================
     AMBIENT — start / stop / switch
     ========================================================================= */
  startAmbient() {
    if (this._ambientOn || !this.musicEnabled()) return
    try {
      const ac  = this._ac()
      const out = ac.createGain()
      out.gain.value = 0.0001
      out.connect(this.master)

      const builder    = TRACK_BUILDERS[this._currentTrackId] || TRACK_BUILDERS.dark
      const stoppables = builder(ac, out)

      // Anchor then fade in over 4 s
      const now = ac.currentTime
      out.gain.cancelScheduledValues(now)
      out.gain.setValueAtTime(0.0001, now)
      out.gain.exponentialRampToValueAtTime(0.5, now + 4)

      this.ambientNodes = { out, stoppables }
      this._ambientOn   = true
    } catch (_) { /* ignore */ }
  }

  stopAmbient() {
    if (!this._ambientOn || !this.ambientNodes) { this._ambientOn = false; return }
    try {
      const ac = this._ac()
      const { out, stoppables } = this.ambientNodes
      const now = ac.currentTime
      // Cancel any pending automation (e.g. the 4s fade-in) so the ramp-down wins.
      out.gain.cancelScheduledValues(now)
      out.gain.setValueAtTime(Math.max(out.gain.value, 0.0001), now)
      out.gain.exponentialRampToValueAtTime(0.0001, now + 0.8)
      const stopAt = now + 1.0
      stoppables.forEach((n) => { try { n.stop(stopAt) } catch (_) {} })
    } catch (_) { /* ignore */ }
    this.ambientNodes = null
    this._ambientOn   = false
  }

  /**
   * Cross-fade to a different ambient track.
   * Called automatically when 'satquest:theme' fires, or manually.
   */
  setTrack(themeId) {
    this._currentTrackId = themeId
    if (!this._ambientOn) return          // music is off — just remember for next time
    this.stopAmbient()
    // Brief gap between tracks (~500ms) then fade in new one
    setTimeout(() => {
      if (this.musicEnabled()) this.startAmbient()
    }, 600)
  }

  /* =========================================================================
     SFX
     ========================================================================= */
  hover()   { this._note(2200, 'sine',     0.05, 0.025, 2600) }
  tap()     { this._note(420,  'sine',     0.07, 0.05,  320) }

  click() {
    this._note(520,  'triangle', 0.06, 0.06, 700)
    this._note(1040, 'sine',     0.05, 0.03, null, 0.01)
  }

  select() {
    this._note(660,  'triangle', 0.14, 0.08, 990)
    this._note(990,  'triangle', 0.12, 0.04, null, 0.08)
  }

  correct() {
    this._note(880,  'triangle', 0.18, 0.10, 1180)
    this._note(1320, 'sine',     0.20, 0.05, 1760, 0.04)
  }

  wrong()   { this._note(200, 'sawtooth', 0.22, 0.07, 90) }

  success() {
    const arp = [659, 880, 1175]
    arp.forEach((f, i) => this._note(f, 'triangle', 0.24, 0.09, null, i * 0.07))
  }

  win() {
    const arp = [523, 659, 784, 1047, 1319]
    arp.forEach((f, i) => this._note(f, 'triangle', 0.30, 0.10, null, i * 0.08))
    this._note(130, 'sine', 0.6, 0.10, 110, 0.0)
  }

  tick() { this._note(720, 'square', 0.04, 0.04) }
}

export const sound = new SoundManagerImpl()

