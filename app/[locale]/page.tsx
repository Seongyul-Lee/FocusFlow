"use client"

import { Suspense } from "react"
import { useTranslations } from "next-intl"
import { PomodoroTimer } from "@/components/pomodoro-timer"
import { ThemeToggle } from "@/components/theme-toggle"

function TimerFallback() {
  const t = useTranslations("Home")
  return (
    <div className="flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72">
      <div className="animate-pulse text-muted-foreground">{t("loading")}</div>
    </div>
  )
}

export default function Home() {
  const t = useTranslations("Home")

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 text-slate-900 dark:text-white p-4">
      <ThemeToggle />
      <div className="text-center mb-4 md:mb-8 px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
          {t("title")}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">{t("description")}</p>
      </div>
      <Suspense fallback={<TimerFallback />}>
        <PomodoroTimer />
      </Suspense>
    </main>
  )
}
