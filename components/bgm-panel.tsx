"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent } from "@/components/ui/card"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  List,
  Volume2,
  VolumeX,
  Music,
} from "lucide-react"
import { BGM_TRACKS, getBgmPlayer, type BgmTrack } from "@/lib/bgm"

export function BgmPanel() {
  const t = useTranslations("Bgm")
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [volume, setVolume] = useState(30)
  const [isMuted, setIsMuted] = useState(false)
  const [isShuffled, setIsShuffled] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showVolume, setShowVolume] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const player = typeof window !== "undefined" ? getBgmPlayer() : null
  const currentTrack = BGM_TRACKS[currentTrackIndex]

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "00:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  // Sync time with actual audio
  useEffect(() => {
    if (isPlaying && player) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(player.getCurrentTime())
        const dur = player.getDuration()
        if (dur && !isNaN(dur)) {
          setDuration(dur)
        }
      }, 500)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isPlaying, player])

  // Sync with player on mount
  useEffect(() => {
    if (player) {
      setIsPlaying(player.isCurrentlyPlaying())
      const current = player.getCurrentTrack()
      if (current) {
        const idx = BGM_TRACKS.findIndex((t) => t.id === current)
        if (idx >= 0) setCurrentTrackIndex(idx)
      }
    }
  }, [player])

  const playTrack = useCallback(
    (index: number) => {
      if (!player) return
      const track = BGM_TRACKS[index]
      player.setVolume(isMuted ? 0 : volume / 100)
      player.play(track.id)
      setCurrentTrackIndex(index)
      setIsPlaying(true)
      setCurrentTime(0)
    },
    [player, volume, isMuted]
  )

  const handlePlayPause = useCallback(() => {
    if (!player) return

    if (isPlaying) {
      player.pause()
      setIsPlaying(false)
    } else {
      playTrack(currentTrackIndex)
    }
  }, [player, isPlaying, currentTrackIndex, playTrack])

  const handlePrevious = useCallback(() => {
    if (currentTime > 3) {
      // If more than 3 seconds in, restart current track
      if (player) player.seek(0)
      setCurrentTime(0)
    } else {
      // Go to previous track
      const newIndex =
        currentTrackIndex === 0
          ? BGM_TRACKS.length - 1
          : currentTrackIndex - 1
      if (isPlaying) {
        playTrack(newIndex)
      } else {
        setCurrentTrackIndex(newIndex)
        setCurrentTime(0)
      }
    }
  }, [currentTime, currentTrackIndex, isPlaying, playTrack, player])

  const handleNext = useCallback(() => {
    let newIndex: number
    if (isShuffled) {
      // Random track (excluding current)
      do {
        newIndex = Math.floor(Math.random() * BGM_TRACKS.length)
      } while (newIndex === currentTrackIndex && BGM_TRACKS.length > 1)
    } else {
      newIndex = (currentTrackIndex + 1) % BGM_TRACKS.length
    }

    if (isPlaying) {
      playTrack(newIndex)
    } else {
      setCurrentTrackIndex(newIndex)
      setCurrentTime(0)
    }
  }, [isShuffled, currentTrackIndex, isPlaying, playTrack])

  const handleShuffle = useCallback(() => {
    setIsShuffled((prev) => !prev)
  }, [])

  const handleSeek = useCallback((values: number[]) => {
    if (player) {
      player.seek(values[0])
      setCurrentTime(values[0])
    }
  }, [player])

  const handleVolumeChange = useCallback(
    (values: number[]) => {
      const newVolume = values[0]
      setVolume(newVolume)
      setIsMuted(newVolume === 0)
      if (player) {
        player.setVolume(newVolume / 100)
      }
    },
    [player]
  )

  const handleMuteToggle = useCallback(() => {
    if (!player) return

    if (isMuted) {
      setIsMuted(false)
      player.setVolume(volume / 100)
    } else {
      setIsMuted(true)
      player.setVolume(0)
    }
  }, [player, isMuted, volume])

  const handleSelectTrack = useCallback(
    (track: BgmTrack) => {
      const index = BGM_TRACKS.findIndex((t) => t.id === track.id)
      if (index >= 0) {
        if (isPlaying) {
          playTrack(index)
        } else {
          setCurrentTrackIndex(index)
          setCurrentTime(0)
        }
      }
    },
    [isPlaying, playTrack]
  )

  // Get category label
  const getCategoryLabel = (category: string) => {
    if (category === 'lofi') return t('categoryLofi')
    if (category === 'christmas') return t('categoryChristmas')
    return category
  }

  return (
    <Card className="w-full glass-card border-0">
      <CardContent className="pt-0.5 pb-3 px-3 space-y-2.5">
        {/* Track Info */}
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-primary/10">
            <Music className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {t(currentTrack.labelKey)}
            </p>
            <p className="text-xs text-muted-foreground">
              {getCategoryLabel(currentTrack.category)}
            </p>
          </div>
          {/* Volume Control */}
          <Popover open={showVolume} onOpenChange={setShowVolume}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-3" align="end">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={handleMuteToggle}
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="h-3 w-3" />
                  ) : (
                    <Volume2 className="h-3 w-3" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-muted-foreground w-7 text-right">
                  {isMuted ? 0 : volume}
                </span>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Progress Bar */}
        <div className="space-y-0.5">
          <Slider
            value={[currentTime]}
            onValueChange={handleSeek}
            max={duration || 100}
            step={1}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-between">
          {/* Shuffle */}
          <Button
            variant="ghost"
            size="icon"
            className={`h-7 w-7 ${isShuffled ? "text-primary" : "text-muted-foreground"}`}
            onClick={handleShuffle}
          >
            <Shuffle className="h-4 w-4" />
          </Button>

          {/* Center Controls: Previous / Play / Next */}
          <div className="flex items-center gap-5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handlePrevious}
            >
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button
              size="icon"
              className="h-10 w-10 rounded-full glow-primary"
              onClick={handlePlayPause}
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4 ml-0.5" />
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleNext}
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Playlist */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <List className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="end">
              <div className="space-y-1">
                {BGM_TRACKS.map((track) => (
                  <button
                    key={track.id}
                    onClick={() => handleSelectTrack(track)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left text-xs transition-colors ${
                      track.id === currentTrack.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    {track.id === currentTrack.id && isPlaying ? (
                      <span className="w-3.5 h-3.5 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                      </span>
                    ) : (
                      <Music className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                    <span className="truncate">{t(track.labelKey)}</span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>
  )
}
