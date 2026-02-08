"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { cn } from "@/lib/utils"

type ThemeToggleProps = {
  className?: string
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const current: "dark" | "light" = resolvedTheme === "light" ? "light" : "dark"
  const next = current === "dark" ? "light" : "dark"

  return (
    <button
      type="button"
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/60 bg-background/50 text-muted-foreground transition-colors",
        "hover:border-foreground/20 hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        className,
      )}
      aria-label={mounted ? `Switch to ${next} theme` : "Toggle theme"}
      title={mounted ? `Switch to ${next}` : "Toggle theme"}
      onClick={() => setTheme(next)}
    >
      {mounted ? (
        current === "dark" ? (
          <Sun className="h-4 w-4" />
        ) : (
          <Moon className="h-4 w-4" />
        )
      ) : (
        <span className="h-4 w-4" aria-hidden />
      )}
    </button>
  )
}

