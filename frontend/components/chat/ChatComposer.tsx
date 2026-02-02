"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { TextareaAutosize } from "@/components/ui/textarea-autosize"
import { Send, Square, Plus, Mic } from "lucide-react"

export interface ChatComposerProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
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
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading && value.trim()) {
        onSend()
      }
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="relative flex items-center gap-3 rounded-full border border-border bg-card px-3 py-2 shadow-sm">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
          onClick={onNewConversation}
          aria-label="New conversation"
        >
          <Plus className="h-4 w-4" />
        </Button>

        <TextareaAutosize
          placeholder="Ask anything…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          minRows={1}
          maxRows={6}
          disabled={isLoading}
          className="flex-1 resize-none border-0 bg-transparent px-1 py-2 text-sm focus-visible:ring-0 focus-visible:ring-offset-0"
        />

        <div className="flex items-center gap-2 pr-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Voice input (coming soon)"
            disabled
          >
            <Mic className="h-4 w-4" />
          </Button>

          {isLoading ? (
            <Button
              size="icon"
              variant="destructive"
              className="shrink-0 h-10 w-10 rounded-full"
              onClick={onStop}
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="icon"
              disabled={!value.trim()}
              onClick={onSend}
              className="shrink-0 h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Privia · Privacy-first AI chat workspace {isConnected ? "• Connected" : "• Offline mode"}
      </p>
    </div>
  )
}
