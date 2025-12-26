"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { useUser } from "@/hooks/use-user"
import { getWeeklyStats, type DailyStats } from "@/lib/supabase/stats"
import { StatsChart } from "@/components/stats-chart"
import { WeeklySummary } from "@/components/weekly-summary"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function DashboardPage() {
  const t = useTranslations("Dashboard")
  const router = useRouter()
  const { user, loading: userLoading } = useUser()
  const [stats, setStats] = useState<DailyStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (userLoading) return

    if (!user) {
      router.push("/auth/login")
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
  }, [user, userLoading, router])

  if (userLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  // 주간 통계 계산
  const totalMinutes = stats.reduce((sum, day) => sum + day.total_minutes, 0)
  const totalSessions = stats.reduce((sum, day) => sum + day.total_sessions, 0)
  const daysActive = stats.length
  const averagePerDay = daysActive > 0 ? Math.round(totalMinutes / daysActive) : 0

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-zinc-950 text-slate-900 dark:text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{t("title")}</h1>
            <p className="text-muted-foreground">{t("description")}</p>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t("backToTimer")}
            </Button>
          </Link>
        </div>

        <WeeklySummary
          totalMinutes={totalMinutes}
          totalSessions={totalSessions}
          averagePerDay={averagePerDay}
          daysActive={daysActive}
        />

        <div className="bg-background rounded-lg border p-4 md:p-6">
          <h2 className="text-lg font-semibold mb-4">{t("weeklyChart")}</h2>
          {stats.length > 0 ? (
            <StatsChart data={stats} />
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              {t("noData")}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
