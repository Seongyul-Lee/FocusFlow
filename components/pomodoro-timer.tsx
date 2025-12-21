"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react"
import { SettingsDialog, TimerSettings } from "./settings-dialog"

type TimerType = 'focus' | 'break' | 'longBreak'

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
  const [type, setType] = useState<TimerType>('focus')
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessions, setSessions] = useState(0)
  const [completedSessions, setCompletedSessions] = useState(0)
  const [totalFocusMinutes, setTotalFocusMinutes] = useState(0)
  const [targetEndAtMs, setTargetEndAtMs] = useState<number | null>(null)

  const getDuration = () => {
    if (type === 'focus') return settings.focusDuration * 60
    if (type === 'longBreak') return 15 * 60
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
      const title = type === 'focus' ? 'Focus' : type === 'longBreak' ? 'Long Break' : 'Break'
      document.title = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} - ${title}`
    }
  }, [timeLeft, type, minutes, seconds])

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

  // Save sessions
  useEffect(() => {
    localStorage.setItem("pomodoro-sessions", sessions.toString())
  }, [sessions])

  // Save total time
  useEffect(() => {
    localStorage.setItem("pomodoro-total-minutes", totalFocusMinutes.toString())
  }, [totalFocusMinutes])

  // Request notification permission
  useEffect(() => {
    if (settings.notificationsEnabled && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [settings.notificationsEnabled])

  // Initialize / clear target end time for time-based timer
  useEffect(() => {
    if (isRunning && targetEndAtMs === null) {
      setTargetEndAtMs(Date.now() + timeLeft * 1000)
      return
    }
    if (!isRunning && targetEndAtMs !== null) {
      setTargetEndAtMs(null)
    }
  }, [isRunning, targetEndAtMs])

  // Tick: recompute remaining time from wall-clock (prevents background drift)
  useEffect(() => {
    if (!isRunning || targetEndAtMs === null) return

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
  }, [isRunning, targetEndAtMs])

  // Phase transition when timer hits 0
  useEffect(() => {
    if (!(timeLeft === 0 && isRunning)) return

    setIsRunning(false)
    setTargetEndAtMs(null)

    // Notifications and sound
    if (settings.notificationsEnabled && Notification.permission === "granted") {
      const message = type === 'focus'
        ? "Time for a break"
        : "Ready for another session?"
      new Notification(
        type === 'focus' ? "Focus session complete!" : "Break time over!",
        { body: message, icon: "/icon.png" }
      )
    }

    if (settings.soundEnabled) {
      const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUhELTKXh8bllHAU2jdXyz3YnBSp+zPDajzsIEViy6OyrWBUIQ5zd8sFuJAUwhM/x1YU5CBZnvezno1QTCkml4PG6aB4EOIzU8dF0KAYAAAA=")
      audio.volume = settings.volume / 100
      audio.play()
    }

    if (type === 'focus') {
      const newCompleted = completedSessions + 1
      setCompletedSessions(newCompleted)
      setSessions((prev) => prev + 1)

      // Accumulate total focus time
      const newTotal = totalFocusMinutes + settings.focusDuration
      setTotalFocusMinutes(newTotal)

      // Long Break every 4 sessions
      if (newCompleted % 4 === 0) {
        setType('longBreak')
        setTimeLeft(15 * 60)
      } else {
        setType('break')
        setTimeLeft(settings.breakDuration * 60)
      }
    } else {
      setType('focus')
      setTimeLeft(settings.focusDuration * 60)
    }
  }, [timeLeft, isRunning, type, settings, completedSessions, totalFocusMinutes])

  const handleStart = useCallback(() => setIsRunning(true), [])
  const handlePause = useCallback(() => {
    setIsRunning(false)
    setTargetEndAtMs(null)
  }, [])
  const handleReset = useCallback(() => {
    setIsRunning(false)
    setTargetEndAtMs(null)
    setType('focus')
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
        isRunning ? handlePause() : handleStart()
      } else if (e.code === 'KeyR') {
        e.preventDefault()
        handleReset()
      } else if (e.code === 'Escape') {
        handlePause()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isRunning, handlePause, handleStart, handleReset])

  const handleSkip = useCallback(() => {
    setIsRunning(false)
    setTargetEndAtMs(null)
    if (type === 'focus') {
      const newCompleted = completedSessions + 1
      setCompletedSessions(newCompleted)

      if (newCompleted % 4 === 0) {
        setType('longBreak')
        setTimeLeft(15 * 60)
      } else {
        setType('break')
        setTimeLeft(settings.breakDuration * 60)
      }
    } else {
      setType('focus')
      setTimeLeft(settings.focusDuration * 60)
    }
  }, [type, settings, completedSessions])

  const handleSettingsChange = (newSettings: TimerSettings) => {
    setSettings(newSettings)
    localStorage.setItem("pomodoro-settings", JSON.stringify(newSettings))

    if (!isRunning) {
      if (type === 'focus') {
        setTimeLeft(newSettings.focusDuration * 60)
      } else if (type === 'break') {
        setTimeLeft(newSettings.breakDuration * 60)
      }
    }
  }

  const getTypeLabel = () => {
    if (type === 'focus') return 'Focus Session'
    if (type === 'longBreak') return 'Long Break'
    return 'Break Time'
  }

  const getTypeDescription = () => {
    if (type === 'focus') return 'Stay focused on your work'
    if (type === 'longBreak') return 'Take a longer break - you earned it!'
    return 'Take a short break'
  }

  return (
    <div className="relative flex flex-col items-center gap-8">
      <SettingsDialog
        settings={settings}
        isRunning={isRunning}
        onSettingsChange={handleSettingsChange}
      />

      <div className="text-center">
        <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
          {getTypeLabel()}
        </p>
        <p className="text-xs text-muted-foreground">
          {getTypeDescription()}
        </p>
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
              type === 'focus' ? 'text-primary' : type === 'longBreak' ? 'text-blue-500' : 'text-green-500'
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
          {!isRunning ? (
            <Button size="lg" onClick={handleStart} className="gap-2 px-8">
              <Play className="h-5 w-5" />
              Start
            </Button>
          ) : (
            <Button size="lg" onClick={handlePause} variant="secondary" className="gap-2 px-8">
              <Pause className="h-5 w-5" />
              Pause
            </Button>
          )}
          <Button size="lg" variant="outline" onClick={handleReset}>
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        <Button size="sm" variant="ghost" onClick={handleSkip} className="gap-2 text-muted-foreground hover:text-foreground">
          <SkipForward className="h-4 w-4" />
          {type === 'focus' ? 'Skip to Break' : 'Skip Break'}
        </Button>
      </div>

      <div className="text-muted-foreground text-sm font-medium">
        Today: <span className="text-foreground">{sessions} sessions ({totalFocusMinutes} min)</span>
      </div>
    </div>
  )
}
