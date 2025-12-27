"use client"

import { Suspense } from "react"
import Link from "next/link"
import { useTranslations } from "next-intl"
import { PomodoroTimer } from "@/components/pomodoro-timer"
import { ThemeToggle } from "@/components/theme-toggle"
import { UserMenu } from "@/components/user-menu"
import { DashboardLeft } from "@/components/dashboard-left"
import { DashboardRight } from "@/components/dashboard-right"
import { BgmPanel } from "@/components/bgm-panel"
import { TimerProvider } from "@/contexts/timer-context"

function TimerFallback() {
  const t = useTranslations("Home")
  return (
    <div className="flex items-center justify-center w-64 h-64 sm:w-72 sm:h-72">
      <div className="animate-pulse text-muted-foreground">{t("loading")}</div>
    </div>
  )
}

function SideAd({ position }: { position: "left" | "right" }) {
  const positionClass = position === "left" ? "left-0" : "right-0"
  return (
    <div
      className={`side-ad fixed top-[270px] ${positionClass} w-[160px] h-[600px] bg-muted/30 rounded-lg flex flex-col items-center justify-center border border-dashed border-muted-foreground/20 z-10`}
      aria-label={`${position} advertisement`}
    >
      <span className="text-xs text-muted-foreground writing-vertical">Ad</span>
      <span className="ad-size-label text-xs text-muted-foreground mt-1">160 x 600</span>
    </div>
  )
}

export default function Home() {
  const t = useTranslations("Home")

  return (
    <TimerProvider>
      <main className="relative min-h-screen flex flex-col text-foreground">
        {/* Fixed Header Controls */}
        <ThemeToggle />
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
          <UserMenu />
        </div>

        {/* Main Layout with Side Ads (QHD) */}
        <div className="flex-1 pt-16 pb-6 content-area">
          <div className="main-layout flex justify-center items-start gap-4">
            {/* Left Side Ad (QHD only) */}
            <SideAd position="left" />

            {/* 3-Column Content Grid */}
            <div className="dashboard-grid w-full grid grid-cols-1 xl:grid-cols-[570px_minmax(400px,1fr)_570px] gap-6 xl:gap-6 xl:items-stretch">
              {/* Left: Dashboard (오늘 요약, 주간, 월간) */}
              <aside className="hidden xl:flex xl:flex-col gap-4" aria-label="Statistics Dashboard">
                <Suspense fallback={null}>
                  <DashboardLeft />
                </Suspense>
              </aside>

              {/* Center: Timer */}
              <section className="flex flex-col items-center justify-start pt-8 xl:pt-12">
                <div className="text-center mb-4 md:mb-8 px-4">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 hover-title-outline inline-block">
                    {t("title")}
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 hover-phase-label">{t("description")}</p>
                </div>
                <Suspense fallback={<TimerFallback />}>
                  <PomodoroTimer />
                </Suspense>
              </section>

              {/* Right: BGM + Activity Calendar */}
              <aside className="hidden xl:flex xl:flex-col gap-4" aria-label="Music and Calendar">
                <BgmPanel />
                <Suspense fallback={null}>
                  <DashboardRight />
                </Suspense>
              </aside>
            </div>

            {/* Right Side Ad (QHD only) */}
            <SideAd position="right" />
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
          </div>
        </div>

        {/* Ad Banner + Footer */}
        <div className="w-full px-4 xl:px-8 pb-3">
          <div className="max-w-[1800px] mx-auto">
            {/* Ad Banner Placeholder */}
            <div className="w-full h-[90px] bg-muted/30 rounded-lg flex items-center justify-center border border-dashed border-muted-foreground/20 mb-2">
              <span className="text-xs text-muted-foreground">Ad Space</span>
            </div>

            {/* Minimal Footer */}
            <div className="text-center text-xs text-muted-foreground py-1">
              <span>© 2025 pomobox</span>
              <span className="mx-2">·</span>
              <Link href="/privacy" className="hover:text-foreground hover:underline">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </main>
    </TimerProvider>
  )
}
