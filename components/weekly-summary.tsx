"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, Target, TrendingUp, Calendar } from "lucide-react"

interface WeeklySummaryProps {
  totalMinutes: number
  totalSessions: number
  averagePerDay: number
  daysActive: number
}

export function WeeklySummary({
  totalMinutes,
  totalSessions,
  averagePerDay,
  daysActive,
}: WeeklySummaryProps) {
  const t = useTranslations("Dashboard")

  const stats = [
    {
      title: t("totalFocusTime"),
      value: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
      icon: Clock,
      description: t("thisWeek"),
    },
    {
      title: t("totalSessions"),
      value: totalSessions.toString(),
      icon: Target,
      description: t("completed"),
    },
    {
      title: t("dailyAverage"),
      value: `${averagePerDay}m`,
      icon: TrendingUp,
      description: t("perDay"),
    },
    {
      title: t("activeDays"),
      value: `${daysActive}/7`,
      icon: Calendar,
      description: t("daysThisWeek"),
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
