"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Clock,
  Target,
  TrendingUp,
  Calendar,
  Flame,
  Lock,
} from "lucide-react"
import { useRealtimeFocusMinutes } from "@/hooks/use-realtime-focus"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts"
import {
  getRecentDays,
  getCurrentMonthData,
  getPreviousMonthData,
  getLastWeekData,
  getTotalStats,
  type DayRecord,
} from "@/lib/storage/local-history"
import { getLocalTodayStats } from "@/lib/storage/local-stats"
import { getDailyGoal } from "@/lib/storage/local-settings"
import { useUser } from "@/hooks/use-user"
import {
  getRecentDaysStats,
  getLastWeekStats,
  getMonthlyStats,
  getPreviousMonthStats,
  getTotalStatsFromDB,
  getTodayStats,
  type DayRecord as SupabaseDayRecord,
} from "@/lib/supabase/stats"

// 시간 포맷팅 (0h 0m → 0m, 1h 0m → 1h, 1h 30m → 1h 30m)
function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// 시간 포맷팅 (Hour/Minute 구조)
function formatTimeHourMin(minutes: number, tTime: (key: string) => string): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} ${tTime("minute")}`
  if (m === 0) return `${h} ${tTime("hour")}`
  return `${h} ${tTime("hour")} ${m} ${tTime("minute")}`
}

// 로그인 필요 오버레이
function LoginRequiredOverlay() {
  const t = useTranslations("Dashboard")

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-xl">
      <div className="flex flex-col items-center gap-2 text-muted-foreground">
        <Lock className="h-6 w-6" />
        <span className="text-sm font-medium">{t("loginRequired")}</span>
      </div>
    </div>
  )
}

// 차트 커스텀 툴팁
function CustomTooltip({
  active,
  payload,
  t,
}: {
  active?: boolean
  payload?: Array<{ value: number; payload: { fullDay: string; minutes: number; sessions: number } }>
  label?: string
  t: (key: string) => string
}) {
  if (!active || !payload?.length) return null

  // payload[0].value는 displayMinutes (최소 3), 실제 minutes 사용
  const minutes = payload[0].payload.minutes
  const fullDay = payload[0].payload.fullDay
  const sessions = payload[0].payload.sessions

  return (
    <div className="bg-card/95 backdrop-blur-md border border-primary/20 rounded-xl px-4 py-3 shadow-xl shadow-primary/10 animate-in fade-in-0 zoom-in-95 duration-200">
      <p className="text-sm font-medium text-foreground mb-1">
        {fullDay}
      </p>
      {minutes > 0 ? (
        <>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-chart-2" />
            <p className="text-lg font-bold text-foreground">{formatTime(minutes)}</p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {sessions} {t("sessions")}
          </p>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          {t("noActivity")}
        </p>
      )}
    </div>
  )
}

// 오늘 요약 카드
function TodayCard({
  todayMinutes,
  todaySessions,
  streakDays,
  goalMinutes,
  realtimeMinutes,
}: {
  todayMinutes: number
  todaySessions: number
  streakDays: number
  goalMinutes: number
  realtimeMinutes: number
}) {
  const t = useTranslations("Dashboard")

  // 저장된 시간 + 실시간 경과 시간
  const displayMinutes = todayMinutes + realtimeMinutes
  const progress = Math.min((displayMinutes / goalMinutes) * 100, 100)
  const isGoalReached = displayMinutes >= goalMinutes

  return (
    <Card className="glass-card border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Target className="h-5 w-5 text-green-400 hover-dashboard-icon" />
          <span className="hover-dashboard-title">{t("overview")}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center p-3 rounded-xl bg-primary/10 hover-stat cursor-default">
            <Clock className="h-5 w-5 text-primary mb-1.5 hover-bounce" />
            <p className="text-sm font-semibold">{formatTime(displayMinutes)}</p>
            <p className="text-xs text-muted-foreground">{t("todayFocus")}</p>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-green-500/10 hover-stat cursor-default">
            <Target className="h-5 w-5 text-green-400 mb-1.5 hover-bounce" />
            <p className="text-sm font-semibold">{todaySessions}</p>
            <p className="text-xs text-muted-foreground">{t("sessions")}</p>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-rose-500/10 hover-stat cursor-default">
            <Flame className="h-5 w-5 text-rose-400 mb-1.5 hover-bounce" />
            <p className="text-sm font-semibold">{streakDays}{t("days")}</p>
            <p className="text-xs text-muted-foreground">{t("streak")}</p>
          </div>
        </div>

        {/* 일일 목표 진행률 */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">{t("dailyGoal")}</span>
            <span className={isGoalReached ? "text-green-500 font-medium" : "text-foreground"}>
              {Math.round(progress)}% ({displayMinutes}/{goalMinutes}{t("minute")})
            </span>
          </div>
          <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                isGoalReached ? "bg-green-500" : "bg-primary"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {isGoalReached && (
            <p className="text-xs text-green-500 text-center mt-2 font-medium">
              🎉 {t("goalReached")}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// 차트 색상 상수 (다크모드 기준 - 앱이 다크모드 기본)
const CHART_COLORS = {
  today: "#a78bfa",      // chart-1: 보라색 (오늘 강조)
  default: "#22c55e",    // chart-2: 녹색 (기본)
  muted: "rgba(148, 163, 184, 0.2)", // muted placeholder
  todayLabel: "#a78bfa", // 오늘 레이블 색상
  defaultLabel: "rgba(248, 250, 252, 0.8)", // 기본 레이블 색상
}

// 주간 현황 카드
function WeeklyCard({ data, isLoggedIn, realtimeMinutes }: { data: DayRecord[]; isLoggedIn: boolean; realtimeMinutes: number }) {
  const t = useTranslations("Dashboard")
  const tDays = useTranslations("Days")
  const tTime = useTranslations("Time")

  // 총 시간 및 세션 (로그인 사용자만 실시간 시간 포함)
  const storedMinutes = data.reduce((sum, d) => sum + d.totalMinutes, 0)
  const totalMinutes = storedMinutes + (isLoggedIn ? realtimeMinutes : 0)
  const totalSessions = data.reduce((sum, d) => sum + d.totalSessions, 0)
  const avgMinutes = Math.round(totalMinutes / 7)

  // 일~토 순서로 7일 데이터 정렬 (오늘 기준으로 지난 7일을 요일별로 배치)
  const dayLabels = [
    tDays("sun"), tDays("mon"), tDays("tue"), tDays("wed"),
    tDays("thu"), tDays("fri"), tDays("sat")
  ]
  const fullDayLabels = [
    tDays("sunday"), tDays("monday"), tDays("tuesday"), tDays("wednesday"),
    tDays("thursday"), tDays("friday"), tDays("saturday")
  ]

  // 오늘 요일 인덱스 (0=일, 6=토)
  const todayDayIndex = new Date().getDay()

  // 7일 모두 표시 (데이터 없는 날도 placeholder로)
  const chartData = Array.from({ length: 7 }, (_, dayIndex) => {
    const dayData = data.find(d => new Date(d.date).getDay() === dayIndex)
    const storedMins = dayData?.totalMinutes || 0
    const isToday = dayIndex === todayDayIndex
    // 오늘인 경우 실시간 시간 추가 (로그인 사용자만 - 비로그인은 블러 영역이므로 제외)
    const minutes = isToday && isLoggedIn ? storedMins + realtimeMinutes : storedMins
    return {
      day: dayLabels[dayIndex],
      fullDay: fullDayLabels[dayIndex],
      minutes,
      // 차트 표시용: 0값도 최소 높이(3) 보장
      displayMinutes: minutes > 0 ? minutes : 3,
      sessions: dayData?.totalSessions || 0,
      dayIndex,
      isToday,
      hasData: minutes > 0,
    }
  })

  return (
    <Card className="glass-card border-0">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Calendar className="h-5 w-5 text-sky-400 hover-dashboard-icon" />
            <span className="hover-dashboard-title">{t("weeklyStats")}</span>
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className={!isLoggedIn ? "blur-sm pointer-events-none select-none" : ""}>
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>{t("totalSessions")}: {totalSessions}</span>
            <span>{t("dailyAvg")}: {formatTimeHourMin(avgMinutes, tTime)}</span>
          </div>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={28}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="hsl(var(--border))"
                  strokeOpacity={0.5}
                />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={({ x, y, payload }) => {
                    const entry = chartData.find(d => d.day === payload.value)
                    const isToday = entry?.isToday
                    return (
                      <text
                        x={x}
                        y={y + 12}
                        textAnchor="middle"
                        fontSize={13}
                        fontWeight={isToday ? 700 : 600}
                        fill={isToday ? CHART_COLORS.todayLabel : CHART_COLORS.defaultLabel}
                      >
                        {payload.value}
                      </text>
                    )
                  }}
                />
                <YAxis hide />
                <Tooltip
                  content={<CustomTooltip t={t} />}
                  cursor={{ fill: "rgba(167, 139, 250, 0.12)", radius: 6 }}
                />
                <Bar
                  dataKey="displayMinutes"
                  fill={CHART_COLORS.default}
                  radius={[6, 6, 0, 0]}
                  activeBar={{
                    fillOpacity: 1,
                    strokeWidth: 2,
                    filter: "brightness(1.15) drop-shadow(0 4px 12px rgba(167, 139, 250, 0.4))",
                  }}
                >
                  {chartData.map((entry, index) => {
                    // 데이터 없는 날: muted placeholder
                    // 오늘: 보라색 (강조)
                    // 기타: 녹색 (기본)
                    const fill = !entry.hasData
                      ? CHART_COLORS.muted
                      : entry.isToday
                        ? CHART_COLORS.today
                        : CHART_COLORS.default
                    return (
                      <Cell
                        key={`cell-${index}`}
                        fill={fill}
                        stroke={fill}
                      />
                    )
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        {!isLoggedIn && <LoginRequiredOverlay />}
      </CardContent>
    </Card>
  )
}

// 트렌드 표시 컴포넌트
function TrendIndicator({ current, previous, label }: { current: number; previous: number; label: string }) {
  if (previous === 0) return null

  const diff = current - previous
  const percent = Math.round((diff / previous) * 100)

  if (percent === 0) return null

  const isPositive = percent > 0

  return (
    <span className={`text-xs font-medium ${isPositive ? "text-green-400" : "text-rose-400"}`}>
      {isPositive ? "+" : ""}{percent}% {label}
    </span>
  )
}

// 주간 비교 카드
function WeeklyComparisonCard({ thisWeekData, lastWeekData, isLoggedIn, realtimeMinutes }: { thisWeekData: DayRecord[]; lastWeekData: DayRecord[]; isLoggedIn: boolean; realtimeMinutes: number }) {
  const t = useTranslations("Dashboard")
  const tTime = useTranslations("Time")

  // 이번 주 통계 (로그인 사용자만 실시간 시간 포함)
  const storedThisWeekMinutes = thisWeekData.reduce((sum, d) => sum + d.totalMinutes, 0)
  const thisWeekMinutes = storedThisWeekMinutes + (isLoggedIn ? realtimeMinutes : 0)
  const thisWeekSessions = thisWeekData.reduce((sum, d) => sum + d.totalSessions, 0)

  // 지난 주 통계
  const lastWeekMinutes = lastWeekData.reduce((sum, d) => sum + d.totalMinutes, 0)
  const lastWeekSessions = lastWeekData.reduce((sum, d) => sum + d.totalSessions, 0)

  // 변화 계산
  const minutesDiff = thisWeekMinutes - lastWeekMinutes
  const minutesPercent = lastWeekMinutes > 0 ? Math.round((minutesDiff / lastWeekMinutes) * 100) : 0
  const sessionsDiff = thisWeekSessions - lastWeekSessions
  const sessionsPercent = lastWeekSessions > 0 ? Math.round((sessionsDiff / lastWeekSessions) * 100) : 0

  return (
    <Card className="glass-card border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-emerald-400 hover-dashboard-icon" />
          <span className="hover-dashboard-title">{t("weeklyComparison")}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className={!isLoggedIn ? "blur-sm pointer-events-none select-none" : ""}>
          <div className="grid grid-cols-2 gap-4">
            {/* 시간 비교 */}
            <div className="space-y-3">
              <div className="flex flex-col items-center p-3 rounded-xl bg-primary/10 hover-stat cursor-default">
                <p className="text-xs text-muted-foreground mb-1">{t("thisWeekLabel")}</p>
                <p className="text-lg font-bold text-primary">{formatTimeHourMin(thisWeekMinutes, tTime)}</p>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-muted/20 hover-stat cursor-default">
                <p className="text-xs text-muted-foreground mb-1">{t("lastWeekLabel")}</p>
                <p className="text-lg font-semibold">{formatTimeHourMin(lastWeekMinutes, tTime)}</p>
              </div>
              {lastWeekMinutes > 0 && (
                <div className={`text-center text-sm font-medium ${minutesDiff >= 0 ? "text-green-400" : "text-rose-400"}`}>
                  {minutesDiff >= 0 ? "+" : ""}{minutesPercent}%
                </div>
              )}
            </div>

            {/* 세션 비교 */}
            <div className="space-y-3">
              <div className="flex flex-col items-center p-3 rounded-xl bg-green-500/10 hover-stat cursor-default">
                <p className="text-xs text-muted-foreground mb-1">{t("thisWeekLabel")}</p>
                <p className="text-lg font-bold text-green-400">{thisWeekSessions} {t("sessions")}</p>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-muted/20 hover-stat cursor-default">
                <p className="text-xs text-muted-foreground mb-1">{t("lastWeekLabel")}</p>
                <p className="text-lg font-semibold">{lastWeekSessions} {t("sessions")}</p>
              </div>
              {lastWeekSessions > 0 && (
                <div className={`text-center text-sm font-medium ${sessionsDiff >= 0 ? "text-green-400" : "text-rose-400"}`}>
                  {sessionsDiff >= 0 ? "+" : ""}{sessionsPercent}%
                </div>
              )}
            </div>
          </div>
        </div>
        {!isLoggedIn && <LoginRequiredOverlay />}
      </CardContent>
    </Card>
  )
}

// 월간 현황 카드 (핵심 지표 4개 + 전월 대비)
function MonthlyCard({ data, prevData, isLoggedIn, realtimeMinutes }: { data: DayRecord[]; prevData: DayRecord[]; isLoggedIn: boolean; realtimeMinutes: number }) {
  const t = useTranslations("Dashboard")

  // 이번 달 핵심 지표 계산 (로그인 사용자만 실시간 시간 포함)
  const storedMinutes = data.reduce((sum, d) => sum + d.totalMinutes, 0)
  const totalMinutes = storedMinutes + (isLoggedIn ? realtimeMinutes : 0)
  const totalSessions = data.reduce((sum, d) => sum + d.totalSessions, 0)
  const activeDays = data.filter((d) => d.totalMinutes > 0).length
  const daysElapsed = new Date().getDate() // 이번 달 경과 일수
  const avgMinutes = daysElapsed > 0 ? Math.round(totalMinutes / daysElapsed) : 0

  // 전월 지표 계산 (동일 기간 비교: 전월 1일~경과일수)
  const prevDataSamePeriod = prevData.slice(0, daysElapsed)
  const prevTotalMinutes = prevDataSamePeriod.reduce((sum, d) => sum + d.totalMinutes, 0)
  const prevTotalSessions = prevDataSamePeriod.reduce((sum, d) => sum + d.totalSessions, 0)
  const prevActiveDays = prevDataSamePeriod.filter((d) => d.totalMinutes > 0).length
  const prevAvgMinutes = daysElapsed > 0 ? Math.round(prevTotalMinutes / daysElapsed) : 0

  return (
    <Card className="glass-card border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary hover-dashboard-icon" />
          <span className="hover-dashboard-title">{t("monthlyStats")}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className={!isLoggedIn ? "blur-sm pointer-events-none select-none" : ""}>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col items-center p-4 rounded-xl bg-primary/10 hover-stat cursor-default">
              <Clock className="h-5 w-5 text-primary mb-1.5 hover-bounce" />
              <p className="text-base font-semibold">{formatTime(totalMinutes)}</p>
              <p className="text-xs text-muted-foreground">{t("totalFocusTime")}</p>
              <TrendIndicator current={totalMinutes} previous={prevTotalMinutes} label={t("vsLastMonth")} />
            </div>
            <div className="flex flex-col items-center p-4 rounded-xl bg-green-500/10 hover-stat cursor-default">
              <Target className="h-5 w-5 text-green-400 mb-1.5 hover-bounce" />
              <p className="text-base font-semibold">{totalSessions}</p>
              <p className="text-xs text-muted-foreground">{t("totalSessions")}</p>
              <TrendIndicator current={totalSessions} previous={prevTotalSessions} label={t("vsLastMonth")} />
            </div>
            <div className="flex flex-col items-center p-4 rounded-xl bg-sky-500/10 hover-stat cursor-default">
              <Calendar className="h-5 w-5 text-sky-400 mb-1.5 hover-bounce" />
              <p className="text-base font-semibold">{formatTime(avgMinutes)}</p>
              <p className="text-xs text-muted-foreground">{t("dailyAvg")}</p>
              <TrendIndicator current={avgMinutes} previous={prevAvgMinutes} label={t("vsLastMonth")} />
            </div>
            <div className="flex flex-col items-center p-4 rounded-xl bg-amber-500/10 hover-stat cursor-default">
              <Flame className="h-5 w-5 text-amber-400 mb-1.5 hover-bounce" />
              <p className="text-base font-semibold">{activeDays}{t("days")}</p>
              <p className="text-xs text-muted-foreground">{t("activeDays")}</p>
              <TrendIndicator current={activeDays} previous={prevActiveDays} label={t("vsLastMonth")} />
            </div>
          </div>
        </div>
        {!isLoggedIn && <LoginRequiredOverlay />}
      </CardContent>
    </Card>
  )
}

export function DashboardLeft() {
  const { user } = useUser()
  const realtimeMinutes = useRealtimeFocusMinutes()
  const [weeklyData, setWeeklyData] = useState<DayRecord[]>([])
  const [lastWeekData, setLastWeekData] = useState<DayRecord[]>([])
  const [monthlyData, setMonthlyData] = useState<DayRecord[]>([])
  const [prevMonthData, setPrevMonthData] = useState<DayRecord[]>([])
  const [totalStats, setTotalStats] = useState({ streakDays: 0 })
  const [todayStats, setTodayStats] = useState({ totalMinutes: 0, totalSessions: 0 })
  const [goalMinutes, setGoalMinutes] = useState(120)

  const loadData = useCallback(async () => {
    setGoalMinutes(getDailyGoal())

    if (user) {
      // 로그인 사용자: Supabase에서 데이터 조회
      try {
        const [weekly, lastWeek, monthly, prevMonth, total, today] = await Promise.all([
          getRecentDaysStats(user.id, 7),
          getLastWeekStats(user.id),
          getMonthlyStats(user.id),
          getPreviousMonthStats(user.id),
          getTotalStatsFromDB(user.id),
          getTodayStats(user.id),
        ])

        setWeeklyData(weekly)
        setLastWeekData(lastWeek)
        setMonthlyData(monthly)
        setPrevMonthData(prevMonth)
        setTotalStats({ streakDays: total.streakDays })
        setTodayStats({
          totalMinutes: today?.total_minutes || 0,
          totalSessions: today?.total_sessions || 0,
        })
      } catch (error) {
        console.error("Failed to load data from Supabase:", error)
        // 에러 시 로컬 데이터로 폴백
        loadLocalData()
      }
    } else {
      // 비로그인 사용자: localStorage에서 데이터 조회
      loadLocalData()
    }
  }, [user])

  const loadLocalData = useCallback(() => {
    setWeeklyData(getRecentDays(7))
    setLastWeekData(getLastWeekData())
    setMonthlyData(getCurrentMonthData())
    setPrevMonthData(getPreviousMonthData())
    setTotalStats(getTotalStats())

    const today = getLocalTodayStats()
    setTodayStats({
      totalMinutes: today.totalMinutes,
      totalSessions: today.totalSessions,
    })
  }, [])

  // user 변경 시 (로그인/로그아웃) 상태 초기화 후 데이터 로드
  useEffect(() => {
    // 상태 초기화
    setWeeklyData([])
    setLastWeekData([])
    setMonthlyData([])
    setPrevMonthData([])
    setTotalStats({ streakDays: 0 })
    setTodayStats({ totalMinutes: 0, totalSessions: 0 })

    // 새 데이터 로드
    loadData()
  }, [loadData])

  // 세션 종료 시 (realtimeMinutes가 양수 → 0) 데이터 다시 로드
  const prevRealtimeMinutes = useRef(realtimeMinutes)
  useEffect(() => {
    // realtimeMinutes가 0보다 큰 값에서 0으로 변경되면 세션 종료로 간주
    if (prevRealtimeMinutes.current > 0 && realtimeMinutes === 0) {
      loadData()
    }
    prevRealtimeMinutes.current = realtimeMinutes
  }, [realtimeMinutes, loadData])

  return (
    <div className="flex flex-col gap-4 flex-1">
      {/* 오늘 요약 */}
      <TodayCard
        todayMinutes={todayStats.totalMinutes}
        todaySessions={todayStats.totalSessions}
        streakDays={totalStats.streakDays}
        goalMinutes={goalMinutes}
        realtimeMinutes={realtimeMinutes}
      />

      {/* 주간 현황 */}
      <WeeklyCard data={weeklyData} isLoggedIn={!!user} realtimeMinutes={realtimeMinutes} />

      {/* 주간 비교 */}
      <WeeklyComparisonCard thisWeekData={weeklyData} lastWeekData={lastWeekData} isLoggedIn={!!user} realtimeMinutes={realtimeMinutes} />

      {/* 월간 현황 */}
      <MonthlyCard data={monthlyData} prevData={prevMonthData} isLoggedIn={!!user} realtimeMinutes={realtimeMinutes} />
    </div>
  )
}
