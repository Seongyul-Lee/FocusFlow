"use client"

import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useUser } from "@/hooks/use-user"
import { getWeeklyStats, type DailyStats } from "@/lib/supabase/stats"
import { StatsChart } from "@/components/stats-chart"
import { WeeklySummary } from "@/components/weekly-summary"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, BarChart3, LogIn } from "lucide-react"

export function DashboardSection() {
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

  // 로딩 중
  if (userLoading || loading) {
    return (
      <div className="w-full max-w-4xl mt-12">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // 비로그인 사용자
  if (!user) {
    return (
      <div className="w-full max-w-4xl mt-12">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 gap-4">
            <BarChart3 className="h-12 w-12 text-muted-foreground" />
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">{t("title")}</h3>
              <p className="text-muted-foreground mb-4">{t("loginRequired")}</p>
            </div>
            <Link href="/auth/login">
              <Button className="gap-2">
                <LogIn className="h-4 w-4" />
                {t("loginToView")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 로그인 사용자: 대시보드 표시
  const totalMinutes = stats.reduce((sum, day) => sum + day.total_minutes, 0)
  const totalSessions = stats.reduce((sum, day) => sum + day.total_sessions, 0)
  const daysActive = stats.length
  const averagePerDay = daysActive > 0 ? Math.round(totalMinutes / daysActive) : 0

  return (
    <div className="w-full max-w-4xl mt-12 space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold mb-1">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <WeeklySummary
        totalMinutes={totalMinutes}
        totalSessions={totalSessions}
        averagePerDay={averagePerDay}
        daysActive={daysActive}
      />

      <div className="bg-background rounded-lg border p-4 md:p-6">
        <h3 className="text-lg font-semibold mb-4">{t("weeklyChart")}</h3>
        {stats.length > 0 ? (
          <StatsChart data={stats} />
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            {t("noData")}
          </div>
        )}
      </div>
    </div>
  )
}
