"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Clock,
  Target,
  TrendingUp,
  Calendar,
  Flame,
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts"
import {
  getRecentDays,
  getCurrentMonthData,
  getTotalStats,
  type DayRecord,
} from "@/lib/storage/local-history"
import { getLocalTodayStats } from "@/lib/storage/local-stats"

// 시간 포맷팅 (0h 0m → 0m, 1h 0m → 1h, 1h 30m → 1h 30m)
function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

// 차트 커스텀 툴팁
function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: Array<{ value: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{formatTime(payload[0].value)}</p>
    </div>
  )
}

// 오늘 요약 카드
function TodayCard({
  todayMinutes,
  todaySessions,
  streakDays,
}: {
  todayMinutes: number
  todaySessions: number
  streakDays: number
}) {
  const t = useTranslations("Dashboard")

  return (
    <Card className="glass-card border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Target className="h-4 w-4 text-green-400" />
          {t("overview")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col items-center p-2 rounded-xl bg-primary/10">
            <Clock className="h-4 w-4 text-primary mb-1" />
            <p className="text-xs font-semibold">{formatTime(todayMinutes)}</p>
            <p className="text-[10px] text-muted-foreground">{t("todayFocus")}</p>
          </div>
          <div className="flex flex-col items-center p-2 rounded-xl bg-green-500/10">
            <Target className="h-4 w-4 text-green-400 mb-1" />
            <p className="text-xs font-semibold">{todaySessions}</p>
            <p className="text-[10px] text-muted-foreground">{t("sessions")}</p>
          </div>
          <div className="flex flex-col items-center p-2 rounded-xl bg-rose-500/10">
            <Flame className="h-4 w-4 text-rose-400 mb-1" />
            <p className="text-xs font-semibold">{streakDays}{t("days")}</p>
            <p className="text-[10px] text-muted-foreground">{t("streak")}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 주간 현황 카드
function WeeklyCard({ data }: { data: DayRecord[] }) {
  const t = useTranslations("Dashboard")
  const tDays = useTranslations("Days")

  // 총 시간 및 세션
  const totalMinutes = data.reduce((sum, d) => sum + d.totalMinutes, 0)
  const totalSessions = data.reduce((sum, d) => sum + d.totalSessions, 0)
  const avgMinutes = Math.round(totalMinutes / 7)

  // 일~토 순서로 7일 데이터 정렬 (오늘 기준으로 지난 7일을 요일별로 배치)
  const dayLabels = [
    tDays("sun"), tDays("mon"), tDays("tue"), tDays("wed"),
    tDays("thu"), tDays("fri"), tDays("sat")
  ]

  const chartData = data.map((d) => {
    const dayIndex = new Date(d.date).getDay()
    return {
      day: dayLabels[dayIndex],
      minutes: d.totalMinutes,
      dayIndex,
    }
  }).sort((a, b) => a.dayIndex - b.dayIndex)

  return (
    <Card className="glass-card border-0">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-sky-400" />
            {t("weeklyStats")}
          </CardTitle>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>{t("totalSessions")}: {totalSessions}</span>
          <span>{t("dailyAvg")}: {formatTime(avgMinutes)}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={24}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="minutes"
                fill="hsl(var(--chart-2))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// 월간 현황 카드 (주차별 그래프)
function MonthlyCard({ data }: { data: DayRecord[] }) {
  const t = useTranslations("Dashboard")
  const totalMinutes = data.reduce((sum, d) => sum + d.totalMinutes, 0)

  // 주차별 데이터 그룹핑 (달력 기준 주차)
  const weeklyData: { week: string; minutes: number }[] = []

  if (data.length > 0) {
    const firstDate = new Date(data[0].date)
    const year = firstDate.getFullYear()
    const month = firstDate.getMonth()

    // 이번 달 1일의 요일
    const firstDayOfMonth = new Date(year, month, 1).getDay()

    let weekNum = 1
    let weekMinutes = 0

    data.forEach((d) => {
      const date = new Date(d.date)
      const dayOfMonth = date.getDate()
      const dayOfWeek = date.getDay()

      weekMinutes += d.totalMinutes

      // 토요일이면 주 마감
      if (dayOfWeek === 6) {
        weeklyData.push({
          week: `${weekNum}${t("week")}`,
          minutes: weekMinutes,
        })
        weekNum++
        weekMinutes = 0
      }
    })

    // 마지막 주 (토요일로 끝나지 않은 경우)
    if (weekMinutes > 0 || (data.length > 0 && new Date(data[data.length - 1].date).getDay() !== 6)) {
      weeklyData.push({
        week: `${weekNum}${t("week")}`,
        minutes: weekMinutes,
      })
    }
  }

  return (
    <Card className="glass-card border-0">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {t("monthlyStats")}
          </CardTitle>
          <span className="text-xs font-medium text-primary">
            {formatTime(totalMinutes)}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="week"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="minutes"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#colorMinutes)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardLeft() {
  const [weeklyData, setWeeklyData] = useState<DayRecord[]>([])
  const [monthlyData, setMonthlyData] = useState<DayRecord[]>([])
  const [totalStats, setTotalStats] = useState({ streakDays: 0 })
  const [todayStats, setTodayStats] = useState({ totalMinutes: 0, totalSessions: 0 })

  useEffect(() => {
    setWeeklyData(getRecentDays(7))
    setMonthlyData(getCurrentMonthData())
    setTotalStats(getTotalStats())

    const today = getLocalTodayStats()
    setTodayStats({
      totalMinutes: today.totalMinutes,
      totalSessions: today.totalSessions,
    })
  }, [])

  return (
    <div className="space-y-4">
      {/* 오늘 요약 */}
      <TodayCard
        todayMinutes={todayStats.totalMinutes}
        todaySessions={todayStats.totalSessions}
        streakDays={totalStats.streakDays}
      />

      {/* 주간 현황 */}
      <WeeklyCard data={weeklyData} />

      {/* 월간 현황 */}
      <MonthlyCard data={monthlyData} />
    </div>
  )
}
