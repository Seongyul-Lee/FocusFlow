"use client"

import { createContext, useContext, useState, useCallback, ReactNode } from "react"

interface TimerContextValue {
  // 타이머 상태
  isRunning: boolean
  isFocusPhase: boolean
  sessionStartTime: number | null // timestamp (ms) - Focus 세션 시작 시간

  // 상태 업데이트 함수
  startFocusSession: () => void
  pauseSession: () => void
  resumeSession: () => void
  stopSession: () => void
  setFocusPhase: (isFocus: boolean) => void
}

const TimerContext = createContext<TimerContextValue | null>(null)

export function TimerProvider({ children }: { children: ReactNode }) {
  const [isRunning, setIsRunning] = useState(false)
  const [isFocusPhase, setIsFocusPhase] = useState(true)
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null)
  const [pausedElapsedMs, setPausedElapsedMs] = useState(0) // 일시정지 시 누적 시간

  const startFocusSession = useCallback(() => {
    if (isFocusPhase) {
      setSessionStartTime(Date.now() - pausedElapsedMs)
    }
    setIsRunning(true)
  }, [isFocusPhase, pausedElapsedMs])

  const pauseSession = useCallback(() => {
    if (isRunning && sessionStartTime !== null) {
      // 일시정지 시 경과 시간 저장
      setPausedElapsedMs(Date.now() - sessionStartTime)
    }
    setIsRunning(false)
  }, [isRunning, sessionStartTime])

  const resumeSession = useCallback(() => {
    if (isFocusPhase && pausedElapsedMs > 0) {
      // 일시정지 후 재개: 시작 시간을 조정하여 경과 시간 유지
      setSessionStartTime(Date.now() - pausedElapsedMs)
    }
    setIsRunning(true)
  }, [isFocusPhase, pausedElapsedMs])

  const stopSession = useCallback(() => {
    setIsRunning(false)
    setSessionStartTime(null)
    setPausedElapsedMs(0)
  }, [])

  const setFocusPhase = useCallback((isFocus: boolean) => {
    setIsFocusPhase(isFocus)
    if (!isFocus) {
      // 휴식 페이즈로 전환 시 Focus 시간 추적 중지
      setSessionStartTime(null)
      setPausedElapsedMs(0)
    }
  }, [])

  return (
    <TimerContext.Provider
      value={{
        isRunning,
        isFocusPhase,
        sessionStartTime,
        startFocusSession,
        pauseSession,
        resumeSession,
        stopSession,
        setFocusPhase,
      }}
    >
      {children}
    </TimerContext.Provider>
  )
}

export function useTimerContext() {
  const context = useContext(TimerContext)
  if (!context) {
    throw new Error("useTimerContext must be used within TimerProvider")
  }
  return context
}

// Optional hook - Context 없이도 동작하도록 (Provider 외부에서 사용 시)
export function useTimerContextSafe() {
  return useContext(TimerContext)
}
