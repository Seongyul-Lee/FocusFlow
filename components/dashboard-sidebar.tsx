"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useUser } from "@/hooks/use-user"
import { getWeeklyStats, type DailyStats } from "@/lib/supabase/stats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, BarChart3, LogIn, Clock, Target, TrendingUp, Calendar } from "lucide-react"

// Compact mini chart for sidebar
function MiniChart({ data }: { data: DailyStats[] }) {
  const maxMinutes = Math.max(...data.map(d => d.total_minutes), 1)

  // Ensure we have 7 days (fill missing days with 0)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dateStr = date.toISOString().split("T")[0]
    const found = data.find(d => d.date === dateStr)
    return {
      date: dateStr,
      minutes: found?.total_minutes || 0,
      dayLabel: date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1),
    }
  })

  return (
    <div className="flex items-end justify-between gap-1 h-16">
      {last7Days.map((day) => (
        <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
          <div
            className="w-full bg-primary/80 rounded-t transition-all"
            style={{
              height: `${Math.max((day.minutes / maxMinutes) * 48, 2)}px`,
            }}
          />
          <span className="text-[10px] text-muted-foreground">{day.dayLabel}</span>
        </div>
      ))}
    </div>
  )
}

export function DashboardSidebar() {
  const t = useTranslations("Dashboard")
  const { user, loading: userLoading } = useUser()
  const [stats, setStats] = useState<DailyStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userLoading) return

    if (!user) {
      setLoading(false)
      return
    }

    const fetchStats = async () => {
      try {
        const weeklyStats = await getWeeklyStats(user.id)
        setStats(weeklyStats)
      } catch (error) {
        console.error("Failed to fetch stats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user, userLoading])

  // Loading state
  if (userLoading || loading) {
    return (
      <Card className="glass-card border-0">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  // Not logged in
  if (!user) {
    return (
      <Card className="glass-card border-0">
        <CardContent className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <BarChart3 className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <h3 className="text-sm font-semibold mb-1">{t("title")}</h3>
            <p className="text-xs text-muted-foreground mb-3">{t("loginRequired")}</p>
          </div>
          <Link href="/auth/login">
            <Button size="sm" className="gap-2 glow-primary">
              <LogIn className="h-3 w-3" />
              {t("loginToView")}
            </Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  // Logged in: Show compact dashboard
  const totalMinutes = stats.reduce((sum, day) => sum + day.total_minutes, 0)
  const totalSessions = stats.reduce((sum, day) => sum + day.total_sessions, 0)
  const daysActive = stats.length
  const averagePerDay = daysActive > 0 ? Math.round(totalMinutes / daysActive) : 0

  return (
    <Card className="glass-card border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          {t("weeklyChart")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Mini Chart */}
        {stats.length > 0 ? (
          <MiniChart data={stats} />
        ) : (
          <div className="h-16 flex items-center justify-center text-xs text-muted-foreground">
            {t("noData")}
          </div>
        )}

        {/* Compact Stats Grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 p-2 rounded-xl bg-primary/5 border border-primary/10">
            <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{t("totalFocusTime")}</p>
              <p className="text-sm font-semibold">
                {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-green-500/5 border border-green-500/10">
            <Target className="h-3.5 w-3.5 text-green-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{t("totalSessions")}</p>
              <p className="text-sm font-semibold">{totalSessions}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-sky-500/5 border border-sky-500/10">
            <TrendingUp className="h-3.5 w-3.5 text-sky-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{t("dailyAverage")}</p>
              <p className="text-sm font-semibold">{averagePerDay}m</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/5 border border-amber-500/10">
            <Calendar className="h-3.5 w-3.5 text-amber-500 shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground truncate">{t("activeDays")}</p>
              <p className="text-sm font-semibold">{daysActive}/7</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
