"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <Button variant="ghost" size="lg" className="h-12 w-12" aria-label="Toggle theme" disabled />
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Button
        variant="ghost"
        size="lg"
        className="h-12 w-12 bg-white/90 dark:bg-zinc-800/90 backdrop-blur-sm rounded-full shadow-lg hover:shadow-xl transition-all"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        aria-label="Toggle theme"
      >
        {resolvedTheme === "dark" ? (
          <Sun className="h-6 w-6" />
        ) : (
          <Moon className="h-6 w-6" />
        )}
      </Button>
    </div>
  )
}
