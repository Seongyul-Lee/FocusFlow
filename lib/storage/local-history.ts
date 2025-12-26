const HISTORY_KEY = "pomobox_history"
const MAX_DAYS = 365 // 최대 1년 데이터 보관

export interface DayRecord {
  date: string // YYYY-MM-DD
  totalMinutes: number
  totalSessions: number
}

/**
 * 히스토리 데이터 전체 조회
 */
export function getLocalHistory(): DayRecord[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(HISTORY_KEY)
    if (!stored) return []
    return JSON.parse(stored) as DayRecord[]
  } catch {
    return []
  }
}

/**
 * 히스토리 데이터 저장
 */
function saveLocalHistory(history: DayRecord[]): void {
  if (typeof window === "undefined") return

  // MAX_DAYS 초과 시 오래된 데이터 삭제
  const trimmed = history.slice(-MAX_DAYS)

  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed))
  } catch (error) {
    console.error("Failed to save history:", error)
  }
}

/**
 * 오늘 기록 추가/업데이트
 */
export function recordToHistory(minutes: number): void {
  const today = new Date().toISOString().split("T")[0]
  const history = getLocalHistory()

  const existingIndex = history.findIndex((r) => r.date === today)

  if (existingIndex >= 0) {
    history[existingIndex].totalMinutes += minutes
    history[existingIndex].totalSessions += 1
  } else {
    history.push({
      date: today,
      totalMinutes: minutes,
      totalSessions: 1,
    })
  }

  saveLocalHistory(history)
}

/**
 * 최근 N일 데이터 조회 (빈 날짜는 0으로 채움)
 */
export function getRecentDays(days: number): DayRecord[] {
  const history = getLocalHistory()
  const result: DayRecord[] = []
  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]

    const existing = history.find((r) => r.date === dateStr)
    result.push(
      existing || {
        date: dateStr,
        totalMinutes: 0,
        totalSessions: 0,
      }
    )
  }

  return result
}

/**
 * 이번 달 데이터 조회
 */
export function getCurrentMonthData(): DayRecord[] {
  const history = getLocalHistory()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  // 이번 달 1일부터 오늘까지
  const firstDay = new Date(year, month, 1)
  const result: DayRecord[] = []

  for (let d = new Date(firstDay); d <= now; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0]
    const existing = history.find((r) => r.date === dateStr)
    result.push(
      existing || {
        date: dateStr,
        totalMinutes: 0,
        totalSessions: 0,
      }
    )
  }

  return result
}

/**
 * 지난주 데이터 조회 (7일 전 ~ 14일 전)
 */
export function getLastWeekData(): DayRecord[] {
  const history = getLocalHistory()
  const result: DayRecord[] = []
  const today = new Date()

  for (let i = 7; i <= 13; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]

    const existing = history.find((r) => r.date === dateStr)
    result.push(
      existing || {
        date: dateStr,
        totalMinutes: 0,
        totalSessions: 0,
      }
    )
  }

  return result
}

/**
 * 전월 데이터 조회
 */
export function getPreviousMonthData(): DayRecord[] {
  const history = getLocalHistory()
  const now = new Date()
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1

  // 전월 1일부터 말일까지
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0) // 해당 월의 마지막 날
  const result: DayRecord[] = []

  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0]
    const existing = history.find((r) => r.date === dateStr)
    result.push(
      existing || {
        date: dateStr,
        totalMinutes: 0,
        totalSessions: 0,
      }
    )
  }

  return result
}

/**
 * 전체 통계 요약
 */
export function getTotalStats(): {
  totalMinutes: number
  totalSessions: number
  totalDays: number
  streakDays: number
} {
  const history = getLocalHistory()

  const totalMinutes = history.reduce((sum, r) => sum + r.totalMinutes, 0)
  const totalSessions = history.reduce((sum, r) => sum + r.totalSessions, 0)
  const totalDays = history.filter((r) => r.totalSessions > 0).length

  // 연속 일수 계산 (오늘부터 거꾸로)
  let streakDays = 0
  const today = new Date()

  for (let i = 0; i < 365; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]
    const record = history.find((r) => r.date === dateStr)

    if (record && record.totalSessions > 0) {
      streakDays++
    } else if (i > 0) {
      // 오늘이 아닌 날에 기록이 없으면 streak 종료
      break
    }
  }

  return { totalMinutes, totalSessions, totalDays, streakDays }
}
