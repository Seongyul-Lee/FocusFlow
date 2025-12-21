"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Settings, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export interface TimerSettings {
  focusDuration: number
  breakDuration: number
  notificationsEnabled: boolean
  soundEnabled: boolean
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
    }, 2000)
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
    const audio = new Audio("data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGGS57OihUhELTKXh8bllHAU2jdXyz3YnBSp+zPDajzsIEViy6OyrWBUIQ5zd8sFuJAUwhM/x1YU5CBZnvezno1QTCkml4PG6aB4EOIzU8dF0KAYAAAA=")
    audio.volume = localSettings.volume / 100
    audio.play()
    
    toast({
      title: "Sound test",
      description: `Volume: ${localSettings.volume}%`,
      duration: 1000,
    })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="lg" className="absolute top-4 right-4 h-12 w-12">
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
            <div>
              <p className="font-medium">Notifications</p>
              <p className="text-sm text-muted-foreground">Get notified when timer ends</p>
            </div>
            <Switch
              checked={localSettings.notificationsEnabled}
              onCheckedChange={(checked) =>
                setLocalSettings({ ...localSettings, notificationsEnabled: checked })
              }
            />
          </div>

          {/* Sound */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sound</p>
                <p className="text-sm text-muted-foreground">Play sound when timer ends</p>
              </div>
              <Switch
                checked={localSettings.soundEnabled}
                onCheckedChange={handleSoundToggle}
              />
            </div>
            
            {/* Volume Slider */}
            {localSettings.soundEnabled && (
              <div className="space-y-3 pl-1">
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
