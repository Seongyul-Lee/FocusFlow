"use client"

import { Suspense } from "react"
import { useTranslations } from "next-intl"
import { PomodoroTimer } from "@/components/pomodoro-timer"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenu } from "@/components/user-menu"
import { DashboardLeft } from "@/components/dashboard-left"
import { DashboardRight } from "@/components/dashboard-right"
import { BgmPanel } from "@/components/bgm-panel"
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts"

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
    <main className="relative min-h-screen bg-gray-50 dark:bg-zinc-950 text-slate-900 dark:text-white">
      {/* Fixed Header Controls */}
      <ThemeToggle />
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <UserMenu />
      </div>

      {/* 3-Column Layout: Left Dashboard - Timer (center) - Right (BGM/Calendar) */}
      <div className="min-h-screen pt-16 pb-8 px-4">
        <div className="max-w-[1800px] mx-auto grid grid-cols-1 xl:grid-cols-[320px_1fr_320px] gap-6 xl:gap-8">
          {/* Left: Dashboard (오늘 요약, 주간, 월간) */}
          <aside className="hidden xl:block space-y-4">
            <Suspense fallback={null}>
              <DashboardLeft />
            </Suspense>
          </aside>

          {/* Center: Timer + Shortcuts */}
          <section className="flex flex-col items-center">
            <div className="text-center mb-4 md:mb-8 px-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
                {t("title")}
              </h1>
              <p className="text-slate-500 dark:text-slate-400">{t("description")}</p>
            </div>
            <Suspense fallback={<TimerFallback />}>
              <PomodoroTimer />
            </Suspense>

            {/* Shortcuts below timer on desktop */}
            <div className="hidden xl:flex flex-col gap-4 mt-8 w-full max-w-sm">
              <KeyboardShortcuts />
            </div>
          </section>

          {/* Right: BGM + Activity Calendar */}
          <aside className="hidden xl:block space-y-4">
            <BgmPanel />
            <Suspense fallback={null}>
              <DashboardRight />
            </Suspense>
          </aside>
        </div>

        {/* Mobile: Stacked panels below timer */}
        <div className="xl:hidden mt-8 space-y-6 max-w-md mx-auto">
          <BgmPanel />
          <Suspense fallback={null}>
            <DashboardLeft />
          </Suspense>
          <Suspense fallback={null}>
            <DashboardRight />
          </Suspense>
          <KeyboardShortcuts />
        </div>
      </div>
    </main>
  )
}
