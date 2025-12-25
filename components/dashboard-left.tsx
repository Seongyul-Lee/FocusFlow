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
    <div className="bg-popover/95 backdrop-blur-sm border border-border rounded-lg px-4 py-2.5 shadow-lg">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-base font-semibold">{formatTime(payload[0].value)}</p>
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
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Target className="h-5 w-5 text-green-400" />
          {t("overview")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center p-3 rounded-xl bg-primary/10">
            <Clock className="h-5 w-5 text-primary mb-1.5" />
            <p className="text-sm font-semibold">{formatTime(todayMinutes)}</p>
            <p className="text-xs text-muted-foreground">{t("todayFocus")}</p>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-green-500/10">
            <Target className="h-5 w-5 text-green-400 mb-1.5" />
            <p className="text-sm font-semibold">{todaySessions}</p>
            <p className="text-xs text-muted-foreground">{t("sessions")}</p>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-rose-500/10">
            <Flame className="h-5 w-5 text-rose-400 mb-1.5" />
            <p className="text-sm font-semibold">{streakDays}{t("days")}</p>
            <p className="text-xs text-muted-foreground">{t("streak")}</p>
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
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Calendar className="h-5 w-5 text-sky-400" />
            {t("weeklyStats")}
          </CardTitle>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground mt-1.5">
          <span>{t("totalSessions")}: {totalSessions}</span>
          <span>{t("dailyAvg")}: {formatTime(avgMinutes)}</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={32}>
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 13, fill: "hsl(var(--muted-foreground))" }}
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

// 월간 현황 카드 (핵심 지표 4개)
function MonthlyCard({ data }: { data: DayRecord[] }) {
  const t = useTranslations("Dashboard")

  // 핵심 지표 계산
  const totalMinutes = data.reduce((sum, d) => sum + d.totalMinutes, 0)
  const totalSessions = data.reduce((sum, d) => sum + d.totalSessions, 0)
  const activeDays = data.filter((d) => d.totalMinutes > 0).length
  const daysElapsed = new Date().getDate() // 이번 달 경과 일수
  const avgMinutes = daysElapsed > 0 ? Math.round(totalMinutes / daysElapsed) : 0

  return (
    <Card className="glass-card border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          {t("monthlyStats")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col items-center p-4 rounded-xl bg-primary/10">
            <Clock className="h-5 w-5 text-primary mb-1.5" />
            <p className="text-base font-semibold">{formatTime(totalMinutes)}</p>
            <p className="text-xs text-muted-foreground">{t("totalFocusTime")}</p>
          </div>
          <div className="flex flex-col items-center p-4 rounded-xl bg-green-500/10">
            <Target className="h-5 w-5 text-green-400 mb-1.5" />
            <p className="text-base font-semibold">{totalSessions}</p>
            <p className="text-xs text-muted-foreground">{t("totalSessions")}</p>
          </div>
          <div className="flex flex-col items-center p-4 rounded-xl bg-sky-500/10">
            <Calendar className="h-5 w-5 text-sky-400 mb-1.5" />
            <p className="text-base font-semibold">{formatTime(avgMinutes)}</p>
            <p className="text-xs text-muted-foreground">{t("dailyAvg")}</p>
          </div>
          <div className="flex flex-col items-center p-4 rounded-xl bg-amber-500/10">
            <Flame className="h-5 w-5 text-amber-400 mb-1.5" />
            <p className="text-base font-semibold">{activeDays}{t("days")}</p>
            <p className="text-xs text-muted-foreground">{t("activeDays")}</p>
          </div>
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
    <div className="flex flex-col gap-4 flex-1">
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
