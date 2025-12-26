import { createClient } from "./client"

/**
 * 출석 체크 (attendance 테이블에 기록)
 */
export async function checkInToDB(userId: string): Promise<boolean> {
  if (!userId) return false

  const supabase = createClient()
  const today = new Date().toISOString().split("T")[0]

  // 이미 출석했는지 확인
  const { data: existing } = await supabase
    .from("attendance")
    .select("id")
    .eq("user_id", userId)
    .eq("date", today)
    .single()

  if (existing) {
    return false // 이미 출석함
  }

  const { error } = await supabase
    .from("attendance")
    .insert({ user_id: userId, date: today })

  if (error) {
    console.error("Failed to check in:", error)
    return false
  }

  return true
}

/**
 * 오늘 출석 여부 확인
 */
export async function isCheckedInTodayDB(userId: string): Promise<boolean> {
  if (!userId) return false

  const supabase = createClient()
  const today = new Date().toISOString().split("T")[0]

  const { data } = await supabase
    .from("attendance")
    .select("id")
    .eq("user_id", userId)
    .eq("date", today)
    .single()

  return !!data
}

/**
 * 출석 기록 조회 (날짜 배열)
 */
export async function getAttendanceFromDB(userId: string): Promise<string[]> {
  // userId가 없으면 빈 배열 반환
  if (!userId) {
    return []
  }

  const supabase = createClient()

  const { data, error } = await supabase
    .from("attendance")
    .select("date")
    .eq("user_id", userId)
    .order("date", { ascending: true })

  if (error) {
    // 의미있는 에러만 로그 출력 (message나 code가 있는 경우)
    if (error.message || error.code) {
      console.error("Failed to get attendance:", error)
    }
    return []
  }

  return data?.map((r) => r.date) || []
}

/**
 * 연속 출석 일수 계산
 */
export async function getStreakDaysFromDB(userId: string): Promise<number> {
  if (!userId) return 0

  const attendance = await getAttendanceFromDB(userId)
  if (attendance.length === 0) return 0

  const attendanceSet = new Set(attendance)
  const today = new Date()
  let streak = 0

  for (let i = 0; i < 365; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]

    if (attendanceSet.has(dateStr)) {
      streak++
    } else if (i > 0) {
      break
    }
  }

  return streak
}

/**
 * 최고 연속 출석 일수 조회
 */
export async function getBestStreakFromDB(userId: string): Promise<number> {
  if (!userId) return 0

  const supabase = createClient()

  const { data } = await supabase
    .from("user_stats")
    .select("best_streak")
    .eq("user_id", userId)
    .single()

  return data?.best_streak || 0
}

/**
 * 최고 연속 출석 일수 업데이트
 */
export async function updateBestStreakDB(userId: string, currentStreak: number): Promise<void> {
  if (!userId) return

  const supabase = createClient()
  const bestStreak = await getBestStreakFromDB(userId)

  if (currentStreak > bestStreak) {
    await supabase
      .from("user_stats")
      .upsert({
        user_id: userId,
        best_streak: currentStreak,
        updated_at: new Date().toISOString(),
      })
  }
}

/**
 * 스트릭 통계 (현재 + 베스트)
 */
export async function getStreakStatsFromDB(userId: string): Promise<{ current: number; best: number }> {
  if (!userId) return { current: 0, best: 0 }

  const current = await getStreakDaysFromDB(userId)
  const best = Math.max(await getBestStreakFromDB(userId), current)

  // 현재가 베스트보다 높으면 업데이트
  if (current > await getBestStreakFromDB(userId)) {
    await updateBestStreakDB(userId, current)
  }

  return { current, best }
}

/**
 * 주간 출석률
 */
export async function getWeeklyAttendanceRateFromDB(userId: string): Promise<{
  attended: number
  total: number
  rate: number
}> {
  if (!userId) return { attended: 0, total: 7, rate: 0 }

  const attendance = await getAttendanceFromDB(userId)
  const attendanceSet = new Set(attendance)
  const today = new Date()
  let attended = 0

  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]
    if (attendanceSet.has(dateStr)) {
      attended++
    }
  }

  return {
    attended,
    total: 7,
    rate: Math.round((attended / 7) * 100),
  }
}

/**
 * 특정 월 출석 일수
 */
export async function getMonthlyAttendanceFromDB(
  userId: string,
  year: number,
  month: number
): Promise<number> {
  if (!userId) return 0

  const attendance = await getAttendanceFromDB(userId)
  return attendance.filter((date) => {
    const d = new Date(date)
    return d.getFullYear() === year && d.getMonth() === month
  }).length
}
