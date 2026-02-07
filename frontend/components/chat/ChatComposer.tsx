"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { PlaceholdersAndVanishInput } from "@/components/ui/placeholders-and-vanish-input"
import { Square, Plus } from "lucide-react"

export interface ChatComposerProps {
  value: string
  onChange: (value: string) => void
  onSend: (text?: string) => void
  onNewConversation: () => void
  onStop: () => void
  isLoading: boolean
  isConnected: boolean
}

export function ChatComposer({
  value,
  onChange,
  onSend,
  onNewConversation,
  onStop,
  isLoading,
  isConnected,
}: ChatComposerProps) {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const placeholders = [
    "Ask about your release notes…",
    "Draft a customer follow-up",
    "Summarize the last thread",
    "Generate a policy reminder",
    "Turn notes into a handoff",
  ]

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (isLoading || !localValue.trim()) return
    onSend(localValue)
  }

  return (
    <div className="mx-auto max-w-4xl px-3">
 

        <div className="flex-1 min-w-0">
          <PlaceholdersAndVanishInput
            placeholders={placeholders}
            onChange={(e) => {
              setLocalValue(e.target.value)
              onChange(e.target.value)
            }}
            onSubmit={handleSubmit}
          />
        </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Privia · Privacy-first AI chat workspace {isConnected ? "• Connected" : "• Offline mode"}
      </p>
    </div>
  )
}
