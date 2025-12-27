"use client"

import { useState, useEffect } from "react"
import { useTranslations, useLocale } from "next-intl"
import { useRouter, usePathname } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Check, Bell, Volume2, Globe } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { type SoundCategory, MELODY_SOUNDS, AMBIENT_SOUNDS, getSoundsByCategory, playSound, setVolume } from "@/lib/sounds"
import { routing } from "@/i18n/routing"

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

const FOCUS_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "25 min", value: 25 },
  { label: "45 min", value: 45 },
  { label: "60 min", value: 60 },
]

const BREAK_OPTIONS = [
  { label: "5 min", value: 5 },
  { label: "10 min", value: 10 },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
]

const GOAL_OPTIONS = [
  { label: "60 min", value: 60 },
  { label: "90 min", value: 90 },
  { label: "120 min", value: 120 },
  { label: "180 min", value: 180 },
  { label: "240 min", value: 240 },
]

interface SettingsDialogProps {
  settings: TimerSettings
  isRunning: boolean
  onSettingsChange: (settings: TimerSettings) => void
  buttonClassName?: string
}

export function SettingsDialog({ settings, isRunning, onSettingsChange, buttonClassName }: SettingsDialogProps) {
  const t = useTranslations("Settings")
  const tLanguages = useTranslations("Languages")
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [localSettings, setLocalSettings] = useState<TimerSettings>(settings)
  const [selectedLocale, setSelectedLocale] = useState(locale)
  const [isSaved, setIsSaved] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  useEffect(() => {
    setSelectedLocale(locale)
  }, [locale])

  const handleSave = () => {
    if (isRunning) return
    onSettingsChange(localSettings)
    setIsSaved(true)

    toast({
      title: t("settingsSaved"),
      description: t("settingsUpdated"),
    })

    // Apply language change if different
    if (selectedLocale !== locale) {
      const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?/, '') || '/'
      router.push(`/${selectedLocale}${pathWithoutLocale}`)
    }

    setTimeout(() => {
      setIsSaved(false)
    }, 1000)
  }

  const handleSoundToggle = (checked: boolean) => {
    if (checked && localSettings.volume === 0) {
      setLocalSettings({ 
        ...localSettings, 
        soundEnabled: true,
        volume: 50
      })
    } else {
      setLocalSettings({ 
        ...localSettings, 
        soundEnabled: checked
      })
    }
  }

  // 사운드 테스트
  const handleVolumeTest = () => {
    playSound(localSettings.soundType, localSettings.volume / 100)

    const sounds = getSoundsByCategory(localSettings.soundCategory)
    const selectedSound = sounds.find(s => s.value === localSettings.soundType)
    const soundLabel = selectedSound?.label || "Achievement"
    toast({
      title: "Sound test",
      description: `${soundLabel} - Volume: ${localSettings.volume}%`,
      duration: 1000,
    })
  }

  // 카테고리 변경 시 해당 카테고리의 첫 번째 사운드로 변경
  const handleCategoryChange = (category: SoundCategory) => {
    const sounds = getSoundsByCategory(category)
    setLocalSettings({
      ...localSettings,
      soundCategory: category,
      soundType: sounds[0].value,
    })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="lg" className={`h-12 w-12 ${buttonClassName || ''}`} aria-label="Settings">
          <Settings className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4 overflow-y-auto flex-1 -mr-[23px] pr-[23px] settings-scrollbar">
          {/* Notifications */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-2 hover-section-label cursor-default">
              <Bell className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <div>
                <p className="font-medium">{t("notifications")}</p>
                <p className="text-sm text-muted-foreground">{t("notificationsDescription")}</p>
              </div>
            </div>
            <Switch
              checked={localSettings.notificationsEnabled}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, notificationsEnabled: checked })
              }
              aria-label="Toggle notifications"
              className="hover-toggle"
            />
          </div>

          {/* Sound */}
          <div className="space-y-4">
            <div className="flex items-center justify-between group">
              <div className="flex items-center gap-2 hover-section-label cursor-default">
                <Volume2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <div>
                  <p className="font-medium">{t("sound")}</p>
                  <p className="text-sm text-muted-foreground">{t("soundDescription")}</p>
                </div>
              </div>
              <Switch
                checked={localSettings.soundEnabled}
                onCheckedChange={handleSoundToggle}
                aria-label="Toggle sound"
                className="hover-toggle"
              />
            </div>

            {/* Sound Type & Volume */}
            {localSettings.soundEnabled && (
              <div className="space-y-3 pl-1">
                {/* Sound Category Selection */}
                <div className="space-y-1.5">
                  <span className="text-sm text-muted-foreground pb-0.5">{t("soundCategory")}</span>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={localSettings.soundCategory === 'melody' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleCategoryChange('melody')}
                      className="w-full"
                    >
                      🎵 {t("melody")}
                    </Button>
                    <Button
                      variant={localSettings.soundCategory === 'ambient' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleCategoryChange('ambient')}
                      className="w-full"
                    >
                      🔊 {t("ambient")}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground pt-0.5">
                    {localSettings.soundCategory === 'melody'
                      ? t("melodyDescription")
                      : t("ambientDescription")}
                  </p>
                </div>

                {/* Sound Type Selection */}
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground" id="sound-type-label">{t("soundType")}</span>
                  <Select
                    value={localSettings.soundType}
                    onValueChange={(value) =>
                      setLocalSettings({ ...localSettings, soundType: value })
                    }
                  >
                    <SelectTrigger className="w-full" aria-labelledby="sound-type-label">
                      <SelectValue placeholder={t("selectSound")} />
                    </SelectTrigger>
                    <SelectContent>
                      {getSoundsByCategory(localSettings.soundCategory).map((sound) => (
                        <SelectItem key={sound.value} value={sound.value}>
                          {sound.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Volume Slider */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground" id="volume-label">{t("volume")}</span>
                  <span className="text-sm font-medium">{localSettings.volume}%</span>
                </div>
                <Slider
                  value={[localSettings.volume]}
                  onValueChange={([value]) => {
                    setVolume(value / 100)
                    setLocalSettings({ ...localSettings, volume: value })
                  }}
                  max={100}
                  step={1}
                  className="w-full"
                  aria-labelledby="volume-label"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVolumeTest}
                  className="w-full"
                >
                  {t("testSound")}
                </Button>
              </div>
            )}
          </div>

          {/* Language */}
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-2 hover-section-label cursor-default">
              <Globe className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <div>
                <p className="font-medium">{t("language")}</p>
              </div>
            </div>
            <Select value={selectedLocale} onValueChange={setSelectedLocale}>
              <SelectTrigger className="w-[140px]" aria-label="Select language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {routing.locales.map((loc) => (
                  <SelectItem key={loc} value={loc}>
                    {tLanguages(loc)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Focus Duration */}
          <div>
            <p className="font-medium mb-3">{t("focusDuration")}</p>
            <div className="grid grid-cols-4 gap-2">
              {FOCUS_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={localSettings.focusDuration === option.value ? "default" : "outline"}
                  size="sm"
                  disabled={isRunning}
                  onClick={() => setLocalSettings({ ...localSettings, focusDuration: option.value })}
                  className="hover:scale-105 transition-transform duration-150"
                >
                  {t("min", { value: option.value })}
                </Button>
              ))}
            </div>
          </div>

          {/* Break Duration */}
          <div>
            <p className="font-medium mb-3">{t("breakDuration")}</p>
            <div className="grid grid-cols-4 gap-2">
              {BREAK_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={localSettings.breakDuration === option.value ? "default" : "outline"}
                  size="sm"
                  disabled={isRunning}
                  onClick={() => setLocalSettings({ ...localSettings, breakDuration: option.value })}
                  className="hover:scale-105 transition-transform duration-150"
                >
                  {t("min", { value: option.value })}
                </Button>
              ))}
            </div>
          </div>

          {/* Daily Goal */}
          <div>
            <p className="font-medium mb-3">{t("dailyGoal")}</p>
            <div className="grid grid-cols-5 gap-2">
              {GOAL_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={localSettings.dailyGoal === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLocalSettings({ ...localSettings, dailyGoal: option.value })}
                  className="hover:scale-105 transition-transform duration-150"
                >
                  {option.value}
                </Button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">{t("dailyGoalDescription")}</p>
          </div>

          <Button
            onClick={handleSave}
            className="w-full hover-glow"
            disabled={isSaved || isRunning}
          >
            {isSaved ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                {t("saved")}
              </>
            ) : (
              t("saveChanges")
            )}
          </Button>
          {isRunning && (
            <p className="text-sm text-muted-foreground">
              {t("stopTimerWarning")}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
