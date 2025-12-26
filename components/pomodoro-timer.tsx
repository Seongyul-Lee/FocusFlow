"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Play, Pause, RotateCcw, SkipForward } from "lucide-react"
import { SettingsDialog, TimerSettings } from "./settings-dialog"
import { playSound } from "@/lib/sounds"
import { useUser } from "@/hooks/use-user"
import { recordSessionComplete } from "@/lib/supabase/stats"
import { getLocalTodayStats, recordLocalSession } from "@/lib/storage/local-stats"
import { getLocalSettings, saveLocalSettings, DEFAULT_SETTINGS } from "@/lib/storage/local-settings"
import { GoalProgress } from "./goal-progress"
import { useTimerContext } from "@/contexts/timer-context"
import confetti from "canvas-confetti"

type TimerPhase = 'focus' | 'break' | 'longBreak'
type TimerStatus = 'idle' | 'running' | 'paused'

const TIMER_RADIUS = 140
const TIMER_CIRCUMFERENCE = 2 * Math.PI * TIMER_RADIUS

export function PomodoroTimer() {
  const t = useTranslations("Timer")
  const searchParams = useSearchParams()
  const { user } = useUser()
  const timerContext = useTimerContext()

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

  // Focus 세션 시작 시간 (경과 시간 계산용)
  const focusSessionStartRef = useRef<number | null>(null)

  // localStorage에서 설정 및 오늘 통계 복원
  useEffect(() => {
    const savedSettings = getLocalSettings()
    setSettings(savedSettings)
    setTimeLeft(savedSettings.focusDuration * 60)

    const localStats = getLocalTodayStats()
    setTotalFocusMinutes(localStats.totalMinutes)
    setSessions(localStats.totalSessions)
  }, [])

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
      const title = phase === 'focus' ? 'Pomobox' : phase === 'longBreak' ? 'Long Break' : 'Break'
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

      // localStorage에 세션 기록 (모든 사용자)
      recordLocalSession(settings.focusDuration)

      // 목표 달성 시 confetti 애니메이션
      if (totalFocusMinutes < settings.dailyGoal && newTotal >= settings.dailyGoal) {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        })
      }

      // 로그인 사용자: Supabase에 세션 저장
      if (user) {
        recordSessionComplete(user.id, settings.focusDuration)
      }

      // Context 업데이트: Focus 완료 → 휴식으로 전환
      timerContext.stopSession()
      focusSessionStartRef.current = null
      timerContext.setFocusPhase(false)

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
      // 휴식 완료 → Focus로 전환
      setPhase('focus')
      timerContext.setFocusPhase(true)

      const focusDuration = testDurationSec !== null && testDurationSec > 0
        ? testDurationSec
        : settings.focusDuration * 60
      setTimeLeft(focusDuration)
    }

    setIsTransitioning(false) // Reset flag after transition
  }, [timeLeft, status, phase, settings, completedSessions, totalFocusMinutes, sessions, isTransitioning, testDurationSec, user, timerContext])

  const handleStart = useCallback(() => {
    if (isTransitioning) return
    setStatus('running')

    // Focus 세션 시작 시 Context 및 시작 시간 설정
    if (phase === 'focus') {
      focusSessionStartRef.current = Date.now()
      timerContext.startFocusSession()
    }
  }, [isTransitioning, phase, timerContext])

  const handlePause = useCallback(() => {
    if (isTransitioning) return
    setStatus('paused')
    setTargetEndAtMs(null)

    // Context 업데이트 (일시정지)
    if (phase === 'focus') {
      timerContext.pauseSession()
    }
  }, [isTransitioning, phase, timerContext])

  const handleResume = useCallback(() => {
    if (isTransitioning) return
    setStatus('running')

    // Context 업데이트 (재개)
    if (phase === 'focus') {
      timerContext.resumeSession()
    }
  }, [isTransitioning, phase, timerContext])

  const handleReset = useCallback(() => {
    if (isTransitioning) return

    // Focus 세션 중 Reset 시 경과 시간 저장
    if (phase === 'focus' && focusSessionStartRef.current !== null) {
      const elapsedMs = Date.now() - focusSessionStartRef.current
      const elapsedMinutes = Math.floor(elapsedMs / 60000)

      // 1분 이상 경과한 경우에만 저장
      if (elapsedMinutes >= 1) {
        // 로컬 통계 업데이트
        setTotalFocusMinutes((prev) => prev + elapsedMinutes)

        // localStorage에 저장 (모든 사용자)
        recordLocalSession(elapsedMinutes)

        // 로그인 사용자: Supabase에도 저장
        if (user) {
          recordSessionComplete(user.id, elapsedMinutes)
        }
      }
    }

    // Context 및 ref 초기화
    timerContext.stopSession()
    focusSessionStartRef.current = null

    setStatus('idle')
    setTargetEndAtMs(null)
    setPhase('focus')
    timerContext.setFocusPhase(true)

    const focusDuration = testDurationSec !== null && testDurationSec > 0
      ? testDurationSec
      : settings.focusDuration * 60
    setTimeLeft(focusDuration)
  }, [settings.focusDuration, isTransitioning, testDurationSec, phase, user, timerContext])

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
      } else if (e.code === 'Escape') {
        handlePause()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [status, handlePause, handleResume, handleStart])

  const handleSkip = useCallback(() => {
    if (isTransitioning) return

    // Focus 세션 스킵 시 경과 시간 저장
    if (phase === 'focus' && focusSessionStartRef.current !== null) {
      const elapsedMs = Date.now() - focusSessionStartRef.current
      const elapsedMinutes = Math.floor(elapsedMs / 60000)

      // 1분 이상 경과한 경우에만 저장
      if (elapsedMinutes >= 1) {
        setTotalFocusMinutes((prev) => prev + elapsedMinutes)
        recordLocalSession(elapsedMinutes)

        if (user) {
          recordSessionComplete(user.id, elapsedMinutes)
        }
      }
    }

    setStatus('idle')
    setTargetEndAtMs(null)

    if (phase === 'focus') {
      // Skip increments completedSessions but NOT sessions
      // Long Break is triggered only by completed Focus (not skipped)
      const newCompleted = completedSessions + 1
      setCompletedSessions(newCompleted)

      // Context 업데이트: Focus → 휴식
      timerContext.stopSession()
      focusSessionStartRef.current = null
      timerContext.setFocusPhase(false)

      // Always go to Short Break when skipping Focus
      setPhase('break')
      setTimeLeft(settings.breakDuration * 60)
    } else {
      // 휴식 → Focus로 전환
      timerContext.setFocusPhase(true)
      setPhase('focus')
      setTimeLeft(settings.focusDuration * 60)
    }
  }, [phase, settings, completedSessions, isTransitioning, user, timerContext])

  const handleSettingsChange = (newSettings: TimerSettings) => {
    setSettings(newSettings)
    saveLocalSettings(newSettings)

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
      <div className="absolute top-4 right-4">
        <SettingsDialog
          settings={settings}
          isRunning={status === 'running'}
          onSettingsChange={handleSettingsChange}
          buttonClassName="hover-rotate-settings"
        />
      </div>

      <div className="text-center">
        <p className="text-lg font-bold text-foreground uppercase tracking-wider mb-1 hover-title-outline">
          {getTypeLabel()}
        </p>
        <p className="text-xs text-muted-foreground mb-2 hover-phase-label">
          {getTypeDescription()}
        </p>
        <div
          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full transition-opacity duration-200 ${
            status === 'paused'
              ? 'bg-amber-500 opacity-100 visible animate-pulse'
              : 'opacity-0 invisible'
          }`}
          role="status"
          aria-live="polite"
        >
          <Pause className="h-3 w-3 text-white" />
          <span className="text-xs font-medium text-white uppercase tracking-wide">
            {status === 'paused' ? t('paused') : ''}
          </span>
        </div>
      </div>

      <div className="relative flex items-center justify-center group">
        <svg className="w-64 h-64 sm:w-72 sm:h-72 -rotate-90 hover-ring" viewBox="0 0 300 300">
          <circle cx="150" cy="150" r={TIMER_RADIUS} fill="none" stroke="currentColor" strokeWidth="8" className="text-muted dark:text-white/10 transition-all duration-300" />
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
            className={`transition-all duration-1000 ease-linear group-hover:stroke-[10] ${
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
          <span className="text-6xl font-mono font-semibold tracking-tight text-foreground hover-timer-display">
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          {status === 'running' ? (
            <Button size="lg" onClick={handlePause} variant="secondary" className="gap-2 px-8 border-2 border-border dark:border-transparent hover:scale-105 transition-transform duration-200">
              <Pause className="h-5 w-5" />
              {t('pause')}
            </Button>
          ) : status === 'paused' ? (
            <Button size="lg" onClick={handleResume} className="gap-2 px-8 glow-primary hover-glow hover-shine">
              <Play className="h-5 w-5" />
              {t('resume')}
            </Button>
          ) : (
            <Button size="lg" onClick={handleStart} className="gap-2 px-8 glow-primary hover-glow hover-shine">
              <Play className="h-5 w-5" />
              {t('start')}
            </Button>
          )}
          <Button size="lg" variant="outline" onClick={handleReset} aria-label="Reset timer" className="hover:scale-105 hover:bg-muted/50 transition-all duration-200">
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        <Button size="sm" variant="ghost" onClick={handleSkip} className="group gap-2 text-muted-foreground hover:text-foreground/60 border border-muted-foreground/30 rounded-xl hover:bg-muted/50 hover:scale-105 transition-all duration-200">
          <SkipForward className="h-4 w-4 drop-shadow-md transition-transform duration-200 group-hover:translate-x-0.5" />
          {phase === 'focus' ? t('skipToBreak') : t('backToFocus')}
        </Button>
      </div>

      <div className="text-muted-foreground text-sm font-medium hover-today-stats">
        <span className="text-foreground">{t('today', { sessions, minutes: totalFocusMinutes })}</span>
      </div>

      <GoalProgress
        currentMinutes={totalFocusMinutes}
        goalMinutes={settings.dailyGoal}
      />

    </div>
  )
}
