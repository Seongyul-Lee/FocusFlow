"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings, Check, Bell, Volume2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SOUND_OPTIONS, playSound } from "@/lib/sounds"

export interface TimerSettings {
  focusDuration: number
  breakDuration: number
  notificationsEnabled: boolean
  soundEnabled: boolean
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

interface SettingsDialogProps {
  settings: TimerSettings
  isRunning: boolean
  onSettingsChange: (settings: TimerSettings) => void
}

export function SettingsDialog({ settings, isRunning, onSettingsChange }: SettingsDialogProps) {
  const [localSettings, setLocalSettings] = useState<TimerSettings>(settings)
  const [isSaved, setIsSaved] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleSave = () => {
    if (isRunning) return
    onSettingsChange(localSettings)
    setIsSaved(true)
    
    toast({
      title: "Settings saved!",
      description: "Your preferences have been updated.",
    })

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

    const selectedSound = SOUND_OPTIONS.find(s => s.value === localSettings.soundType)
    const soundLabel = selectedSound?.label || "Bell (Default)"
    toast({
      title: "Sound test",
      description: `${soundLabel} - Volume: ${localSettings.volume}%`,
      duration: 1000,
    })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="lg" className="absolute top-4 right-4 h-12 w-12" aria-label="Settings">
          <Settings className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="font-medium">Notifications</p>
                <p className="text-sm text-muted-foreground">Get notified when timer ends</p>
              </div>
            </div>
            <Switch
              checked={localSettings.notificationsEnabled}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, notificationsEnabled: checked })
              }
              aria-label="Toggle notifications"
            />
          </div>

          {/* Sound */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Sound</p>
                  <p className="text-sm text-muted-foreground">Play sound when timer ends</p>
                </div>
              </div>
              <Switch
                checked={localSettings.soundEnabled}
                onCheckedChange={handleSoundToggle}
                aria-label="Toggle sound"
              />
            </div>

            {/* Sound Type & Volume */}
            {localSettings.soundEnabled && (
              <div className="space-y-3 pl-1">
                {/* Sound Type Selection */}
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Sound Type</span>
                  <Select
                    value={localSettings.soundType}
                    onValueChange={(value) =>
                      setLocalSettings({ ...localSettings, soundType: value })
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a sound" />
                    </SelectTrigger>
                    <SelectContent>
                      {SOUND_OPTIONS.map((sound) => (
                        <SelectItem key={sound.value} value={sound.value}>
                          {sound.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Volume Slider */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Volume</span>
                  <span className="text-sm font-medium">{localSettings.volume}%</span>
                </div>
                <Slider
                  value={[localSettings.volume]}
                  onValueChange={([value]) =>
                    setLocalSettings({ ...localSettings, volume: value })
                  }
                  max={100}
                  step={1}
                  className="w-full"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleVolumeTest}
                  className="w-full"
                >
                  Test Sound
                </Button>
              </div>
            )}
          </div>

          {/* Focus Duration */}
          <div>
            <p className="font-medium mb-3">Focus Duration</p>
            <div className="grid grid-cols-4 gap-2">
              {FOCUS_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={localSettings.focusDuration === option.value ? "default" : "outline"}
                  size="sm"
                  disabled={isRunning}
                  onClick={() => setLocalSettings({ ...localSettings, focusDuration: option.value })}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Break Duration */}
          <div>
            <p className="font-medium mb-3">Break Duration</p>
            <div className="grid grid-cols-4 gap-2">
              {BREAK_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={localSettings.breakDuration === option.value ? "default" : "outline"}
                  size="sm"
                  disabled={isRunning}
                  onClick={() => setLocalSettings({ ...localSettings, breakDuration: option.value })}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            className="w-full"
            disabled={isSaved || isRunning}
          >
            {isSaved ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Saved!
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
          {isRunning && (
            <p className="text-sm text-muted-foreground">
              Stop the timer to change durations.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
