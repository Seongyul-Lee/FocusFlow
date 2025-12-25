export type SoundCategory = 'melody' | 'ambient'

export interface SoundOption {
  label: string
  value: string
}

// Melody sounds (고음, 짧은 멜로디)
export const MELODY_SOUNDS: SoundOption[] = [
  { label: "Achievement ✨", value: "achievement" },
  { label: "Marimba 🎵", value: "marimba" },
  { label: "Chiptune 🎮", value: "chiptune" },
  { label: "Xylophone 🔔", value: "xylophone" },
  { label: "Wind Chime 🌬️", value: "windchime" },
  { label: "Doorbell 🚪", value: "doorbell" },
  { label: "Harp 🎶", value: "harp" },
  { label: "Level Up ⬆️", value: "levelup" },
  { label: "Music Box 🎁", value: "musicbox" },
  { label: "Fanfare 🎺", value: "fanfare" },
]

// Ambient sounds (저음~중음 베이스 배경음)
export const AMBIENT_SOUNDS: SoundOption[] = [
  { label: "Warm Pad 🌅", value: "warmpad" },
  { label: "Zen Bowl 🍵", value: "zenbowl" },
  { label: "Soft Bell 🔔", value: "softbell" },
  { label: "Piano Chord 🎹", value: "pianochord" },
  { label: "Cello Bow 🎻", value: "cellobow" },
  { label: "Synth Pad 🎧", value: "synthpad" },
  { label: "Wind Sweep 🌬️", value: "windsweep" },
  { label: "Rain Drop 🌧️", value: "raindrop" },
  { label: "Forest Breath 🌲", value: "forestbreath" },
  { label: "Meditation Bell 🧘", value: "meditationbell" },
]

// For backward compatibility
export const SOUND_OPTIONS = MELODY_SOUNDS

export function getSoundsByCategory(category: SoundCategory): SoundOption[] {
  return category === 'melody' ? MELODY_SOUNDS : AMBIENT_SOUNDS
}

type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle'

interface NoteConfig {
  frequency: number
  startTime: number
  duration: number
  type?: OscillatorType
  gain?: number
}

// Musical note frequencies
const NOTE = {
  // Low bass notes
  C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.00, A2: 110.00, B2: 123.47,
  C3: 130.81, D3: 146.83, E3: 164.81, F3: 174.61, G3: 196.00, A3: 220.00, B3: 246.94,
  // Mid range
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  // High range
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50, D6: 1174.66, E6: 1318.51,
}

// Global references for real-time volume control
let currentAudioContext: AudioContext | null = null
let currentMasterGain: GainNode | null = null

function createAudioContext(): AudioContext {
  // Stop any currently playing sound
  if (currentAudioContext) {
    try {
      if (currentAudioContext.state !== 'closed') {
        currentAudioContext.close()
      }
    } catch {
      // Ignore errors when closing already closed context
    }
  }
  currentAudioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
  return currentAudioContext
}

// Export function to stop current sound
export function stopCurrentSound(): void {
  if (currentAudioContext) {
    try {
      if (currentAudioContext.state !== 'closed') {
        currentAudioContext.close()
      }
    } catch {
      // Ignore errors when closing already closed context
    }
    currentAudioContext = null
    currentMasterGain = null
  }
}

// Export function to set volume in real-time (0-1 range)
export function setVolume(volume: number): void {
  if (currentMasterGain) {
    currentMasterGain.gain.value = volume
  }
}

function playNote(
  ctx: AudioContext,
  config: NoteConfig,
  masterGain: GainNode
): void {
  const { frequency, startTime, duration, type = 'sine', gain = 0.3 } = config

  const osc = ctx.createOscillator()
  const gainNode = ctx.createGain()

  osc.connect(gainNode)
  gainNode.connect(masterGain)

  osc.type = type
  osc.frequency.value = frequency

  const attackTime = 0.02
  const releaseTime = Math.min(0.1, duration * 0.3)

  gainNode.gain.setValueAtTime(0, ctx.currentTime + startTime)
  gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + startTime + attackTime)
  gainNode.gain.setValueAtTime(gain, ctx.currentTime + startTime + duration - releaseTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration)

  osc.start(ctx.currentTime + startTime)
  osc.stop(ctx.currentTime + startTime + duration)
}

// Helper for ambient sounds with longer attack/release
function playAmbientNote(
  ctx: AudioContext,
  config: NoteConfig,
  masterGain: GainNode,
  attackTime: number = 0.3,
  releaseRatio: number = 0.5
): void {
  const { frequency, startTime, duration, type = 'sine', gain = 0.3 } = config

  const osc = ctx.createOscillator()
  const gainNode = ctx.createGain()

  osc.connect(gainNode)
  gainNode.connect(masterGain)

  osc.type = type
  osc.frequency.value = frequency

  const releaseTime = duration * releaseRatio

  gainNode.gain.setValueAtTime(0, ctx.currentTime + startTime)
  gainNode.gain.linearRampToValueAtTime(gain, ctx.currentTime + startTime + attackTime)
  gainNode.gain.setValueAtTime(gain, ctx.currentTime + startTime + duration - releaseTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration)

  osc.start(ctx.currentTime + startTime)
  osc.stop(ctx.currentTime + startTime + duration)
}

// ============================================
// MELODY SOUNDS (기존 고음 멜로디)
// ============================================

function playAchievement(ctx: AudioContext, masterGain: GainNode): void {
  const notes: NoteConfig[] = [
    { frequency: NOTE.C5, startTime: 0, duration: 0.2, type: 'triangle' },
    { frequency: NOTE.E5, startTime: 0.15, duration: 0.2, type: 'triangle' },
    { frequency: NOTE.G5, startTime: 0.3, duration: 0.2, type: 'triangle' },
    { frequency: NOTE.C6, startTime: 0.45, duration: 0.8, type: 'triangle', gain: 0.4 },
    { frequency: NOTE.E6, startTime: 0.6, duration: 0.3, type: 'sine', gain: 0.15 },
    { frequency: NOTE.G5, startTime: 0.9, duration: 0.4, type: 'sine', gain: 0.1 },
  ]
  notes.forEach(n => playNote(ctx, n, masterGain))
}

function playMarimba(ctx: AudioContext, masterGain: GainNode): void {
  const melody = [NOTE.G4, NOTE.A4, NOTE.B4, NOTE.D5, NOTE.G5, NOTE.D5, NOTE.B4, NOTE.G4]
  const notes: NoteConfig[] = melody.map((freq, i) => ({
    frequency: freq,
    startTime: i * 0.25,
    duration: 0.35,
    type: 'triangle' as OscillatorType,
    gain: 0.35,
  }))
  notes.forEach(n => playNote(ctx, n, masterGain))
}

function playChiptune(ctx: AudioContext, masterGain: GainNode): void {
  const melody = [NOTE.E5, NOTE.E5, NOTE.E5, NOTE.C5, NOTE.E5, NOTE.G5, NOTE.G4]
  const timings = [0, 0.15, 0.35, 0.5, 0.65, 0.95, 1.4]
  const durations = [0.1, 0.15, 0.1, 0.1, 0.25, 0.4, 0.6]

  const notes: NoteConfig[] = melody.map((freq, i) => ({
    frequency: freq,
    startTime: timings[i],
    duration: durations[i],
    type: 'square' as OscillatorType,
    gain: 0.25,
  }))
  notes.forEach(n => playNote(ctx, n, masterGain))
}

function playXylophone(ctx: AudioContext, masterGain: GainNode): void {
  const melody = [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.G5, NOTE.E5, NOTE.C5]
  const notes: NoteConfig[] = melody.map((freq, i) => ({
    frequency: freq,
    startTime: i * 0.3,
    duration: 0.4,
    type: 'sine' as OscillatorType,
    gain: 0.4,
  }))
  notes.forEach(n => playNote(ctx, n, masterGain))
}

function playWindChime(ctx: AudioContext, masterGain: GainNode): void {
  const frequencies = [NOTE.E5, NOTE.G5, NOTE.B5, NOTE.D6, NOTE.E6, NOTE.G5, NOTE.C6, NOTE.E5]
  const notes: NoteConfig[] = frequencies.map((freq, i) => ({
    frequency: freq,
    startTime: i * 0.25 + Math.random() * 0.1,
    duration: 0.8 + Math.random() * 0.4,
    type: 'sine' as OscillatorType,
    gain: 0.2 + Math.random() * 0.1,
  }))
  notes.forEach(n => playNote(ctx, n, masterGain))
}

function playDoorbell(ctx: AudioContext, masterGain: GainNode): void {
  const notes: NoteConfig[] = [
    { frequency: NOTE.E5, startTime: 0, duration: 0.8, type: 'sine', gain: 0.4 },
    { frequency: NOTE.C5, startTime: 0.8, duration: 1.2, type: 'sine', gain: 0.4 },
    { frequency: NOTE.E5 * 2, startTime: 0, duration: 0.6, type: 'sine', gain: 0.1 },
    { frequency: NOTE.C5 * 2, startTime: 0.8, duration: 1.0, type: 'sine', gain: 0.1 },
  ]
  notes.forEach(n => playNote(ctx, n, masterGain))
}

function playHarp(ctx: AudioContext, masterGain: GainNode): void {
  const arpeggio = [NOTE.C4, NOTE.E4, NOTE.G4, NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6]
  const notes: NoteConfig[] = arpeggio.map((freq, i) => ({
    frequency: freq,
    startTime: i * 0.2,
    duration: 2.0 - i * 0.15,
    type: 'triangle' as OscillatorType,
    gain: 0.25,
  }))
  notes.forEach(n => playNote(ctx, n, masterGain))
}

function playLevelUp(ctx: AudioContext, masterGain: GainNode): void {
  const notes: NoteConfig[] = [
    { frequency: NOTE.C4, startTime: 0, duration: 0.15, type: 'square', gain: 0.25 },
    { frequency: NOTE.D4, startTime: 0.1, duration: 0.15, type: 'square', gain: 0.25 },
    { frequency: NOTE.E4, startTime: 0.2, duration: 0.15, type: 'square', gain: 0.25 },
    { frequency: NOTE.F4, startTime: 0.3, duration: 0.15, type: 'square', gain: 0.25 },
    { frequency: NOTE.G4, startTime: 0.4, duration: 0.15, type: 'square', gain: 0.25 },
    { frequency: NOTE.A4, startTime: 0.5, duration: 0.15, type: 'square', gain: 0.25 },
    { frequency: NOTE.B4, startTime: 0.6, duration: 0.15, type: 'square', gain: 0.25 },
    { frequency: NOTE.C5, startTime: 0.7, duration: 0.5, type: 'square', gain: 0.3 },
    { frequency: NOTE.C5, startTime: 1.2, duration: 0.8, type: 'triangle', gain: 0.3 },
    { frequency: NOTE.E5, startTime: 1.2, duration: 0.8, type: 'triangle', gain: 0.25 },
    { frequency: NOTE.G5, startTime: 1.2, duration: 0.8, type: 'triangle', gain: 0.25 },
  ]
  notes.forEach(n => playNote(ctx, n, masterGain))
}

function playMusicBox(ctx: AudioContext, masterGain: GainNode): void {
  const melody = [NOTE.E5, NOTE.D5, NOTE.C5, NOTE.D5, NOTE.E5, NOTE.E5, NOTE.E5]
  const timings = [0, 0.3, 0.6, 0.9, 1.2, 1.5, 1.8]

  const notes: NoteConfig[] = melody.map((freq, i) => ({
    frequency: freq,
    startTime: timings[i],
    duration: 0.35,
    type: 'sine' as OscillatorType,
    gain: 0.3,
  }))
  melody.forEach((freq, i) => {
    notes.push({
      frequency: freq * 3,
      startTime: timings[i],
      duration: 0.2,
      type: 'sine' as OscillatorType,
      gain: 0.08,
    })
  })
  notes.forEach(n => playNote(ctx, n, masterGain))
}

function playFanfare(ctx: AudioContext, masterGain: GainNode): void {
  const notes: NoteConfig[] = [
    { frequency: NOTE.G4, startTime: 0, duration: 0.2, type: 'sawtooth', gain: 0.2 },
    { frequency: NOTE.G4, startTime: 0.25, duration: 0.2, type: 'sawtooth', gain: 0.2 },
    { frequency: NOTE.G4, startTime: 0.5, duration: 0.15, type: 'sawtooth', gain: 0.2 },
    { frequency: NOTE.E5, startTime: 0.7, duration: 0.4, type: 'sawtooth', gain: 0.25 },
    { frequency: NOTE.D5, startTime: 1.15, duration: 0.15, type: 'sawtooth', gain: 0.2 },
    { frequency: NOTE.E5, startTime: 1.35, duration: 0.15, type: 'sawtooth', gain: 0.2 },
    { frequency: NOTE.D5, startTime: 1.55, duration: 0.15, type: 'sawtooth', gain: 0.2 },
    { frequency: NOTE.C5, startTime: 1.75, duration: 0.8, type: 'sawtooth', gain: 0.25 },
  ]
  notes.forEach(n => playNote(ctx, n, masterGain))
}

// ============================================
// AMBIENT SOUNDS (저음~중음 베이스 배경음)
// ============================================

// Warm Pad: 따뜻한 패드 사운드
function playWarmPad(ctx: AudioContext, masterGain: GainNode): void {
  // Chord with slow attack
  const chord = [NOTE.C3, NOTE.E3, NOTE.G3, NOTE.C4]
  chord.forEach((freq, i) => {
    playAmbientNote(ctx, {
      frequency: freq,
      startTime: i * 0.1,
      duration: 2.8 - i * 0.1,
      type: 'triangle',
      gain: 0.2,
    }, masterGain, 0.5, 0.5)
  })
}

// Zen Bowl: 젠 보울 여운
function playZenBowl(ctx: AudioContext, masterGain: GainNode): void {
  // Soft strike with long decay
  const fundamental = NOTE.D3
  const partials = [1, 2.71, 5.4, 8.93] // Bowl-like partials
  const gains = [0.35, 0.2, 0.1, 0.05]

  partials.forEach((mult, i) => {
    playAmbientNote(ctx, {
      frequency: fundamental * mult,
      startTime: 0,
      duration: 3.0,
      type: 'sine',
      gain: gains[i],
    }, masterGain, 0.02, 0.8)
  })
}

// Soft Bell: 부드러운 종소리
function playSoftBell(ctx: AudioContext, masterGain: GainNode): void {
  // Gentle bell with overtones
  const fundamental = NOTE.G3
  const harmonics = [1, 2, 3.5, 5]
  const gains = [0.4, 0.2, 0.12, 0.06]

  harmonics.forEach((mult, i) => {
    playAmbientNote(ctx, {
      frequency: fundamental * mult,
      startTime: 0,
      duration: 2.8 - i * 0.3,
      type: 'sine',
      gain: gains[i],
    }, masterGain, 0.05, 0.7)
  })
}

// Piano Chord: 피아노 코드
function playPianoChord(ctx: AudioContext, masterGain: GainNode): void {
  // C major chord with piano-like attack
  const chord = [NOTE.C3, NOTE.E3, NOTE.G3, NOTE.C4, NOTE.E4]
  chord.forEach((freq, i) => {
    // Main tone
    playAmbientNote(ctx, {
      frequency: freq,
      startTime: i * 0.05,
      duration: 2.5,
      type: 'triangle',
      gain: 0.25 - i * 0.03,
    }, masterGain, 0.02, 0.6)
    // Subtle harmonic
    playAmbientNote(ctx, {
      frequency: freq * 2,
      startTime: i * 0.05,
      duration: 1.5,
      type: 'sine',
      gain: 0.05,
    }, masterGain, 0.02, 0.5)
  })
}

// Cello Bow: 첼로 보잉
function playCelloBow(ctx: AudioContext, masterGain: GainNode): void {
  // Rich cello-like tone with slow bow
  const osc1 = ctx.createOscillator()
  const osc2 = ctx.createOscillator()
  const gainNode1 = ctx.createGain()
  const gainNode2 = ctx.createGain()

  osc1.connect(gainNode1)
  osc2.connect(gainNode2)
  gainNode1.connect(masterGain)
  gainNode2.connect(masterGain)

  osc1.type = 'sawtooth'
  osc2.type = 'triangle'
  osc1.frequency.value = NOTE.G2
  osc2.frequency.value = NOTE.G3

  // Slow attack like bowing
  gainNode1.gain.setValueAtTime(0, ctx.currentTime)
  gainNode1.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.8)
  gainNode1.gain.setValueAtTime(0.25, ctx.currentTime + 2.0)
  gainNode1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.0)

  gainNode2.gain.setValueAtTime(0, ctx.currentTime)
  gainNode2.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.8)
  gainNode2.gain.setValueAtTime(0.15, ctx.currentTime + 2.0)
  gainNode2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.0)

  osc1.start(ctx.currentTime)
  osc2.start(ctx.currentTime)
  osc1.stop(ctx.currentTime + 3.0)
  osc2.stop(ctx.currentTime + 3.0)
}

// Synth Pad: 신스 패드
function playSynthPad(ctx: AudioContext, masterGain: GainNode): void {
  // Layered synth pad
  const layers = [
    { freq: NOTE.C3, type: 'sine' as OscillatorType, gain: 0.3 },
    { freq: NOTE.G3, type: 'triangle' as OscillatorType, gain: 0.2 },
    { freq: NOTE.E4, type: 'sine' as OscillatorType, gain: 0.15 },
  ]

  layers.forEach((layer) => {
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    osc.connect(gainNode)
    gainNode.connect(masterGain)

    osc.type = layer.type
    osc.frequency.value = layer.freq

    gainNode.gain.setValueAtTime(0, ctx.currentTime)
    gainNode.gain.linearRampToValueAtTime(layer.gain, ctx.currentTime + 0.6)
    gainNode.gain.setValueAtTime(layer.gain, ctx.currentTime + 2.2)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.0)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 3.0)
  })
}

// Wind Sweep: 바람 스윕
function playWindSweep(ctx: AudioContext, masterGain: GainNode): void {
  // Sweeping tone like wind
  const osc = ctx.createOscillator()
  const gainNode = ctx.createGain()
  osc.connect(gainNode)
  gainNode.connect(masterGain)

  osc.type = 'sine'
  osc.frequency.setValueAtTime(NOTE.C3, ctx.currentTime)
  osc.frequency.linearRampToValueAtTime(NOTE.G3, ctx.currentTime + 1.0)
  osc.frequency.linearRampToValueAtTime(NOTE.E3, ctx.currentTime + 2.0)
  osc.frequency.linearRampToValueAtTime(NOTE.C3, ctx.currentTime + 3.0)

  gainNode.gain.setValueAtTime(0, ctx.currentTime)
  gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.5)
  gainNode.gain.setValueAtTime(0.3, ctx.currentTime + 2.3)
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3.0)

  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + 3.0)

  // Subtle high layer
  playAmbientNote(ctx, {
    frequency: NOTE.E4,
    startTime: 0.3,
    duration: 2.0,
    type: 'sine',
    gain: 0.08,
  }, masterGain, 0.4, 0.5)
}

// Rain Drop: 빗방울
function playRainDrop(ctx: AudioContext, masterGain: GainNode): void {
  // Multiple gentle drops
  const dropTimes = [0, 0.4, 0.7, 1.1, 1.6, 2.0, 2.3]
  const dropFreqs = [NOTE.E4, NOTE.G4, NOTE.D4, NOTE.A4, NOTE.E4, NOTE.B4, NOTE.G4]

  dropTimes.forEach((time, i) => {
    playAmbientNote(ctx, {
      frequency: dropFreqs[i],
      startTime: time,
      duration: 0.6,
      type: 'sine',
      gain: 0.25,
    }, masterGain, 0.01, 0.8)
  })

  // Low pad beneath
  playAmbientNote(ctx, {
    frequency: NOTE.C3,
    startTime: 0,
    duration: 2.8,
    type: 'triangle',
    gain: 0.12,
  }, masterGain, 0.5, 0.5)
}

// Forest Breath: 숲 호흡
function playForestBreath(ctx: AudioContext, masterGain: GainNode): void {
  // Layered nature-like ambient
  const layers = [
    { freq: NOTE.D3, duration: 2.8, gain: 0.25 },
    { freq: NOTE.A3, duration: 2.5, gain: 0.18 },
    { freq: NOTE.F3, duration: 2.3, gain: 0.12 },
  ]

  layers.forEach((layer, i) => {
    const osc = ctx.createOscillator()
    const gainNode = ctx.createGain()
    osc.connect(gainNode)
    gainNode.connect(masterGain)

    osc.type = 'triangle'
    osc.frequency.value = layer.freq

    gainNode.gain.setValueAtTime(0, ctx.currentTime + i * 0.2)
    gainNode.gain.linearRampToValueAtTime(layer.gain, ctx.currentTime + i * 0.2 + 0.6)
    gainNode.gain.setValueAtTime(layer.gain, ctx.currentTime + layer.duration - 0.5)
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + layer.duration)

    osc.start(ctx.currentTime + i * 0.2)
    osc.stop(ctx.currentTime + layer.duration)
  })
}

// Meditation Bell: 명상 벨
function playMeditationBell(ctx: AudioContext, masterGain: GainNode): void {
  // Single clear bell strike with long resonance
  const fundamental = NOTE.A3
  const partials = [1, 2, 3.5, 5.2, 7.1]
  const gains = [0.4, 0.25, 0.12, 0.08, 0.04]

  partials.forEach((mult, i) => {
    playAmbientNote(ctx, {
      frequency: fundamental * mult,
      startTime: 0,
      duration: 3.0 - i * 0.25,
      type: 'sine',
      gain: gains[i],
    }, masterGain, 0.02, 0.8)
  })
}

// ============================================
// MAIN PLAY FUNCTION
// ============================================

export function playSound(soundType: string, volume: number): void {
  try {
    const ctx = createAudioContext()

    // Create global master gain for real-time volume control
    currentMasterGain = ctx.createGain()
    currentMasterGain.gain.value = volume
    currentMasterGain.connect(ctx.destination)

    switch (soundType) {
      // Melody sounds
      case 'achievement':
        playAchievement(ctx, currentMasterGain)
        break
      case 'marimba':
        playMarimba(ctx, currentMasterGain)
        break
      case 'chiptune':
        playChiptune(ctx, currentMasterGain)
        break
      case 'xylophone':
        playXylophone(ctx, currentMasterGain)
        break
      case 'windchime':
        playWindChime(ctx, currentMasterGain)
        break
      case 'doorbell':
        playDoorbell(ctx, currentMasterGain)
        break
      case 'harp':
        playHarp(ctx, currentMasterGain)
        break
      case 'levelup':
        playLevelUp(ctx, currentMasterGain)
        break
      case 'musicbox':
        playMusicBox(ctx, currentMasterGain)
        break
      case 'fanfare':
        playFanfare(ctx, currentMasterGain)
        break
      // Ambient sounds
      case 'warmpad':
        playWarmPad(ctx, currentMasterGain)
        break
      case 'zenbowl':
        playZenBowl(ctx, currentMasterGain)
        break
      case 'softbell':
        playSoftBell(ctx, currentMasterGain)
        break
      case 'pianochord':
        playPianoChord(ctx, currentMasterGain)
        break
      case 'cellobow':
        playCelloBow(ctx, currentMasterGain)
        break
      case 'synthpad':
        playSynthPad(ctx, currentMasterGain)
        break
      case 'windsweep':
        playWindSweep(ctx, currentMasterGain)
        break
      case 'raindrop':
        playRainDrop(ctx, currentMasterGain)
        break
      case 'forestbreath':
        playForestBreath(ctx, currentMasterGain)
        break
      case 'meditationbell':
        playMeditationBell(ctx, currentMasterGain)
        break
      default:
        playAchievement(ctx, currentMasterGain)
    }

    // Close audio context after sound finishes
    setTimeout(() => {
      try {
        if (ctx.state !== 'closed') {
          ctx.close()
        }
      } catch {
        // Ignore errors
      }
      currentMasterGain = null
    }, 3500)
  } catch (error) {
    console.error('Failed to play sound:', error)
  }
}

// For backward compatibility
export function getSoundAudio(): string {
  return "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUhELTKXh8bllHAU2jdXyz3YnBSp+zPDajzsIEViy6OyrWBUIQ5zd8sFuJAUwhM/x1YU5CBZnvezno1QTCkml4PG6aB4EOIzU8dF0KAYAAAA="
}
