import { PomodoroTimer } from "@/components/pomodoro-timer"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-950 to-black text-white p-4">
      <div className="text-center mb-4 md:mb-8 px-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
          <svg className="w-48 h-48 sm:w-60 sm:h-60 md:w-72 md:h-72 -rotate-90"></svg>
        </h1>
        <p className="text-gray-400">Stay focused, one session at a time</p>
      </div>
      <PomodoroTimer />
    </main>
  )
}