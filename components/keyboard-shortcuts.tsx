"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Keyboard, ChevronDown } from "lucide-react"

interface Shortcut {
  key: string
  labelKey: string
}

const SHORTCUTS: Shortcut[] = [
  { key: "Space", labelKey: "startPause" },
  { key: "R", labelKey: "reset" },
  { key: "Esc", labelKey: "pause" },
]

export function KeyboardShortcuts() {
  const t = useTranslations("Shortcuts")
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Card className="glass-card border-0">
      <CardContent className="p-3">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-xs text-muted-foreground hover:text-foreground p-0 h-auto"
            >
              <span className="flex items-center gap-2">
                <Keyboard className="h-3.5 w-3.5 text-primary" />
                {t("title")}
              </span>
              <ChevronDown
                className={`h-3 w-3 transition-transform duration-200 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <div className="space-y-1.5 text-xs">
              {SHORTCUTS.map((shortcut) => (
                <div
                  key={shortcut.key}
                  className="flex items-center justify-between px-2 py-1.5 rounded-lg bg-primary/5 border border-primary/10"
                >
                  <span className="text-muted-foreground">{t(shortcut.labelKey)}</span>
                  <kbd className="px-2 py-0.5 text-[10px] font-mono bg-background/50 border border-border/50 rounded-md">
                    {shortcut.key}
                  </kbd>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
