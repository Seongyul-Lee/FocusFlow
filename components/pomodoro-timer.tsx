"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react"
import { SettingsDialog, TimerSettings } from "./settings-dialog"
import { AdBanner } from "./ad-banner"
import { playSound } from "@/lib/sounds"

type TimerPhase = 'focus' | 'break' | 'longBreak'
type TimerStatus = 'idle' | 'running' | 'paused'

const TIMER_RADIUS = 140
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS

const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25,
  breakDuration: 5,
  notificationsEnabled: false,
  soundEnabled: true,
  soundCategory: 'melody',
  soundType: 'achievement',
  volume: 50,
}

export function PomodoroTimer() {
  const t = useTranslations("Timer")
  const searchParams = useSearchParams()

  // Test-only: ?testDuration=10 sets focus duration to 10 seconds
  const testDurationSec = searchParams.get('testDuration')
    ? parseInt(searchParams.get('testDuration')!, 10)
    : null

  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS)
  const [phase, setPhase] = useState<TimerPhase>('focus')
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60)
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [sessions, setSessions] = useState(0)
  const [completedSessions, setCompletedSessions] = useState(0)
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0)
  const [longBreakCount, setLongBreakCount] = useState(0)
  const [targetEndAtMs, setTargetEndAtMs] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const getDuration = () => {
    if (phase === 'focus') {
      // Test mode: use testDuration (in seconds) if provided
      if (testDurationSec !== null && testDurationSec > 0) {
        return testDurationSec
      }
      return settings.focusDuration * 60
    }
    if (phase === 'longBreak') return 15 * 60
    return settings.breakDuration * 60
  }

  // Initialize timeLeft when testDuration is provided
  useEffect(() => {
    if (testDurationSec !== null && testDurationSec > 0 && phase === 'focus' && status === 'idle') {
      setTimeLeft(testDurationSec)
    }
  }, [testDurationSec, phase, status])

  const duration = getDuration()
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const progress = ((duration - timeLeft) / duration) * 100
  const circumference = TIMER_CIRCUMFERENCE

  // Browser title update
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const title = phase === 'focus' ? 'Focus' : phase === 'longBreak' ? 'Long Break' : 'Break'
      document.title = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} - ${title}`
    }
  }, [timeLeft, phase, minutes, seconds])

  // Request notification permission
  useEffect(() => {
    if (settings.notificationsEnabled && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [settings.notificationsEnabled])

  // Initialize / clear target end time for time-based timer
  useEffect(() => {
    if (status === 'running' && targetEndAtMs === null) {
      setTargetEndAtMs(Date.now() + timeLeft * 1000)
      return
    }
    if (status !== 'running' && targetEndAtMs !== null) {
      setTargetEndAtMs(null)
    }
  }, [status, targetEndAtMs, timeLeft])

  // Tick: recompute remaining time from wall-clock (prevents background drift)
  useEffect(() => {
    if (status !== 'running' || targetEndAtMs === null) return

    const updateTimeLeft = () => {
      const remainingSeconds = Math.max(0, Math.ceil((targetEndAtMs - Date.now()) / 1000))
      setTimeLeft(remainingSeconds)
    }

    updateTimeLeft()
    const id = window.setInterval(updateTimeLeft, 1000)

    const handleVisibilityChange = () => {
      if (!document.hidden) updateTimeLeft()
    }
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.clearInterval(id)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [status, targetEndAtMs])

  // Phase transition when timer hits 0
  useEffect(() => {
    if (!(timeLeft === 0 && status === 'running')) return
    if (isTransitioning) return // Prevent duplicate transition

    setIsTransitioning(true)
    setStatus('idle')
    setTargetEndAtMs(null)

    // Notifications and sound
    if (settings.notificationsEnabled && Notification.permission === "granted") {
      const message = phase === 'focus'
        ? "Time for a break"
        : "Ready for another session?"
      new Notification(
        phase === 'focus' ? "Focus session complete!" : "Break time over!",
        { body: message, icon: "/icon.png" }
      )
    }

    if (settings.soundEnabled) {
      playSound(settings.soundType, settings.volume / 100)
    }

    if (phase === 'focus') {
      const newCompleted = completedSessions + 1
      setCompletedSessions(newCompleted)

      const newSessions = sessions + 1
      setSessions(newSessions)

      // Accumulate total focus time
      const newTotal = totalFocusMinutes + settings.focusDuration
      setTotalFocusMinutes(newTotal)

      // Long Break every 4 completed sessions (not skipped)
      if (newCompleted % 4 === 0) {
        setPhase('longBreak')
        setTimeLeft(15 * 60)
        setLongBreakCount(prev => prev + 1)
      } else {
        setPhase('break')
        setTimeLeft(settings.breakDuration * 60)
      }
    } else {
      setPhase('focus')
      const focusDuration = testDurationSec !== null && testDurationSec > 0
        ? testDurationSec
        : settings.focusDuration * 60
      setTimeLeft(focusDuration)
    }

    setIsTransitioning(false) // Reset flag after transition
  }, [timeLeft, status, phase, settings, completedSessions, totalFocusMinutes, sessions, isTransitioning, testDurationSec])

  const handleStart = useCallback(() => {
    if (isTransitioning) return
    setStatus('running')
  }, [isTransitioning])

  const handlePause = useCallback(() => {
    if (isTransitioning) return
    setStatus('paused')
    setTargetEndAtMs(null)
  }, [isTransitioning])

  const handleResume = useCallback(() => {
    if (isTransitioning) return
    setStatus('running')
  }, [isTransitioning])

  const handleReset = useCallback(() => {
    if (isTransitioning) return
    setStatus('idle')
    setTargetEndAtMs(null)
    setPhase('focus')
    const focusDuration = testDurationSec !== null && testDurationSec > 0
      ? testDurationSec
      : settings.focusDuration * 60
    setTimeLeft(focusDuration)
  }, [settings.focusDuration, isTransitioning, testDurationSec])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Ignore shortcuts in Input, Textarea, Dialog
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.closest('[role="dialog"]')
      ) {
        return
      }

      if (e.code === 'Space') {
        e.preventDefault()
        if (status === 'running') {
          handlePause()
        } else if (status === 'paused') {
          handleResume()
        } else {
          handleStart()
        }
      } else if (e.code === 'KeyR') {
        e.preventDefault()
        handleReset()
      } else if (e.code === 'Escape') {
        handlePause()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [status, handlePause, handleResume, handleStart, handleReset])

  const handleSkip = useCallback(() => {
    if (isTransitioning) return
    setStatus('idle')
    setTargetEndAtMs(null)
    if (phase === 'focus') {
      // Skip increments completedSessions but NOT sessions
      // Long Break is triggered only by completed Focus (not skipped)
      const newCompleted = completedSessions + 1
      setCompletedSessions(newCompleted)

      // Always go to Short Break when skipping Focus
      setPhase('break')
      setTimeLeft(settings.breakDuration * 60)
    } else {
      setPhase('focus')
      setTimeLeft(settings.focusDuration * 60)
    }
  }, [phase, settings, completedSessions, isTransitioning])

  const handleSettingsChange = (newSettings: TimerSettings) => {
    setSettings(newSettings)

    if (status !== 'running') {
      if (phase === 'focus') {
        setTimeLeft(newSettings.focusDuration * 60)
      } else if (phase === 'break') {
        setTimeLeft(newSettings.breakDuration * 60)
      }
    }
  }

  const getTypeLabel = () => {
    if (phase === 'focus') return t('focusSession')
    if (phase === 'longBreak') return t('longBreak')
    return t('breakTime')
  }

  const getTypeDescription = () => {
    if (phase === 'focus') return t('focusDescription')
    if (phase === 'longBreak') return t('longBreakDescription')
    return t('breakDescription')
  }

  return (
    <div className="relative flex flex-col items-center gap-8">
      <SettingsDialog
        settings={settings}
        isRunning={status === 'running'}
        onSettingsChange={handleSettingsChange}
      />

      <div className="text-center">
        <p className="text-lg font-bold text-foreground uppercase tracking-wider mb-1">
          {getTypeLabel()}
        </p>
        <p className="text-xs text-muted-foreground mb-2">
          {getTypeDescription()}
        </p>
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full transition-opacity duration-200 ${
          status === 'paused'
            ? 'bg-amber-500 opacity-100 visible'
            : 'opacity-0 invisible'
        }`}>
          <Pause className="h-3 w-3 text-white" />
          <span className="text-xs font-medium text-white uppercase tracking-wide">
            {t('paused')}
          </span>
        </div>
      </div>

      <div className="relative flex items-center justify-center">
        <svg className="w-64 h-64 sm:w-72 sm:h-72 -rotate-90" viewBox="0 0 300 300">
          <circle cx="150" cy="150" r={TIMER_RADIUS} fill="none" stroke="currentColor" strokeWidth="8" className="text-zinc-300 dark:text-zinc-700" />
          <circle
            cx="150"
            cy="150"
            r={TIMER_RADIUS}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={TIMER_CIRCUMFERENCE}
            strokeDashoffset={TIMER_CIRCUMFERENCE - (progress / 100) * TIMER_CIRCUMFERENCE}
            className={`transition-all duration-1000 ease-linear ${
              status === 'paused'
                ? 'text-amber-500'
                : phase === 'focus'
                ? 'text-primary'
                : phase === 'longBreak'
                ? 'text-blue-500'
                : 'text-green-500'
            }`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-6xl font-mono font-semibold tracking-tight text-foreground">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          {status === 'running' ? (
            <Button size="lg" onClick={handlePause} variant="secondary" className="gap-2 px-8 border-2 border-slate-400 dark:border-transparent">
              <Pause className="h-5 w-5" />
              {t('pause')}
            </Button>
          ) : status === 'paused' ? (
            <Button size="lg" onClick={handleResume} className="gap-2 px-8">
              <Play className="h-5 w-5" />
              {t('resume')}
            </Button>
          ) : (
            <Button size="lg" onClick={handleStart} className="gap-2 px-8">
              <Play className="h-5 w-5" />
              {t('start')}
            </Button>
          )}
          <Button size="lg" variant="outline" onClick={handleReset} aria-label="Reset timer">
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        <Button size="sm" variant="ghost" onClick={handleSkip} className="group gap-2 text-muted-foreground hover:text-foreground/60 border border-muted-foreground/30 rounded-xl hover:bg-muted/50 hover:scale-105 transition-all duration-200">
          <SkipForward className="h-4 w-4 drop-shadow-md transition-transform duration-200 group-hover:translate-x-0.5" />
          {phase === 'focus' ? t('skipToBreak') : t('backToFocus')}
        </Button>
      </div>

      <div className="text-muted-foreground text-sm font-medium">
        <span className="text-foreground">{t('today', { sessions, minutes: totalFocusMinutes })}</span>
      </div>

      {/* Ad Banner - Hidden until AdSense approval */}
      {/* <div className="w-full max-w-md mt-6">
        <AdBanner adSlot="YOUR_AD_SLOT_ID" adFormat="horizontal" />
      </div> */}

      <div className="mt-8 text-xs text-muted-foreground">
        <Link href="/privacy" className="hover:text-foreground hover:underline">
          {t('privacyPolicy')}
        </Link>
      </div>
    </div>
  )
}
