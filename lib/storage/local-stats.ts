import { recordToHistory } from "./local-history"

const STORAGE_KEY = "pomobox_daily_stats"

interface LocalDailyStats {
  date: string // YYYY-MM-DD
  totalMinutes: number
  totalSessions: number
}

function getToday(): string {
  return new Date().toISOString().split("T")[0]
}

/**
 * localStorage에서 오늘 통계 조회
 */
export function getLocalTodayStats(): LocalDailyStats {
  if (typeof window === "undefined") {
    return { date: getToday(), totalMinutes: 0, totalSessions: 0 }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return { date: getToday(), totalMinutes: 0, totalSessions: 0 }
    }

    const stats: LocalDailyStats = JSON.parse(stored)

    // 날짜가 다르면 초기화 (새로운 날)
    if (stats.date !== getToday()) {
      return { date: getToday(), totalMinutes: 0, totalSessions: 0 }
    }

    return stats
  } catch {
    return { date: getToday(), totalMinutes: 0, totalSessions: 0 }
  }
}

/**
 * localStorage에 오늘 통계 저장
 */
export function saveLocalTodayStats(stats: LocalDailyStats): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
  } catch (error) {
    console.error("Failed to save local stats:", error)
  }
}

/**
 * 세션 완료 시 호출 - 통계 업데이트 + 히스토리 기록
 */
export function recordLocalSession(durationMinutes: number): LocalDailyStats {
  const current = getLocalTodayStats()
  const updated: LocalDailyStats = {
    date: getToday(),
    totalMinutes: current.totalMinutes + durationMinutes,
    totalSessions: current.totalSessions + 1,
  }
  saveLocalTodayStats(updated)

  // 히스토리에도 기록 (대시보드용)
  recordToHistory(durationMinutes)

  return updated
}

/**
 * localStorage 통계 초기화 (테스트/디버그용)
 */
export function clearLocalStats(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
}
