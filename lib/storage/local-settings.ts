import { type SoundCategory } from "@/lib/sounds"

const SETTINGS_KEY = "pomobox_settings"

export interface TimerSettings {
  focusDuration: number
  breakDuration: number
  dailyGoal: number
  notificationsEnabled: boolean
  soundEnabled: boolean
  soundCategory: SoundCategory
  soundType: string
  volume: number
}

export const DEFAULT_SETTINGS: TimerSettings = {
  focusDuration: 25,
  breakDuration: 5,
  dailyGoal: 120,
  notificationsEnabled: false,
  soundEnabled: true,
  soundCategory: "melody",
  soundType: "achievement",
  volume: 50,
}

/**
 * 설정 조회 (localStorage)
 */
export function getLocalSettings(): TimerSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS

  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (!stored) return DEFAULT_SETTINGS
    return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) }
  } catch {
    return DEFAULT_SETTINGS
  }
}

/**
 * 설정 저장 (localStorage)
 */
export function saveLocalSettings(settings: TimerSettings): void {
  if (typeof window === "undefined") return

  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (error) {
    console.error("Failed to save settings:", error)
  }
}

/**
 * 일일 목표만 조회 (DashboardLeft용)
 */
export function getDailyGoal(): number {
  const settings = getLocalSettings()
  return settings.dailyGoal
}
