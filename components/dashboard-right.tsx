"use client"

import { useEffect, useState, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Calendar, CheckCircle2, Circle, Clock, Target, Flame, Loader2 } from "lucide-react"
import {
  getCurrentMonthData,
  type DayRecord,
} from "@/lib/storage/local-history"
import {
  getAttendance,
  checkInToday,
  isCheckedInToday,
  getStreakStats,
  getWeeklyAttendanceRate,
} from "@/lib/storage/attendance"
import { useUser } from "@/hooks/use-user"
import { getMonthlyStats } from "@/lib/supabase/stats"
import {
  getAttendanceFromDB,
  checkInToDB,
  isCheckedInTodayDB,
  getStreakStatsFromDB,
  getWeeklyAttendanceRateFromDB,
} from "@/lib/supabase/attendance"

// 시간 포맷팅
function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function DashboardRight() {
  const { user } = useUser()
  const t = useTranslations("Dashboard")
  const tDays = useTranslations("Days")
  const [monthlyData, setMonthlyData] = useState<DayRecord[]>([])
  const [attendance, setAttendance] = useState<string[]>([])
  const [isCheckedIn, setIsCheckedIn] = useState<boolean | null>(null) // null = loading
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [streakStats, setStreakStats] = useState({ current: 0, best: 0 })
  const [weeklyRate, setWeeklyRate] = useState({ attended: 0, total: 7, rate: 0 })

  // 요일 라벨 (다국어)
  const dayLabels = [
    tDays("sun"), tDays("mon"), tDays("tue"), tDays("wed"),
    tDays("thu"), tDays("fri"), tDays("sat")
  ]

  const fullDayLabels = [
    tDays("sunday"), tDays("monday"), tDays("tuesday"), tDays("wednesday"),
    tDays("thursday"), tDays("friday"), tDays("saturday")
  ]

  const loadData = useCallback(async () => {
    if (user) {
      // 로그인 사용자: Supabase에서 데이터 조회
      try {
        const [monthly, attendanceData, checkedIn, streak, weekly] = await Promise.all([
          getMonthlyStats(user.id),
          getAttendanceFromDB(user.id),
          isCheckedInTodayDB(user.id),
          getStreakStatsFromDB(user.id),
          getWeeklyAttendanceRateFromDB(user.id),
        ])

        setMonthlyData(monthly)
        setAttendance(attendanceData)
        setIsCheckedIn(checkedIn)
        setStreakStats(streak)
        setWeeklyRate(weekly)
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
    setMonthlyData(getCurrentMonthData())
    setAttendance(getAttendance())
    setIsCheckedIn(isCheckedInToday())
    setStreakStats(getStreakStats())
    setWeeklyRate(getWeeklyAttendanceRate())
  }, [])

  // user 변경 시 (로그인/로그아웃) 상태 초기화 후 데이터 로드
  useEffect(() => {
    // 상태 초기화 (isCheckedIn은 null로 설정하여 로딩 상태 표시)
    setAttendance([])
    setIsCheckedIn(null)
    setStreakStats({ current: 0, best: 0 })
    setWeeklyRate({ attended: 0, total: 7, rate: 0 })
    setMonthlyData([])
    setSelectedDay(null)

    // 새 데이터 로드
    loadData()
  }, [loadData])

  const handleCheckIn = useCallback(async () => {
    if (user) {
      // 로그인 사용자: Supabase에 출석 저장
      await checkInToDB(user.id)
      const [attendanceData, streak, weekly] = await Promise.all([
        getAttendanceFromDB(user.id),
        getStreakStatsFromDB(user.id),
        getWeeklyAttendanceRateFromDB(user.id),
      ])
      setAttendance(attendanceData)
      setStreakStats(streak)
      setWeeklyRate(weekly)
    } else {
      // 비로그인 사용자: localStorage에 저장
      checkInToday()
      setAttendance(getAttendance())
      setStreakStats(getStreakStats())
      setWeeklyRate(getWeeklyAttendanceRate())
    }
    setIsCheckedIn(true)
  }, [user])

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

  // 세션 수 가져오기
  const getSessions = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    const record = monthlyData.find((d) => d.date === dateStr)
    return record?.totalSessions || 0
  }

  // 날짜 클릭 핸들러
  const handleDayClick = (day: number) => {
    setSelectedDay(selectedDay === day ? null : day)
  }

  // 선택된 날짜 정보
  const selectedDayInfo = selectedDay ? {
    minutes: getFocusMinutes(selectedDay),
    sessions: getSessions(selectedDay),
    attended: isAttended(selectedDay),
    dayOfWeek: (firstDayOfMonth + selectedDay - 1) % 7
  } : null

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
            <Calendar className="h-6 w-6 text-amber-400 hover-dashboard-icon" />
            <span className="hover-dashboard-title">{t("activityCalendar")}</span>
          </CardTitle>
          <span className="text-base text-muted-foreground">
            {year}.{month + 1}.{today}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 flex flex-col">
        {/* 출석 체크 버튼 */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/10">
          <div className="flex items-center gap-3">
            {isCheckedIn === null ? (
              <Loader2 className="h-7 w-7 text-muted-foreground animate-spin" />
            ) : isCheckedIn ? (
              <CheckCircle2 className="h-7 w-7 text-green-500" />
            ) : (
              <Circle className="h-7 w-7 text-muted-foreground" />
            )}
            <div>
              <p className="text-base font-medium">
                {isCheckedIn === null ? t("loading") : isCheckedIn ? t("checkedIn") : t("checkInPrompt")}
              </p>
              <p className="text-sm text-muted-foreground">
                {t("monthlyAttendance")}: {monthAttendanceCount}{t("days")}
              </p>
            </div>
          </div>
          {isCheckedIn === false && (
            <Button
              onClick={handleCheckIn}
              className="h-9 px-4 text-sm glow-primary hover-glow hover-shine"
            >
              {t("checkIn")}
            </Button>
          )}
        </div>

        {/* 스트릭 통계 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center p-3 rounded-xl bg-rose-500/10 hover-stat cursor-default">
            <Flame className="h-5 w-5 text-rose-400 mb-1.5 hover-bounce" />
            <p className="text-base font-semibold">{streakStats.current}{t("days")}</p>
            <p className="text-xs text-muted-foreground">{t("currentStreak")}</p>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-amber-500/10 hover-stat cursor-default">
            <Flame className="h-5 w-5 text-amber-400 mb-1.5 hover-bounce" />
            <p className="text-base font-semibold">{streakStats.best}{t("days")}</p>
            <p className="text-xs text-muted-foreground">{t("bestStreak")}</p>
          </div>
          <div className="flex flex-col items-center p-3 rounded-xl bg-sky-500/10 hover-stat cursor-default">
            <Target className="h-5 w-5 text-sky-400 mb-1.5 hover-bounce" />
            <p className="text-base font-semibold">{weeklyRate.rate}%</p>
            <p className="text-xs text-muted-foreground">{t("weeklyRate")}</p>
          </div>
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
        <TooltipProvider delayDuration={200}>
          <div className="grid grid-cols-7 gap-2.5 flex-1 content-start">
            {calendarDays.map((day, index) => {
              const isToday = day === today
              const dayOfWeek = day ? (firstDayOfMonth + day - 1) % 7 : -1
              const isSelected = day === selectedDay

              if (day === null) {
                return <div key={index} className="aspect-square bg-transparent" />
              }

              const minutes = getFocusMinutes(day)
              const sessions = getSessions(day)
              const attended = isAttended(day)

              return (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => handleDayClick(day)}
                      className={`aspect-square rounded-lg flex items-center justify-center text-base font-medium transition-all cursor-pointer hover:scale-105 ${
                        isSelected
                          ? `${getIntensityClass(day)} ring-2 ring-amber-400`
                          : isToday
                            ? `${getIntensityClass(day)} ring-2 ring-primary font-bold`
                            : getIntensityClass(day)
                      } ${dayOfWeek === 0 ? "text-rose-400" : ""} ${dayOfWeek === 6 ? "text-blue-400" : ""}`}
                    >
                      {day}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent
                    side="top"
                    className="bg-card/95 backdrop-blur-md border border-primary/20 rounded-xl px-4 py-3 shadow-xl"
                  >
                    <p className="text-sm font-medium text-foreground mb-2">
                      {month + 1}/{day} ({fullDayLabels[dayOfWeek]})
                    </p>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        <span>{formatTime(minutes)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="h-3.5 w-3.5 text-green-400" />
                        <span>{sessions} {t("sessions")}</span>
                      </div>
                      {attended && (
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-blue-400" />
                          <span>{t("checkedIn")}</span>
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </TooltipProvider>

        {/* 선택된 날짜 상세 정보 */}
        {selectedDayInfo && selectedDay && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-3">
              <p className="text-base font-medium">
                {month + 1}/{selectedDay} ({fullDayLabels[selectedDayInfo.dayOfWeek]})
              </p>
              <button
                type="button"
                onClick={() => setSelectedDay(null)}
                className="text-muted-foreground hover:text-foreground text-sm"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center p-2 rounded-lg bg-background/50">
                <Clock className="h-4 w-4 text-primary mb-1" />
                <p className="text-sm font-semibold">{formatTime(selectedDayInfo.minutes)}</p>
                <p className="text-xs text-muted-foreground">{t("todayFocus")}</p>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-background/50">
                <Target className="h-4 w-4 text-green-400 mb-1" />
                <p className="text-sm font-semibold">{selectedDayInfo.sessions}</p>
                <p className="text-xs text-muted-foreground">{t("sessions")}</p>
              </div>
              <div className="flex flex-col items-center p-2 rounded-lg bg-background/50">
                {selectedDayInfo.attended ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-blue-400 mb-1" />
                    <p className="text-sm font-semibold text-blue-400">O</p>
                  </>
                ) : (
                  <>
                    <Circle className="h-4 w-4 text-muted-foreground mb-1" />
                    <p className="text-sm font-semibold text-muted-foreground">-</p>
                  </>
                )}
                <p className="text-xs text-muted-foreground">{t("checkIn")}</p>
              </div>
            </div>
          </div>
        )}

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
