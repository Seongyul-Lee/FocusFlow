export type BgmCategory = 'lofi' | 'christmas'

export interface BgmTrack {
  id: string
  labelKey: string // i18n key
  category: BgmCategory
  file: string // MP3 file path
}

export const BGM_TRACKS: BgmTrack[] = [
  // Lo-fi / Chill
  {
    id: 'good-night-lofi',
    labelKey: 'goodNightLofi',
    category: 'lofi',
    file: '/bgm/good-night-lofi-cozy-chill-music-160166.mp3',
  },
  {
    id: 'lofi-study',
    labelKey: 'lofiStudy',
    category: 'lofi',
    file: '/bgm/lofi-study-calm-peaceful-chill-hop-112191.mp3',
  },
  {
    id: 'chill-study-desk',
    labelKey: 'chillStudyDesk',
    category: 'lofi',
    file: '/bgm/chill-study-desk-focus-amp-concentration-lofi-451180.mp3',
  },

  // Christmas
  {
    id: 'christmas-jazz',
    labelKey: 'christmasJazz',
    category: 'christmas',
    file: '/bgm/christmas-jazz-christmas-holiday-347485.mp3',
  },
  {
    id: 'silent-night-piano',
    labelKey: 'silentNightPiano',
    category: 'christmas',
    file: '/bgm/silent-night-christmas-piano-175842.mp3',
  },
  {
    id: 'amazing-grace',
    labelKey: 'amazingGrace',
    category: 'christmas',
    file: '/bgm/amazing-grace-of-christmas-11162.mp3',
  },
  {
    id: 'silent-night-orchestra',
    labelKey: 'silentNightOrchestra',
    category: 'christmas',
    file: '/bgm/silent-night-simon-folwar-main-version-44671-02-25.mp3',
  },
  {
    id: 'santas-treasure',
    labelKey: 'santasTreasure',
    category: 'christmas',
    file: '/bgm/santa-s-great-treasure-pecan-pie-main-version-44475-02-12.mp3',
  },
  {
    id: 'long-stroll',
    labelKey: 'longStroll',
    category: 'christmas',
    file: '/bgm/long-stroll-kevin-macleod-main-version-04-14-12959.mp3',
  },
]

export function getTracksByCategory(category: BgmCategory): BgmTrack[] {
  return BGM_TRACKS.filter(track => track.category === category)
}

// BGM Player class for MP3 playback
export class BgmPlayer {
  private audio: HTMLAudioElement | null = null
  private isPlaying = false
  private currentTrackId: string | null = null
  private volume = 0.3

  constructor() {
    if (typeof window !== 'undefined') {
      this.audio = new Audio()
      this.audio.loop = true
      this.audio.volume = this.volume
    }
  }

  setVolume(volume: number): void {
    this.volume = volume
    if (this.audio) {
      this.audio.volume = volume
    }
  }

  getVolume(): number {
    return this.volume
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying
  }

  getCurrentTrack(): string | null {
    return this.currentTrackId
  }

  async play(trackId: string): Promise<void> {
    if (!this.audio) return

    const track = BGM_TRACKS.find(t => t.id === trackId)
    if (!track) return

    // If same track, just resume
    if (this.currentTrackId === trackId && this.audio.paused) {
      await this.audio.play()
      this.isPlaying = true
      return
    }

    // Stop current and play new track
    this.stop()

    this.audio.src = track.file
    this.audio.volume = this.volume
    this.currentTrackId = trackId

    try {
      await this.audio.play()
      this.isPlaying = true
    } catch (error) {
      console.error('Failed to play audio:', error)
      this.isPlaying = false
    }
  }

  stop(): void {
    if (this.audio) {
      this.audio.pause()
      this.audio.currentTime = 0
    }
    this.isPlaying = false
    this.currentTrackId = null
  }

  pause(): void {
    if (this.audio) {
      this.audio.pause()
    }
    this.isPlaying = false
  }

  resume(): void {
    if (this.audio && this.currentTrackId) {
      this.audio.play()
      this.isPlaying = true
    }
  }

  destroy(): void {
    this.stop()
    if (this.audio) {
      this.audio.src = ''
      this.audio = null
    }
  }

  // Get current playback time in seconds
  getCurrentTime(): number {
    return this.audio?.currentTime ?? 0
  }

  // Get total duration in seconds
  getDuration(): number {
    return this.audio?.duration ?? 0
  }

  // Seek to a specific time
  seek(time: number): void {
    if (this.audio && !isNaN(this.audio.duration)) {
      this.audio.currentTime = Math.min(time, this.audio.duration)
    }
  }
}

// Singleton instance
let bgmPlayerInstance: BgmPlayer | null = null

export function getBgmPlayer(): BgmPlayer {
  if (!bgmPlayerInstance) {
    bgmPlayerInstance = new BgmPlayer()
  }
  return bgmPlayerInstance
}
