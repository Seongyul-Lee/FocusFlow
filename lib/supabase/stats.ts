import { createClient } from "./client"

export interface FocusSession {
  id?: string
  user_id: string
  duration_minutes: number
  session_type: "focus" | "break" | "long_break"
  completed_at: string
}

export interface DailyStats {
  id?: string
  user_id: string
  date: string
  total_sessions: number
  total_minutes: number
  goal_achieved: boolean
}

/**
 * Focus 세션 완료 시 저장
 */
export async function saveSession(
  userId: string,
  durationMinutes: number,
  sessionType: "focus" | "break" | "long_break" = "focus"
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("focus_sessions")
    .insert({
      user_id: userId,
      duration_minutes: durationMinutes,
      session_type: sessionType,
      completed_at: new Date().toISOString(),
    })
    .select()

  if (error) {
    console.error("Failed to save session:", error)
    throw error
  }

  return data
}

/**
 * 일일 통계 업데이트 (upsert)
 */
export async function updateDailyStats(
  userId: string,
  durationMinutes: number,
  dailyGoalMinutes: number = 120
) {
  const supabase = createClient()
  const today = new Date().toISOString().split("T")[0] // YYYY-MM-DD

  // 먼저 오늘 통계 조회
  const { data: existing } = await supabase
    .from("daily_stats")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .single()

  const newTotalSessions = (existing?.total_sessions || 0) + 1
  const newTotalMinutes = (existing?.total_minutes || 0) + durationMinutes
  const goalAchieved = newTotalMinutes >= dailyGoalMinutes

  const { data, error } = await supabase
    .from("daily_stats")
    .upsert({
      user_id: userId,
      date: today,
      total_sessions: newTotalSessions,
      total_minutes: newTotalMinutes,
      goal_achieved: goalAchieved,
    })
    .select()

  if (error) {
    console.error("Failed to update daily stats:", error)
    throw error
  }

  return data
}

/**
 * 오늘 통계 조회
 */
export async function getTodayStats(userId: string): Promise<DailyStats | null> {
  const supabase = createClient()
  const today = new Date().toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("daily_stats")
    .select("*")
    .eq("user_id", userId)
    .eq("date", today)
    .single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    console.error("Failed to get today stats:", error)
    throw error
  }

  return data
}

/**
 * 주간 통계 조회 (최근 7일)
 */
export async function getWeeklyStats(userId: string): Promise<DailyStats[]> {
  const supabase = createClient()
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekAgoStr = weekAgo.toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("daily_stats")
    .select("*")
    .eq("user_id", userId)
    .gte("date", weekAgoStr)
    .order("date", { ascending: true })

  if (error) {
    console.error("Failed to get weekly stats:", error)
    throw error
  }

  return data || []
}

/**
 * 세션 완료 시 호출 (저장 + 일일 통계 업데이트)
 */
export async function recordSessionComplete(
  userId: string,
  durationMinutes: number,
  dailyGoalMinutes: number = 120
) {
  try {
    await saveSession(userId, durationMinutes, "focus")
    await updateDailyStats(userId, durationMinutes, dailyGoalMinutes)
  } catch (error) {
    console.error("Failed to record session:", error)
    // 에러가 발생해도 로컬 상태는 유지됨
  }
}

// ============================================
// 대시보드용 조회 함수
// ============================================

export interface DayRecord {
  date: string
  totalMinutes: number
  totalSessions: number
}

/**
 * 최근 N일 데이터 조회 (빈 날짜는 0으로 채움)
 */
export async function getRecentDaysStats(userId: string, days: number): Promise<DayRecord[]> {
  const supabase = createClient()
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - days + 1)
  const startDateStr = startDate.toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("daily_stats")
    .select("date, total_minutes, total_sessions")
    .eq("user_id", userId)
    .gte("date", startDateStr)
    .order("date", { ascending: true })

  if (error) {
    console.error("Failed to get recent days stats:", error)
    return []
  }

  // 빈 날짜 채우기
  const result: DayRecord[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]

    const existing = data?.find((d) => d.date === dateStr)
    result.push({
      date: dateStr,
      totalMinutes: existing?.total_minutes || 0,
      totalSessions: existing?.total_sessions || 0,
    })
  }

  return result
}

/**
 * 지난주 데이터 조회 (7일 전 ~ 13일 전)
 */
export async function getLastWeekStats(userId: string): Promise<DayRecord[]> {
  const supabase = createClient()
  const today = new Date()
  const startDate = new Date(today)
  startDate.setDate(startDate.getDate() - 13)
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() - 7)

  const startDateStr = startDate.toISOString().split("T")[0]
  const endDateStr = endDate.toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("daily_stats")
    .select("date, total_minutes, total_sessions")
    .eq("user_id", userId)
    .gte("date", startDateStr)
    .lte("date", endDateStr)
    .order("date", { ascending: true })

  if (error) {
    console.error("Failed to get last week stats:", error)
    return []
  }

  // 빈 날짜 채우기
  const result: DayRecord[] = []
  for (let i = 13; i >= 7; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]

    const existing = data?.find((d) => d.date === dateStr)
    result.push({
      date: dateStr,
      totalMinutes: existing?.total_minutes || 0,
      totalSessions: existing?.total_sessions || 0,
    })
  }

  return result
}

/**
 * 이번 달 데이터 조회
 */
export async function getMonthlyStats(userId: string): Promise<DayRecord[]> {
  const supabase = createClient()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1)
  const firstDayStr = firstDay.toISOString().split("T")[0]
  const todayStr = now.toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("daily_stats")
    .select("date, total_minutes, total_sessions")
    .eq("user_id", userId)
    .gte("date", firstDayStr)
    .lte("date", todayStr)
    .order("date", { ascending: true })

  if (error) {
    console.error("Failed to get monthly stats:", error)
    return []
  }

  // 빈 날짜 채우기
  const result: DayRecord[] = []
  for (let d = new Date(firstDay); d <= now; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0]
    const existing = data?.find((r) => r.date === dateStr)
    result.push({
      date: dateStr,
      totalMinutes: existing?.total_minutes || 0,
      totalSessions: existing?.total_sessions || 0,
    })
  }

  return result
}

/**
 * 전월 데이터 조회
 */
export async function getPreviousMonthStats(userId: string): Promise<DayRecord[]> {
  const supabase = createClient()
  const now = new Date()
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
  const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const firstDayStr = firstDay.toISOString().split("T")[0]
  const lastDayStr = lastDay.toISOString().split("T")[0]

  const { data, error } = await supabase
    .from("daily_stats")
    .select("date, total_minutes, total_sessions")
    .eq("user_id", userId)
    .gte("date", firstDayStr)
    .lte("date", lastDayStr)
    .order("date", { ascending: true })

  if (error) {
    console.error("Failed to get previous month stats:", error)
    return []
  }

  // 빈 날짜 채우기
  const result: DayRecord[] = []
  for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0]
    const existing = data?.find((r) => r.date === dateStr)
    result.push({
      date: dateStr,
      totalMinutes: existing?.total_minutes || 0,
      totalSessions: existing?.total_sessions || 0,
    })
  }

  return result
}

/**
 * 전체 통계 (연속 출석 일수 포함)
 */
export async function getTotalStatsFromDB(userId: string): Promise<{
  totalMinutes: number
  totalSessions: number
  totalDays: number
  streakDays: number
}> {
  const supabase = createClient()

  // 전체 통계 조회
  const { data, error } = await supabase
    .from("daily_stats")
    .select("date, total_minutes, total_sessions")
    .eq("user_id", userId)
    .order("date", { ascending: false })

  if (error) {
    console.error("Failed to get total stats:", error)
    return { totalMinutes: 0, totalSessions: 0, totalDays: 0, streakDays: 0 }
  }

  const totalMinutes = data?.reduce((sum, r) => sum + (r.total_minutes || 0), 0) || 0
  const totalSessions = data?.reduce((sum, r) => sum + (r.total_sessions || 0), 0) || 0
  const totalDays = data?.filter((r) => r.total_sessions > 0).length || 0

  // 연속 일수 계산
  let streakDays = 0
  const today = new Date()
  const dates = new Set(data?.map((r) => r.date) || [])

  for (let i = 0; i < 365; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split("T")[0]

    if (dates.has(dateStr)) {
      streakDays++
    } else if (i > 0) {
      break
    }
  }

  return { totalMinutes, totalSessions, totalDays, streakDays }
}
