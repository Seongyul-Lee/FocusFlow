"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react"
import { SettingsDialog, TimerSettings } from "./settings-dialog"

type TimerType = 'focus' | 'break'

const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25,
  breakDuration: 5,
  notificationsEnabled: false,
  soundEnabled: false,
  volume: 0,  // 0으로 변경
}

export function PomodoroTimer() {
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS)
  const [type, setType] = useState<TimerType>('focus')
  const [timeLeft, setTimeLeft] = useState(settings.focusDuration * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessions, setSessions] = useState(0)

  const duration = (type === 'focus' ? settings.focusDuration : settings.breakDuration) * 60
  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60

  const progress = ((duration - timeLeft) / duration) * 100
  const circumference = 2 * Math.PI * 140
  const [totalMinutes, setTotalMinutes] = useState(0)


  useEffect(() => {
    const savedMinutes = localStorage.getItem("pomodoro-total-minutes")
    // ... 날짜별 집계 로직
  }, [])
  
  // 설정 불러오기
  useEffect(() => {
    const savedSettings = localStorage.getItem("pomodoro-settings")
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      setSettings(parsed)
      setTimeLeft(parsed.focusDuration * 60)
    }
  }, [])

  // 세션 불러오기
  useEffect(() => {
    const savedSessions = localStorage.getItem("pomodoro-sessions")
    const savedDate = localStorage.getItem("pomodoro-date")
    const today = new Date().toDateString()

    if (savedDate === today && savedSessions) {
      setSessions(parseInt(savedSessions))
    } else {
      localStorage.setItem("pomodoro-date", today)
      localStorage.setItem("pomodoro-sessions", "0")
    }
  }, [])

  // 세션 저장
  useEffect(() => {
    localStorage.setItem("pomodoro-sessions", sessions.toString())
  }, [sessions])

  // 설정 변경 시 알림 권한 요청
  useEffect(() => {
    if (settings.notificationsEnabled && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [settings.notificationsEnabled])

  // 타이머 로직
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1)
      }, 1000)
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false)

      // 알림 및 사운드
      if (settings.notificationsEnabled && Notification.permission === "granted") {
        new Notification(type === 'focus' ? "Focus session complete!" : "Break time over!", {
          body: type === 'focus' ? "Time for a break" : "Ready for another session?",
          icon: "/icon.png"
        })
      }

      if (settings.soundEnabled) {
        const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUhELTKXh8bllHAU2jdXyz3YnBSp+zPDajzsIEViy6OyrWBUIQ5zd8sFuJAUwhM/x1YU5CBZnvezno1QTCkml4PG6aB4EOIzU8dF0KAYAAAA=")
        audio.play()
      }
      
      if (type === 'focus') {
        setSessions((prev) => prev + 1)
        setType('break')
        setTimeLeft(settings.breakDuration * 60)
      } else {
        setType('focus')
        setTimeLeft(settings.focusDuration * 60)
      }
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, timeLeft, type, settings])

  const handleStart = useCallback(() => setIsRunning(true), [])
  const handlePause = useCallback(() => setIsRunning(false), [])
  const handleReset = useCallback(() => {
    setIsRunning(false)
    setType('focus')
    setTimeLeft(settings.focusDuration * 60)
  }, [settings.focusDuration])

  const handleSkip = useCallback(() => {
    setIsRunning(false)
    if (type === 'focus') {
      setType('break')
      setTimeLeft(settings.breakDuration * 60)
    } else {
      setType('focus')
      setTimeLeft(settings.focusDuration * 60)
    }
  }, [type, settings])

  const handleSettingsChange = (newSettings: TimerSettings) => {
    setSettings(newSettings)
    localStorage.setItem("pomodoro-settings", JSON.stringify(newSettings))
    
    // 현재 타이머가 실행 중이 아니면 시간 초기화
    if (!isRunning) {
      if (type === 'focus') {
        setTimeLeft(newSettings.focusDuration * 60)
      } else {
        setTimeLeft(newSettings.breakDuration * 60)
      }
    }
  }

  return (
    <div className="relative flex flex-col items-center gap-8">
      <SettingsDialog settings={settings} onSettingsChange={handleSettingsChange} />

      <div className="text-center">
        <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1">
          {type === 'focus' ? 'Focus Session' : 'Break Time'}
        </p>
        <p className="text-xs text-muted-foreground">
          {type === 'focus' ? 'Stay focused on your work' : 'Take a short break'}
        </p>
      </div>

      <div className="relative flex items-center justify-center">
        <svg className="w-72 h-72 -rotate-90" viewBox="0 0 300 300">
          <circle cx="150" cy="150" r="140" fill="none" stroke="currentColor" strokeWidth="STROKE_WIDTH" className="text-muted" />
          <circle
            cx="150"
            cy="150"
            r="140"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (progress / 100) * circumference}
            className={`transition-all duration-1000 ease-linear ${type === 'focus' ? 'text-primary' : 'text-green-500'}`}
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
        Today: <span className="text-foreground">{sessions} sessions</span>
      </div>
    </div>
  )
}