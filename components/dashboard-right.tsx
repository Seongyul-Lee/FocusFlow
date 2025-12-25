"use client"

import { useEffect, useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, CheckCircle2, Circle } from "lucide-react"
import {
  getCurrentMonthData,
  type DayRecord,
} from "@/lib/storage/local-history"
import {
  getAttendance,
  checkInToday,
  isCheckedInToday,
} from "@/lib/storage/attendance"

export function DashboardRight() {
  const t = useTranslations("Dashboard")
  const tDays = useTranslations("Days")
  const [monthlyData, setMonthlyData] = useState<DayRecord[]>([])
  const [attendance, setAttendance] = useState<string[]>([])
  const [isCheckedIn, setIsCheckedIn] = useState(false)

  // 요일 라벨 (다국어)
  const dayLabels = [
    tDays("sun"), tDays("mon"), tDays("tue"), tDays("wed"),
    tDays("thu"), tDays("fri"), tDays("sat")
  ]

  useEffect(() => {
    setMonthlyData(getCurrentMonthData())
    setAttendance(getAttendance())
    setIsCheckedIn(isCheckedInToday())
  }, [])

  const handleCheckIn = useCallback(() => {
    checkInToday()
    setAttendance(getAttendance())
    setIsCheckedIn(true)
  }, [])

  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  // 이번 달 1일의 요일
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  // 이번 달 마지막 날
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate()
  // 오늘 날짜
  const today = now.getDate()

  // 캘린더 그리드 생성
  const calendarDays: (number | null)[] = []

  // 앞쪽 빈칸
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null)
  }

  // 날짜 채우기
  for (let day = 1; day <= lastDayOfMonth; day++) {
    calendarDays.push(day)
  }

  // 출석 여부 확인
  const isAttended = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return attendance.includes(dateStr)
  }

  // 집중 시간 가져오기
  const getFocusMinutes = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const record = monthlyData.find((d) => d.date === dateStr)
    return record?.totalMinutes || 0
  }

  // 강도에 따른 색상 클래스
  const getIntensityClass = (day: number) => {
    const minutes = getFocusMinutes(day)
    const attended = isAttended(day)

    if (attended && minutes === 0) return "bg-blue-500/40 ring-1 ring-blue-400/50"
    if (minutes === 0) return "bg-muted/20"
    if (minutes < 30) return "bg-green-500/30"
    if (minutes < 60) return "bg-green-500/50"
    if (minutes < 120) return "bg-green-500/70"
    return "bg-green-500"
  }

  // 이번 달 출석 일수
  const monthAttendanceCount = attendance.filter((date) => {
    const d = new Date(date)
    return d.getFullYear() === year && d.getMonth() === month
  }).length

  return (
    <Card className="glass-card border-0 flex flex-col flex-1">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <Calendar className="h-6 w-6 text-amber-400" />
            {t("activityCalendar")}
          </CardTitle>
          <span className="text-base text-muted-foreground">
            {year}.{month + 1}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 flex flex-col">
        {/* 출석 체크 버튼 */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-3">
            {isCheckedIn ? (
              <CheckCircle2 className="h-7 w-7 text-green-500" />
            ) : (
              <Circle className="h-7 w-7 text-muted-foreground" />
            )}
            <div>
              <p className="text-base font-medium">
                {isCheckedIn ? t("checkedIn") : t("checkInPrompt")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("monthlyAttendance")}: {monthAttendanceCount}{t("days")}
              </p>
            </div>
          </div>
          {!isCheckedIn && (
            <Button
              onClick={handleCheckIn}
              className="h-9 px-4 text-sm glow-primary"
            >
              {t("checkIn")}
            </Button>
          )}
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-2">
          {dayLabels.map((day, i) => (
            <div
              key={i}
              className={`text-sm text-center py-2 font-medium ${
                i === 0 ? "text-rose-400" : i === 6 ? "text-blue-400" : "text-muted-foreground"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 캘린더 그리드 */}
        <div className="grid grid-cols-7 gap-2.5 flex-1 content-start">
          {calendarDays.map((day, index) => {
            const isToday = day === today
            const dayOfWeek = day ? (firstDayOfMonth + day - 1) % 7 : -1

            return (
              <div
                key={index}
                className={`aspect-square rounded-lg flex items-center justify-center text-base font-medium transition-all ${
                  day === null
                    ? "bg-transparent"
                    : isToday
                      ? `${getIntensityClass(day)} ring-2 ring-primary font-bold`
                      : getIntensityClass(day)
                } ${day && dayOfWeek === 0 ? "text-rose-400" : ""} ${day && dayOfWeek === 6 ? "text-blue-400" : ""}`}
                title={
                  day
                    ? `${month + 1}/${day}: ${getFocusMinutes(day)}m${isAttended(day) ? ` (${t("attendanceOnly")})` : ""}`
                    : ""
                }
              >
                {day}
              </div>
            )
          })}
        </div>

        {/* 범례 */}
        <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-sm bg-blue-500/40 ring-1 ring-blue-400/50" />
            <span>{t("attendanceOnly")}</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{t("less")}</span>
            <div className="w-3.5 h-3.5 rounded-sm bg-muted/20" />
            <div className="w-3.5 h-3.5 rounded-sm bg-green-500/30" />
            <div className="w-3.5 h-3.5 rounded-sm bg-green-500/50" />
            <div className="w-3.5 h-3.5 rounded-sm bg-green-500/70" />
            <div className="w-3.5 h-3.5 rounded-sm bg-green-500" />
            <span>{t("more")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
