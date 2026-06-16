/*
  SoundManager — arcade action game audio with Afrobeat flavour (Web Audio API).

  No audio files shipped. Everything synthesised live.

  Ambient tracks (tempo-locked beat sequencers):
   🌍 afro   — Afrobeat     112 BPM: clave groove, offbeat bass, horn lead
   🌌 dark   — Deep Action  140 BPM: driving kick/bass, tension filter
   ☀️ light  — Bright Run   150 BPM: arpeggio adventure + 16th hi-hats
   📈 market — Chase Mode   160 BPM: relentless kick, frantic bass hits
   🏦 bank   — Temple Run   120 BPM: heavy epic drum + dramatic bass
   🌧️ rainy  — Dark Pursuit 138 BPM: dark groove + noise texture
   🪩 disco  — Arcade       140 BPM: classic game energy + lead arp

  SFX: hover, tap, click, select, correct, wrong, success, win, tick.
*/

const SFX_KEY   = 'sfxEnabled'
const MUSIC_KEY = 'musicEnabled'

/* =========================================================================
   PERCUSSION HELPERS — stateless, called from sequencer step callbacks
   ========================================================================= */

function kick(ac, out, t, startHz = 110, endHz = 40, dur = 0.32, gain = 0.46) {
  const osc = ac.createOscillator()
  const env = ac.createGain()
  osc.connect(env); env.connect(out)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(startHz, t)
  osc.frequency.exponentialRampToValueAtTime(Math.max(endHz, 1), t + dur * 0.55)
  env.gain.setValueAtTime(0.0001, t)
  env.gain.exponentialRampToValueAtTime(gain, t + 0.003)
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.start(t); osc.stop(t + dur + 0.01)
}

function snare(ac, out, t, gain = 0.22) {
  const dur = 0.14
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource(); src.buffer = buf
  const hp  = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 1800
  const env = ac.createGain()
  src.connect(hp); hp.connect(env); env.connect(out)
  env.gain.setValueAtTime(gain, t)
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.start(t)
}

function hihat(ac, out, t, gain = 0.06, dur = 0.042) {
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource(); src.buffer = buf
  const bp  = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 7200; bp.Q.value = 0.7
  const env = ac.createGain()
  src.connect(bp); bp.connect(env); env.connect(out)
  env.gain.setValueAtTime(gain, t)
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.start(t)
}

function openhat(ac, out, t, gain = 0.05, dur = 0.12) {
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource(); src.buffer = buf
  const bp  = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 5800; bp.Q.value = 0.5
  const env = ac.createGain()
  src.connect(bp); bp.connect(env); env.connect(out)
  env.gain.setValueAtTime(gain, t)
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.start(t)
}

function bassNote(ac, out, t, freq, dur, gain = 0.26, type = 'triangle') {
  const osc = ac.createOscillator()
  const env = ac.createGain()
  osc.connect(env); env.connect(out)
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  env.gain.setValueAtTime(0.0001, t)
  env.gain.exponentialRampToValueAtTime(gain, t + 0.01)
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.start(t); osc.stop(t + dur + 0.01)
}

/* High conga-style tom — pitched sine burst that drops in pitch */
function conga(ac, out, t, pitch = 220, gain = 0.18) {
  const dur = 0.11
  const osc = ac.createOscillator()
  const env = ac.createGain()
  osc.connect(env); env.connect(out)
  osc.type = 'sine'
  osc.frequency.setValueAtTime(pitch, t)
  osc.frequency.exponentialRampToValueAtTime(pitch * 0.55, t + dur)
  env.gain.setValueAtTime(0.0001, t)
  env.gain.exponentialRampToValueAtTime(gain, t + 0.004)
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.start(t); osc.stop(t + dur + 0.01)
}

/* Shaker — short high-pass noise tick */
function shaker(ac, out, t, gain = 0.028) {
  const dur = 0.028
  const buf = ac.createBuffer(1, Math.floor(ac.sampleRate * dur), ac.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  const src = ac.createBufferSource(); src.buffer = buf
  const hp  = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 6000
  const env = ac.createGain()
  src.connect(hp); hp.connect(env); env.connect(out)
  env.gain.setValueAtTime(gain, t)
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.start(t)
}

function leadNote(ac, out, t, freq, dur, gain = 0.048, type = 'triangle') {
  const osc = ac.createOscillator()
  const env = ac.createGain()
  const lp  = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3600
  osc.connect(env); env.connect(lp); lp.connect(out)
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  env.gain.setValueAtTime(0.0001, t)
  env.gain.exponentialRampToValueAtTime(gain, t + 0.008)
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.start(t); osc.stop(t + dur + 0.01)
}

/* =========================================================================
   SEQUENCER — look-ahead clock scheduling (standard Web Audio pattern)
   Returns { stop() } — compatible with stoppables array in the manager.
   ========================================================================= */
function createSequencer(ac, stepFn, bpm = 140) {
  const stepDur = (60 / bpm) / 4   // 16th note duration in seconds
  let step = 0
  let nextTime = ac.currentTime + 0.05
  let running  = true

  const id = setInterval(() => {
    if (!running) return
    const ahead = 0.15
    while (running && nextTime < ac.currentTime + ahead) {
      try { stepFn(ac, nextTime, step % 16) } catch (_) { /* never crash sequencer */ }
      step++
      nextTime += stepDur
    }
  }, 25)

  return { stop() { running = false; clearInterval(id) } }
}

/* =========================================================================
   AMBIENT TRACK BUILDERS
   Each fn(ac, out) → array of { stop() } objects (sequencers + osc wrappers)
   ========================================================================= */
const TRACK_BUILDERS = {

  /* � Afrobeat — 112 BPM clave groove, offbeat bass, bright horn lead
     Kick on 1 & "3-and", ghost snare, heavy offbeat conga, shaker every 8th,
     syncopated bass, A-minor pentatonic horn arpeggio. */
  afro(ac, out) {
    // A-minor pentatonic horn arp: A3 C4 D4 E4 G4 A4
    const HORN = [220, 261.6, 293.7, 329.6, 392.0, 440,
                  392.0, 329.6, 261.6, 293.7, 220, 0,
                  329.6, 392.0, 440, 329.6]
    // Syncopated bass (A1 / E2 / D2)
    const BASS = [110, 0, 0, 146.8, 110, 0, 164.8, 0,
                  110, 0, 146.8, 0, 110, 164.8, 0, 110]
    // Conga pitches per 16th step (0 = rest)
    const CONGA_HI = [0, 0, 260, 0, 0, 260, 0, 0,  0, 260, 0, 0, 260, 0, 260, 0]
    const CONGA_LO = [0, 180, 0, 0, 180, 0, 0, 180, 0, 0, 180, 0, 0, 180, 0, 0]

    const seq = createSequencer(ac, (ac, t, s) => {
      // Kick: beat 1 (s=0), "2-and" (s=6), beat 3 (s=8)
      if (s === 0 || s === 8)     kick(ac, out, t, 90, 42, 0.30, 0.38)
      if (s === 6)                kick(ac, out, t, 80, 40, 0.22, 0.28)
      // Ghost snare on beats 2 & 4
      if (s === 4)                snare(ac, out, t, 0.11)
      if (s === 12)               snare(ac, out, t, 0.17)
      // Shaker on every 8th note
      if (s % 2 === 0)            shaker(ac, out, t, 0.032)
      // Conga pattern
      if (CONGA_HI[s] > 0)        conga(ac, out, t, CONGA_HI[s], 0.16)
      if (CONGA_LO[s] > 0)        conga(ac, out, t, CONGA_LO[s], 0.13)
      // Offbeat open hat
      if (s % 2 === 1)            openhat(ac, out, t, 0.034, 0.09)
      // Bass
      if (BASS[s] > 0)            bassNote(ac, out, t, BASS[s], 0.24, 0.24)
      // Horn lead — sawtooth through lowpass for warm "brass" tone
      if (HORN[s] > 0)            leadNote(ac, out, t, HORN[s], 0.20, 0.052, 'sawtooth')
    }, 112)

    // Warm sub A1 for depth
    const subG = ac.createGain(); subG.gain.value = 0.10
    const sub  = ac.createOscillator(); sub.type = 'sine'; sub.frequency.value = 55
    sub.connect(subG); subG.connect(out); sub.start()

    return [seq, { stop() { sub.stop() } }]
  },

  /* �🌌 Deep Action — 140 BPM driving kick/bass + evolving tension filter */
  dark(ac, out) {
    const BASS = [55, 0, 82, 0, 73, 0, 82, 55,  55, 0, 82, 0, 73, 82, 55, 73]

    const seq = createSequencer(ac, (ac, t, s) => {
      if (s === 0 || s === 8)         kick(ac, out, t, 120, 42, 0.34, 0.44)
      if (s === 0)                    kick(ac, out, t, 160, 46, 0.28, 0.18) // layer
      if (s === 4 || s === 12)        snare(ac, out, t, 0.18)
      if (s % 2 === 0)                hihat(ac, out, t, 0.052)
      if (s === 6 || s === 14)        openhat(ac, out, t, 0.040)
      if (BASS[s] > 0)                bassNote(ac, out, t, BASS[s], 0.20, 0.22)
    }, 140)

    // Continuous sub for depth
    const subG = ac.createGain(); subG.gain.value = 0.09
    const sub  = ac.createOscillator(); sub.type = 'sine'; sub.frequency.value = 41.2
    sub.connect(subG); subG.connect(out); sub.start()

    // Slowly-sweeping pad for atmosphere
    const filter = ac.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 700; filter.Q.value = 5
    const padG = ac.createGain(); padG.gain.value = 0.055
    const pad  = ac.createOscillator(); pad.type = 'sawtooth'; pad.frequency.value = 55
    pad.connect(padG); padG.connect(filter); filter.connect(out); pad.start()
    const lfoG = ac.createGain(); lfoG.gain.value = 360
    const lfo  = ac.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.07
    lfo.connect(lfoG); lfoG.connect(filter.frequency); lfo.start()

    return [seq, { stop() { sub.stop(); pad.stop(); lfo.stop() } }]
  },

  /* ☀️ Bright Run — 150 BPM adventure arpeggios + 16th hi-hats */
  light(ac, out) {
    const ARP  = [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 523.25, 392.0,
                  523.25, 659.25, 880.0,  1046.5,  880.0,  659.25, 523.25, 440.0]
    const BASS = [130.8, 0, 164.8, 0, 130.8, 0, 196.0, 164.8,
                  130.8, 0, 164.8, 0, 130.8, 0, 261.6, 130.8]

    const seq = createSequencer(ac, (ac, t, s) => {
      if (s === 0 || s === 8)   kick(ac, out, t, 100, 44, 0.28, 0.38)
      if (s === 4 || s === 12)  snare(ac, out, t, 0.16)
      hihat(ac, out, t, 0.048)  // every 16th
      if (BASS[s] > 0)          bassNote(ac, out, t, BASS[s], 0.22, 0.20)
      leadNote(ac, out, t, ARP[s], 0.13, 0.042, 'triangle')
    }, 150)

    return [seq]
  },

  /* 📈 Chase Mode — 160 BPM relentless kick, frantic bass hits */
  market(ac, out) {
    const BASS = [73.4, 0, 110, 0, 73.4, 0, 110, 146.8,
                  73.4, 0, 110, 0, 73.4, 110, 146.8, 73.4]

    const seq = createSequencer(ac, (ac, t, s) => {
      if (s % 4 === 0)            kick(ac, out, t, 128, 44, 0.28, 0.42)
      if (s === 10 || s === 14)   kick(ac, out, t, 100, 42, 0.20, 0.26)
      if (s === 4 || s === 12)    snare(ac, out, t, 0.20)
      hihat(ac, out, t, 0.065)
      if (BASS[s] > 0)            bassNote(ac, out, t, BASS[s], 0.14, 0.24, 'square')
    }, 160)

    const subG = ac.createGain(); subG.gain.value = 0.11
    const sub  = ac.createOscillator(); sub.type = 'sine'; sub.frequency.value = 36.7
    sub.connect(subG); subG.connect(out); sub.start()

    return [seq, { stop() { sub.stop() } }]
  },

  /* 🏦 Temple Run — 120 BPM epic heavy drums, dramatic bass hits */
  bank(ac, out) {
    const BASS = [49, 0, 0, 0, 73.4, 0, 0, 0,  49, 0, 0, 61.7, 73.4, 0, 0, 0]

    const seq = createSequencer(ac, (ac, t, s) => {
      if (s === 0)                  kick(ac, out, t, 150, 38, 0.44, 0.54)
      if (s === 6 || s === 10)      kick(ac, out, t, 120, 40, 0.30, 0.36)
      if (s === 8)                  kick(ac, out, t, 130, 38, 0.40, 0.44)
      if (s === 4 || s === 12)      snare(ac, out, t, 0.28)
      if (s % 4 === 2)              openhat(ac, out, t, 0.048)
      if (BASS[s] > 0)              bassNote(ac, out, t, BASS[s], 0.38, 0.30)
    }, 120)

    const droneG = ac.createGain(); droneG.gain.value = 0.11
    const drone  = ac.createOscillator(); drone.type = 'sine'; drone.frequency.value = 24.5
    drone.connect(droneG); droneG.connect(out); drone.start()

    return [seq, { stop() { drone.stop() } }]
  },

  /* 🌧️ Dark Pursuit — 138 BPM moody groove + rain noise texture */
  rainy(ac, out) {
    const BASS = [55, 0, 0, 82, 55, 0, 73, 0,  55, 0, 0, 82, 73, 0, 55, 73]

    const seq = createSequencer(ac, (ac, t, s) => {
      if (s === 0 || s === 10)      kick(ac, out, t, 110, 42, 0.34, 0.40)
      if (s === 4 || s === 12)      snare(ac, out, t, 0.15)
      if (s % 2 === 0)              hihat(ac, out, t, 0.033)
      if (BASS[s] > 0)              bassNote(ac, out, t, BASS[s], 0.22, 0.21)
    }, 138)

    // Rain noise layer
    const sr = ac.sampleRate
    const nBuf = ac.createBuffer(1, sr * 4, sr)
    const nd = nBuf.getChannelData(0)
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1
    const noise = ac.createBufferSource(); noise.buffer = nBuf; noise.loop = true
    const nBp   = ac.createBiquadFilter(); nBp.type = 'bandpass'; nBp.frequency.value = 2800; nBp.Q.value = 0.5
    const nG    = ac.createGain(); nG.gain.value = 0.020
    noise.connect(nBp); nBp.connect(nG); nG.connect(out); noise.start()

    return [seq, { stop() { noise.stop() } }]
  },

  /* 🪩 Arcade — 140 BPM classic game energy + arpeggiated lead */
  disco(ac, out) {
    const ARP  = [880, 1108.7, 1318.5, 1568, 1318.5, 1108.7, 880, 659.25,
                  880, 1108.7, 1318.5, 1760, 1318.5, 1108.7, 880, 659.25]
    const BASS = [55, 0, 82, 0, 110, 55, 82, 55,  55, 0, 82, 55, 110, 82, 55, 82]

    const seq = createSequencer(ac, (ac, t, s) => {
      if (s === 0 || s === 8)   kick(ac, out, t, 110, 45, 0.28, 0.40)
      if (s === 4 || s === 12)  snare(ac, out, t, 0.17)
      hihat(ac, out, t, 0.046)
      if (BASS[s] > 0)          bassNote(ac, out, t, BASS[s], 0.16, 0.20)
      leadNote(ac, out, t, ARP[s], 0.10, 0.040, 'square')
    }, 140)

    return [seq]
  },
}

/* =========================================================================
   SOUND MANAGER
   ========================================================================= */
class SoundManagerImpl {
  constructor() {
    this.ctx         = null
    this.master      = null   // → destination (sfx + music)
    this.musicMaster = null   // → master (music only — muted/unmuted here)
    this.ambientNodes    = null
    this._ambientOn      = false
    this._currentTrackId = localStorage.getItem('satquest.theme') || 'afro'

    window.addEventListener('satquest:theme', (e) => this.setTrack(e.detail))
  }

  /* ---- AudioContext lifecycle ---- */
  _ac() {
    if (!this.ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext
      this.ctx = new Ctor()
      // master: all audio → destination
      this.master = this.ctx.createGain()
      this.master.gain.value = 0.85
      this.master.connect(this.ctx.destination)
      // musicMaster: ambient only → master; instantly silenced on mute
      this.musicMaster = this.ctx.createGain()
      this.musicMaster.gain.value = this.musicEnabled() ? 1 : 0
      this.musicMaster.connect(this.master)
    }
    if (this.ctx.state === 'suspended') this.ctx.resume()
    return this.ctx
  }

  /** Call on first user gesture to unlock audio. */
  unlock() {
    this._currentTrackId = localStorage.getItem('satquest.theme') || 'afro'
    this._ac()
    if (this.musicEnabled() && !this._ambientOn) this.startAmbient()
  }

  /* ---- persistence flags ---- */
  sfxEnabled()       { return localStorage.getItem(SFX_KEY)   !== '0' }
  setSfxEnabled(v)   { localStorage.setItem(SFX_KEY,   v ? '1' : '0') }
  musicEnabled()     { return localStorage.getItem(MUSIC_KEY) !== '0' }
  setMusicEnabled(v) {
    localStorage.setItem(MUSIC_KEY, v ? '1' : '0')
    // Immediately cut/restore the music-only gain — instantaneous and reliable
    if (this.musicMaster) this.musicMaster.gain.value = v ? 1 : 0
    if (v) this.startAmbient(); else this.stopAmbient()
  }

  /* ---- low-level tone helper ---- */
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
      env.gain.exponentialRampToValueAtTime(gain, t + 0.006)
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      osc.start(t); osc.stop(t + dur + 0.02)
    } catch (_) {}
  }

  /* ---- noise burst helper (snare-style SFX) ---- */
  _noise(dur, gain, freq = 3000, q = 1.5, delay = 0) {
    if (!this.sfxEnabled()) return
    try {
      const ac = this._ac()
      const t  = ac.currentTime + delay
      const sr = ac.sampleRate
      const buf = ac.createBuffer(1, Math.floor(sr * dur), sr)
      const d = buf.getChannelData(0)
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
      const src = ac.createBufferSource(); src.buffer = buf
      const bp  = ac.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = q
      const env = ac.createGain()
      src.connect(bp); bp.connect(env); env.connect(this.master)
      env.gain.setValueAtTime(gain, t)
      env.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      src.start(t)
    } catch (_) {}
  }

  /* =========================================================================
     AMBIENT — start / stop / switch
     ========================================================================= */
  startAmbient() {
    if (this._ambientOn || !this.musicEnabled()) return
    try {
      const ac  = this._ac()
      // Route ambient through musicMaster so mute/unmute is instant
      const out = ac.createGain()
      out.gain.value = 0.55
      out.connect(this.musicMaster)

      const builder    = TRACK_BUILDERS[this._currentTrackId] || TRACK_BUILDERS.afro
      const stoppables = builder(ac, out)

      this.ambientNodes = { out, stoppables }
      this._ambientOn   = true
    } catch (_) {}
  }

  stopAmbient() {
    if (!this._ambientOn || !this.ambientNodes) { this._ambientOn = false; return }
    const { out, stoppables } = this.ambientNodes
    this.ambientNodes = null
    this._ambientOn   = false
    try {
      // Stop sequencers first — no new notes scheduled
      stoppables.forEach((n) => { try { n.stop() } catch (_) {} })
      // Disconnect the track output
      try { out.disconnect() } catch (_) {}
    } catch (_) {}
    // musicMaster.gain is already 0 if called from setMusicEnabled(false)
  }

  setTrack(themeId) {
    this._currentTrackId = themeId
    if (!this._ambientOn) return
    this.stopAmbient()
    setTimeout(() => { if (this.musicEnabled()) this.startAmbient() }, 500)
  }

  /* =========================================================================
     SFX — punchy arcade game sounds
     ========================================================================= */

  /** Quick UI hover blip */
  hover() {
    this._note(1600, 'sine', 0.038, 0.022, 2000)
  }

  /** Snappy button tap */
  tap() {
    this._note(380, 'triangle', 0.06, 0.06, 500)
  }

  /** Crisp UI click with tiny overtone */
  click() {
    this._note(500, 'triangle', 0.055, 0.07, 740)
    this._note(980, 'sine',     0.045, 0.03, null, 0.014)
  }

  /** Power-up whoosh sweep */
  select() {
    this._note(160, 'sine',     0.18, 0.07, 1080)
    this._note(340, 'triangle', 0.14, 0.04, 860,  0.03)
  }

  /** Coin collect — bright arcade bling */
  correct() {
    this._note(1047, 'sine',     0.10, 0.13, 1568)        // C6 → G6
    this._note(2093, 'sine',     0.08, 0.06, 2637, 0.06)  // sparkle C7 → E7
    this._note(1319, 'triangle', 0.10, 0.04, null, 0.03)  // mid shimmer
  }

  /** Thud fail + crunch */
  wrong() {
    this._note(260, 'sawtooth', 0.18, 0.09, 68)  // descending thud
    this._noise(0.11, 0.09, 800, 2.2, 0.008)      // crunch burst
  }

  /** Quick ascending fanfare */
  success() {
    const arp = [523.25, 659.25, 783.99, 1046.5]  // C5 E5 G5 C6
    arp.forEach((f, i) => this._note(f, 'triangle', 0.18, 0.10, null, i * 0.07))
    this._noise(0.07, 0.09, 2200, 1.0, 0.01)       // snare accent
  }

  /** Full victory fanfare — 8-note ascending run + kick boom */
  win() {
    const arp = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1318.5, 1568]
    arp.forEach((f, i) => this._note(f, 'triangle', 0.22, 0.09, null, i * 0.06))
    // Kick boom at start
    this._note(80, 'sine', 0.40, 0.14, 38, 0.02)
    // High shimmer sparkle at peak
    this._note(2093, 'sine', 0.25, 0.06, 3136, arp.length * 0.06)
  }

  /** Sharp timer tick */
  tick() {
    this._note(820, 'square', 0.022, 0.05)
    this._noise(0.016, 0.036, 5200, 2.5)
  }
}

export const sound = new SoundManagerImpl()
