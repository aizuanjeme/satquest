/*
  sfx.js — Procedural Web Audio sound effects.

  No audio files. All sounds are generated in real-time via the Web Audio API.
  The AudioContext is created lazily on first call (browsers require a user
  gesture before audio can start). Suspended contexts are resumed automatically.

  Enabled flag is stored in localStorage under 'sfxEnabled'.
  Default: on. Set to '0' to disable.

  Usage:
    import { sfx } from '../lib/sfx'
    sfx.tap()    // soft UI button press
    sfx.select() // level node selected on map
    sfx.ding()   // correct match
    sfx.buzz()   // wrong match
    sfx.win()    // level complete
    sfx.tick()   // timer low-warning blip
    sfx.isEnabled()      // → boolean
    sfx.setEnabled(bool) // persists to localStorage
*/

const STORAGE_KEY = 'sfxEnabled'

let _ctx = null

function ctx() {
  if (!_ctx) {
    _ctx = new (window.AudioContext || window.webkitAudioContext)()
  }
  if (_ctx.state === 'suspended') _ctx.resume()
  return _ctx
}

function enabled() {
  return localStorage.getItem(STORAGE_KEY) !== '0'
}

/**
 * Core helper — plays one oscillator note with an exponential gain envelope.
 * @param {number}  freq      Start frequency in Hz
 * @param {string}  type      OscillatorType: 'sine' | 'triangle' | 'square' | 'sawtooth'
 * @param {number}  duration  Duration in seconds
 * @param {number}  gain      Peak gain (0–1)
 * @param {number}  [freqEnd] Optional end frequency for a glide
 * @param {number}  [delay]   Optional start delay in seconds
 */
function note(freq, type, duration, gain, freqEnd = null, delay = 0) {
  if (!enabled()) return
  try {
    const ac  = ctx()
    const now = ac.currentTime + delay
    const osc = ac.createOscillator()
    const env = ac.createGain()

    osc.connect(env)
    env.connect(ac.destination)

    osc.type = type
    osc.frequency.setValueAtTime(freq, now)
    if (freqEnd !== null) {
      osc.frequency.linearRampToValueAtTime(freqEnd, now + duration)
    }

    env.gain.setValueAtTime(gain, now)
    env.gain.exponentialRampToValueAtTime(0.0001, now + duration)

    osc.start(now)
    osc.stop(now + duration + 0.01)
  } catch (_) {
    // Silently ignore — audio is enhancement-only
  }
}

export const sfx = {
  /** Read the current enabled state. */
  isEnabled() {
    return enabled()
  },

  /** Persist the enabled flag to localStorage. */
  setEnabled(value) {
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
  },

  /**
   * Soft UI tap — very short sine blip for buttons, tabs, general presses.
   */
  tap() {
    note(400, 'sine', 0.07, 0.06, 320)
  },

  /**
   * Level select — two-note chime when tapping an available map node.
   */
  select() {
    note(660, 'triangle', 0.14, 0.10, 880)
    note(880, 'triangle', 0.12, 0.05, null, 0.08)
  },

  /**
   * Correct match — bright ascending chime.
   * Two layered triangle tones rise together for a clean, musical "ding".
   */
  ding() {
    note(880,  'triangle', 0.18, 0.13, 1100)
    note(1320, 'triangle', 0.18, 0.06, 1650)
  },

  /**
   * Wrong match — short descending buzz.
   * A sawtooth wave drops in pitch, giving a clearly "wrong" feel.
   */
  buzz() {
    note(220, 'sawtooth', 0.20, 0.08, 110)
  },

  /**
   * Level complete — 4-note ascending arpeggio (C5 E5 G5 C6).
   * Each note fires 80 ms after the last for a fanfare cascade.
   */
  win() {
    const arp = [523, 659, 784, 1047]
    arp.forEach((freq, i) => {
      note(freq, 'triangle', 0.28, 0.11, null, i * 0.08)
    })
  },

  /**
   * Timer warning tick — a very short blip for the last 5 seconds.
   */
  tick() {
    note(600, 'square', 0.04, 0.05)
  },
}
