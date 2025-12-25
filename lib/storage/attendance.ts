const ATTENDANCE_KEY = "pomobox_attendance"

/**
 * 출석 기록 조회 (날짜 배열)
 */
export function getAttendance(): string[] {
  if (typeof window === "undefined") return []

  try {
    const stored = localStorage.getItem(ATTENDANCE_KEY)
    if (!stored) return []
    return JSON.parse(stored) as string[]
  } catch {
    return []
  }
}

/**
 * 출석 기록 저장
 */
function saveAttendance(dates: string[]): void {
  if (typeof window === "undefined") return

  try {
    // 최근 365일만 유지
    const trimmed = dates.slice(-365)
    localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(trimmed))
  } catch (error) {
    console.error("Failed to save attendance:", error)
  }
}

/**
 * 오늘 날짜 문자열 반환 (YYYY-MM-DD)
 */
function getToday(): string {
  return new Date().toISOString().split("T")[0]
}

/**
 * 오늘 출석 체크 여부 확인
 */
export function isCheckedInToday(): boolean {
  const attendance = getAttendance()
  const today = getToday()
  return attendance.includes(today)
}

/**
 * 오늘 출석 체크
 */
export function checkInToday(): boolean {
  if (isCheckedInToday()) return false // 이미 출석함

  const attendance = getAttendance()
  attendance.push(getToday())
  saveAttendance(attendance)
  return true
}

/**
 * 연속 출석 일수 계산
 */
export function getStreakDays(): number {
  const attendance = getAttendance()
  if (attendance.length === 0) return 0

  const today = new Date()
  let streak = 0

  for (let i = 0; i < 365; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]

    if (attendance.includes(dateStr)) {
      streak++
    } else if (i > 0) {
      // 오늘이 아닌 날에 출석 기록이 없으면 streak 종료
      break
    }
  }

  return streak
}

/**
 * 특정 월의 출석 일수
 */
export function getMonthlyAttendance(year: number, month: number): number {
  const attendance = getAttendance()
  return attendance.filter((date) => {
    const d = new Date(date)
    return d.getFullYear() === year && d.getMonth() === month
  }).length
}
