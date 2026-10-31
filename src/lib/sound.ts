/**
 * Interface sounds, with a space-ambient palette.
 *
 * The sounds are synthesised with Tone.js (MIT), which brings the parts that
 * bare Web Audio oscillators lack: FM voices for crystalline pings, detuned
 * pads, filtered noise for whooshes and risers, and above all a generated
 * reverb and a ping-pong delay, which give every sound a tail in a large,
 * dark space. Nothing is shipped as audio files.
 *
 * Tone is loaded lazily, on the visitor's first interaction: it is a sizeable
 * library and nothing can be heard before a gesture anyway. The audio context
 * is created and resumed inside that gesture — what iOS insists on — and
 * handed to Tone once it has loaded. Sounds asked for before then are dropped.
 */

import type * as ToneNamespace from 'tone'

type Tone = typeof ToneNamespace

export type SoundName =
  | 'bubble'
  | 'collapse'
  | 'cardOpen'
  | 'cardClose'
  | 'link'
  | 'hover'
  | 'toggle'
  | 'focusIn'
  | 'focusOut'

export const SOUND_NAMES: SoundName[] = [
  'bubble',
  'collapse',
  'cardOpen',
  'cardClose',
  'link',
  'hover',
  'toggle',
  'focusIn',
  'focusOut',
]

interface PlayOptions {
  /** Multiplies every frequency, to vary a sound that repeats in a burst. */
  pitch?: number
  /**
   * Seconds to hold the sound back. Scheduled on the audio clock rather than
   * with a timer, so a component unmounting — or React replaying an effect in
   * development — cannot swallow it.
   */
  delay?: number
}

export interface SoundEngine {
  play: (name: SoundName, pitch: number, delay: number) => void
}

const STORAGE_KEY = 'portfolio:sound-enabled'
/** Hover fires on every pointer move onto a node — keep it from chattering. */
const HOVER_MIN_INTERVAL_MS = 140

/**
 * Builds the voices, the effects and the sounds on whatever audio context Tone
 * currently holds — the live one on the site, an offline one when rendering
 * the sounds to files.
 */
export async function createSoundEngine(Tone: Tone): Promise<SoundEngine> {
  // The space: everything ends in a long, dark reverb, softened at the top.
  const limiter = new Tone.Limiter(-3).toDestination()
  const master = new Tone.Volume(4).connect(limiter)
  const air = new Tone.Filter({ type: 'lowpass', frequency: 7000, rolloff: -12 }).connect(master)
  const reverb = new Tone.Reverb({ decay: 5.5, preDelay: 0.03, wet: 0.42 }).connect(air)
  const echo = new Tone.PingPongDelay({ delayTime: 0.23, feedback: 0.34, wet: 0.24 }).connect(reverb)

  // Crystalline pings: FM with a slightly inharmonic ratio, like struck glass.
  const ping = new Tone.PolySynth(Tone.FMSynth, {
    harmonicity: 3.01,
    modulationIndex: 2.2,
    oscillator: { type: 'sine' },
    modulation: { type: 'sine' },
    envelope: { attack: 0.004, decay: 0.4, sustain: 0, release: 1.6 },
    modulationEnvelope: { attack: 0.002, decay: 0.18, sustain: 0, release: 0.3 },
    volume: -8,
  }).connect(echo)
  ping.maxPolyphony = 32

  // A soft pad, three detuned sines per note, for warmth under the pings.
  const pad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: 'fatsine', count: 3, spread: 22 },
    envelope: { attack: 0.06, decay: 0.9, sustain: 0, release: 2 },
    volume: -15,
  }).connect(reverb)
  pad.maxPolyphony = 12

  // Air: pink noise through a band that sweeps, for whooshes and risers.
  const sweep = new Tone.Filter({ type: 'bandpass', frequency: 800, Q: 1.1 }).connect(reverb)
  const noise = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: { attack: 0.08, decay: 0.3, sustain: 0.2, release: 0.25 },
    volume: -10,
  }).connect(sweep)

  // The low "whoom" under the bigger moments, kept out of the reverb so the
  // bottom end stays clean.
  const sub = new Tone.MembraneSynth({
    pitchDecay: 0.14,
    octaves: 2.2,
    envelope: { attack: 0.003, decay: 0.7, sustain: 0, release: 0.5 },
    volume: -9,
  }).connect(master)

  await reverb.ready

  const pingAt = (frequency: number, time: number, velocity: number, length = 0.06) =>
    ping.triggerAttackRelease(frequency, length, time, velocity)

  const whoosh = (from: number, to: number, length: number, time: number, velocity: number) => {
    sweep.frequency.cancelScheduledValues(time)
    sweep.frequency.setValueAtTime(from, time)
    sweep.frequency.exponentialRampToValueAtTime(to, time + length)
    noise.triggerAttackRelease(length, time, velocity)
  }

  const sounds: Record<SoundName, (time: number, pitch: number) => void> = {
    // A node popping out: a single small ping.
    bubble: (t, p) => pingAt(660 * p, t, 0.42),
    // Folding back in: the same ping, lower and quieter.
    collapse: (t, p) => pingAt(440 * p, t, 0.3),
    // Brushing a node: barely there.
    hover: (t, p) => pingAt(1320 * p, t, 0.1, 0.03),
    toggle: (t, p) => {
      pingAt(523 * p, t, 0.36)
      pingAt(784 * p, t + 0.07, 0.36)
    },
    // Leaving the site: two rising pings.
    link: (t, p) => {
      pingAt(784 * p, t, 0.4)
      pingAt(1175 * p, t + 0.08, 0.4)
    },
    cardOpen: (t, p) => {
      whoosh(500 * p, 2600 * p, 0.25, t, 0.22)
      pad.triggerAttackRelease([392 * p, 587 * p], 0.25, t, 0.22)
      pingAt(988 * p, t + 0.04, 0.28)
    },
    cardClose: (t, p) => {
      whoosh(2400 * p, 500 * p, 0.22, t, 0.18)
      pingAt(660 * p, t, 0.24)
    },
    // A card going full screen: air rushing past, a low swell, a chord.
    focusIn: (t, p) => {
      whoosh(300 * p, 3500 * p, 0.5, t, 0.5)
      sub.triggerAttackRelease(55 * p, 0.4, t, 0.35)
      pad.triggerAttackRelease([220 * p, 330 * p, 494 * p], 0.5, t + 0.05, 0.16)
    },
    focusOut: (t, p) => {
      whoosh(3500 * p, 300 * p, 0.45, t, 0.45)
      sub.triggerAttackRelease(49 * p, 0.35, t, 0.3)
    },
  }

  return {
    play: (name, pitch, delay) => sounds[name](Tone.now() + 0.01 + delay, pitch),
  }
}

let enabled = readStoredPreference()
let engine: SoundEngine | null = null
let loading = false
let lastHoverAt = 0

function readStoredPreference(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    // Private windows and blocked storage: fall back to sound on.
    return true
  }
}

const UNLOCK_EVENTS = ['pointerdown', 'keydown', 'touchstart'] as const

/**
 * Creates and resumes the audio context inside the gesture, then loads Tone
 * and hands it that context.
 */
function unlock() {
  if (loading || !enabled) return
  const AudioContextConstructor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextConstructor) return

  loading = true
  UNLOCK_EVENTS.forEach((type) => window.removeEventListener(type, unlock, true))

  const context = new AudioContextConstructor()
  void context.resume()

  import('tone')
    .then(async (Tone) => {
      Tone.setContext(context)
      engine = await createSoundEngine(Tone)
    })
    .catch(() => {
      // Audio is a garnish: without it, the site simply stays quiet.
    })
}

if (typeof window !== 'undefined') {
  UNLOCK_EVENTS.forEach((type) =>
    window.addEventListener(type, unlock, { capture: true, passive: true }),
  )
}

/** Plays one of the interface sounds, unless the visitor muted them. */
export function playSound(name: SoundName, options: PlayOptions = {}) {
  if (!enabled || !engine) return

  if (name === 'hover') {
    const now = performance.now()
    if (now - lastHoverAt < HOVER_MIN_INTERVAL_MS) return
    lastHoverAt = now
  }

  try {
    engine.play(name, options.pitch ?? 1, Math.max(0, options.delay ?? 0))
  } catch {
    // Audio is a garnish: never let it break an interaction.
  }
}

/**
 * A stable pitch for a given node, so a burst of pings sounds like a little
 * arpeggio rather than the same blip repeated.
 */
export function pitchFromKey(key: string): number {
  let hash = 0
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) % 100000
  }
  return 0.86 + (hash % 100) / 100 * 0.42
}

/**
 * A small deterministic delay for a given node, in seconds. Siblings
 * collapse at the same instant, so without this a branch folding away would
 * fire one thick chord instead of a run of pings.
 */
export function staggerFromKey(key: string, spreadSeconds = 0.13): number {
  let hash = 0
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 17 + key.charCodeAt(index)) % 100000
  }
  return (hash % 100) / 100 * spreadSeconds
}

export function isSoundEnabled(): boolean {
  return enabled
}

export function setSoundEnabled(value: boolean) {
  enabled = value
  try {
    window.localStorage.setItem(STORAGE_KEY, value ? 'on' : 'off')
  } catch {
    // Preference just won't stick; the session still honours it.
  }
  if (value) {
    unlock()
    playSound('toggle')
  }
}
