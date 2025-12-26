import { recordToHistory } from "./local-history"

const STORAGE_KEY = "pomobox_daily_stats"

interface LocalDailyStats {
  date: string // YYYY-MM-DD
  totalMinutes: number
  totalSessions: number
}

/**
 * 로컬 시간 기준 오늘 날짜 (YYYY-MM-DD)
 * 타임존 문제 방지를 위해 toISOString 대신 로컬 날짜 사용
 */
export function getLocalToday(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
}

// 내부용 alias
function getToday(): string {
  return getLocalToday()
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
 * 1분 단위 증분 저장 (세션 카운트는 증가 안함)
 * - Focus 세션 중 1분마다 호출
 */
export function incrementLocalMinutes(minutes: number = 1): LocalDailyStats {
  const current = getLocalTodayStats()
  const updated: LocalDailyStats = {
    date: getToday(),
    totalMinutes: current.totalMinutes + minutes,
    totalSessions: current.totalSessions, // 세션 카운트 유지
  }
  saveLocalTodayStats(updated)

  // 히스토리에도 기록 (대시보드용)
  recordToHistory(minutes)

  return updated
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
