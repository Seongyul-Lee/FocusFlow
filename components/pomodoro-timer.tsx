"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react"
import { SettingsDialog, TimerSettings } from "./settings-dialog"

type TimerPhase = 'focus' | 'break' | 'longBreak'
type TimerStatus = 'idle' | 'running' | 'paused'

const TIMER_RADIUS = 140
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS

const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25,
  breakDuration: 5,
  notificationsEnabled: false,
  soundEnabled: false,
  volume: 0,
}

export function PomodoroTimer() {
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS)
  const [phase, setPhase] = useState<TimerPhase>('focus')
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60)
  const [status, setStatus] = useState<TimerStatus>('idle')
  const [sessions, setSessions] = useState(0)
  const [completedSessions, setCompletedSessions] = useState(0)
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0)
  const [targetEndAtMs, setTargetEndAtMs] = useState<number | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const getDuration = () => {
    if (phase === 'focus') return settings.focusDuration * 60
    if (phase === 'longBreak') return 15 * 60
    return settings.breakDuration * 60
  }

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

  // Load settings
  useEffect(() => {
    const savedSettings = localStorage.getItem("pomodoro-settings")
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      setSettings(parsed)
      setTimeLeft(parsed.focusDuration * 60)
    }
  }, [])

  // Load sessions & total time
  useEffect(() => {
    const savedSessions = localStorage.getItem("pomodoro-sessions")
    const savedMinutes = localStorage.getItem("pomodoro-total-minutes")
    const savedDate = localStorage.getItem("pomodoro-date")
    const today = new Date().toDateString()

    if (savedDate === today) {
      if (savedSessions) setSessions(parseInt(savedSessions))
      if (savedMinutes) setTotalFocusMinutes(parseInt(savedMinutes))
    } else {
      localStorage.setItem("pomodoro-date", today)
      localStorage.setItem("pomodoro-sessions", "0")
      localStorage.setItem("pomodoro-total-minutes", "0")
    }
  }, [])

  // Load timer state (rehydrate)
  useEffect(() => {
    const savedTimerState = localStorage.getItem("pomodoro-timer-state")
    if (!savedTimerState) return

    try {
      const parsed = JSON.parse(savedTimerState)

      // Validate required fields
      if (
        typeof parsed.version !== 'number' ||
        !parsed.phase ||
        !parsed.status ||
        typeof parsed.remainingSeconds !== 'number'
      ) {
        console.warn('Invalid timer state data, skipping rehydration')
        return
      }

      // Check if state is recent (within 24 hours)
      const MAX_AGE_MS = 24 * 60 * 60 * 1000
      const age = Date.now() - (parsed.lastUpdatedAtMs || 0)
      if (age > MAX_AGE_MS) {
        console.log('Timer state too old, skipping rehydration')
        return
      }

      // Rehydrate state
      setPhase(parsed.phase)
      setCompletedSessions(parsed.completedSessions || 0)

      // If status was 'running', calculate elapsed time and pause
      if (parsed.status === 'running' && parsed.targetEndAtMs) {
        const remainingMs = parsed.targetEndAtMs - Date.now()
        const adjustedRemaining = Math.max(0, Math.ceil(remainingMs / 1000))
        setTimeLeft(adjustedRemaining)
        setStatus('paused') // Pause instead of auto-resuming
      } else {
        // Restore paused or idle state as-is
        setStatus(parsed.status)
        setTimeLeft(parsed.remainingSeconds)
      }
    } catch (error) {
      console.error('Failed to parse timer state:', error)
      // Fallback: use default initialization
    }
  }, [])

  // Save sessions
  useEffect(() => {
    localStorage.setItem("pomodoro-sessions", sessions.toString())
  }, [sessions])

  // Save total time
  useEffect(() => {
    localStorage.setItem("pomodoro-total-minutes", totalFocusMinutes.toString())
  }, [totalFocusMinutes])

  // Save timer state (Phase 1: save only, Phase 3: load & rehydrate)
  useEffect(() => {
    const timerState = {
      version: 1,
      phase,
      status,
      remainingSeconds: timeLeft,
      targetEndAtMs,
      completedSessions,
      longBreakCount: 0, // TODO: track in future
      lastUpdatedAtMs: Date.now()
    }
    localStorage.setItem("pomodoro-timer-state", JSON.stringify(timerState))
  }, [phase, status, timeLeft, targetEndAtMs, completedSessions])

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
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUhELTKXh8bllHAU2jdXyz3YnBSp+zPDajzsIEViy6OyrWBUIQ5zd8sFuJAUwhM/x1YU5CBZnvezno1QTCkml4PG6aB4EOIzU8dF0KAYAAAA=")
      audio.volume = settings.volume / 100
      audio.play()
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
      if (newSessions % 4 === 0) {
        setPhase('longBreak')
        setTimeLeft(15 * 60)
      } else {
        setPhase('break')
        setTimeLeft(settings.breakDuration * 60)
      }
    } else {
      setPhase('focus')
      setTimeLeft(settings.focusDuration * 60)
    }

    setIsTransitioning(false) // Reset flag after transition
  }, [timeLeft, status, phase, settings, completedSessions, totalFocusMinutes, sessions, isTransitioning])

  const handleStart = useCallback(() => setStatus('running'), [])
  const handlePause = useCallback(() => {
    setStatus('paused')
    setTargetEndAtMs(null)
  }, [])
  const handleResume = useCallback(() => setStatus('running'), [])
  const handleReset = useCallback(() => {
    setStatus('idle')
    setTargetEndAtMs(null)
    setPhase('focus')
    setTimeLeft(settings.focusDuration * 60)
  }, [settings.focusDuration])

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
  }, [phase, settings, completedSessions])

  const handleSettingsChange = (newSettings: TimerSettings) => {
    setSettings(newSettings)
    localStorage.setItem("pomodoro-settings", JSON.stringify(newSettings))

    if (status !== 'running') {
      if (phase === 'focus') {
        setTimeLeft(newSettings.focusDuration * 60)
      } else if (phase === 'break') {
        setTimeLeft(newSettings.breakDuration * 60)
      }
    }
  }

  const getTypeLabel = () => {
    if (phase === 'focus') return 'Focus Session'
    if (phase === 'longBreak') return 'Long Break'
    return 'Break Time'
  }

  const getTypeDescription = () => {
    if (phase === 'focus') return 'Stay focused on your work'
    if (phase === 'longBreak') return 'Take a longer break - you earned it!'
    return 'Take a short break'
  }

  return (
    <div className="relative flex flex-col items-center gap-8">
      <SettingsDialog
        settings={settings}
        isRunning={status === 'running'}
        onSettingsChange={handleSettingsChange}
      />

      <div className="text-center">
        <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
          {getTypeLabel()}
        </p>
        <p className="text-xs text-muted-foreground mb-2">
          {getTypeDescription()}
        </p>
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full transition-opacity duration-200 ${
          status === 'paused'
            ? 'bg-yellow-100 dark:bg-yellow-900/30 opacity-100 visible'
            : 'opacity-0 invisible'
        }`}>
          <Pause className="h-3 w-3 text-yellow-700 dark:text-yellow-500" />
          <span className="text-xs font-medium text-yellow-700 dark:text-yellow-500 uppercase tracking-wide">
            Paused
          </span>
        </div>
      </div>

      <div className="relative flex items-center justify-center">
        <svg className="w-64 h-64 sm:w-72 sm:h-72 -rotate-90" viewBox="0 0 300 300">
          <circle cx="150" cy="150" r={TIMER_RADIUS} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted" />
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
                ? 'text-yellow-500 dark:text-yellow-600'
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
            <Button size="lg" onClick={handlePause} variant="secondary" className="gap-2 px-8">
              <Pause className="h-5 w-5" />
              Pause
            </Button>
          ) : status === 'paused' ? (
            <Button size="lg" onClick={handleResume} className="gap-2 px-8">
              <Play className="h-5 w-5" />
              Resume
            </Button>
          ) : (
            <Button size="lg" onClick={handleStart} className="gap-2 px-8">
              <Play className="h-5 w-5" />
              Start
            </Button>
          )}
          <Button size="lg" variant="outline" onClick={handleReset} aria-label="Reset timer">
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        <Button size="sm" variant="ghost" onClick={handleSkip} className="gap-2 text-muted-foreground hover:text-foreground">
          <SkipForward className="h-4 w-4" />
          {phase === 'focus' ? 'Skip to Break' : 'Skip Break'}
        </Button>
      </div>

      <div className="text-muted-foreground text-sm font-medium">
        Today: <span className="text-foreground">{sessions} sessions ({totalFocusMinutes} min)</span>
      </div>
    </div>
  )
}
