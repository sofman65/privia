"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatMessages } from "@/components/chat/ChatMessages"
import { SettingsModal } from "@/components/chat/SettingsModal"
import { ChatComposer } from "@/components/chat/ChatComposer"
import { ChatScrollButton } from "@/components/chat/ChatScrollButton"

import { useConversations } from "@/hooks/useConversations"
import { useChatWS } from "@/hooks/useChatWS"
import { useChatSSE } from "@/hooks/useChatSSE"

import { clearAuth, getToken } from "@/lib/auth"

import { cn } from "@/lib/utils"

export default function PriviaChatPage() {
  const [input, setInput] = useState("")
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [useSSE, setUseSSE] = useState(true)
  const [authChecked, setAuthChecked] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    state,
    currentConversation,
    setCurrentConversation,
    addUserMessage,
    addAssistantMessage,
    updateAssistantMessage,
    setSources,
    updateTitle,
    newConversation,
    deleteConversation,
  } = useConversations()

  const currentConversationId =
    currentConversation?.id ?? state.currentConversationId

  const messages = currentConversation?.messages || []

  const visibleMessages = messages.filter(
    (m) =>
      !(
        m.role === "assistant" &&
        (m.content === "" ||
          m.content.toLowerCase().includes("welcome to privia"))
      ),
  )

  // --- Auth gate (temporary, until backend sessions exist)
  useEffect(() => {
    const token = getToken()
    if (!token) {
      window.location.href = "/login"
      return
    }
    setAuthChecked(true)
  }, [])

  // --- Streaming handlers
  const handlers = useMemo(
    () => ({
      onSources: (sources: string[], mode?: string) => {
        setSources(currentConversationId, sources, mode)
      },
      onToken: (content: string, mode?: string) => {
        updateAssistantMessage(currentConversationId, (msg) => {
          const isFull =
            content.length > msg.content.length + 50 || msg.content === ""
          if (isFull || mode === "rag") {
            return { ...msg, content, mode }
          }
          return { ...msg, content: msg.content + content, mode }
        })
      },
      onDone: () => {},
      onError: (msg: string) => {
        updateAssistantMessage(currentConversationId, (m) => ({
          ...m,
          content: `Error: ${msg}`,
          mode: "error",
        }))
      },
    }),
    [currentConversationId, setSources, updateAssistantMessage],
  )

  const ws = useChatWS(handlers)
  const sse = useChatSSE(handlers)

  const { isConnected, isLoading, sendMessage, stopGeneration } =
    useSSE ? sse : ws

  // --- Scroll helpers
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    if (isLoading || visibleMessages.length > 0) {
      scrollToBottom()
    }
  }, [visibleMessages.length, isLoading, scrollToBottom])

  const handleScroll = useCallback(
    (e: any) => {
      const el = e.target
      const nearBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < 100
      setShowScrollButton(!nearBottom && visibleMessages.length > 0)
    },
    [visibleMessages.length],
  )

  // --- Actions
  const handleSend = useCallback(
    async (text?: string) => {
      const message = text || input
      if (!message.trim() || isLoading) return

      const convId = currentConversationId
      const conv = state.conversations.find((c) => c.id === convId)
      const firstUser =
        conv &&
        conv.messages.length === 1 &&
        conv.messages[0].role === "assistant"

      addUserMessage(convId, message, new Date())

      if (firstUser) {
        updateTitle(
          convId,
          message.slice(0, 40) + (message.length > 40 ? "…" : ""),
        )
      }

      addAssistantMessage(convId, "", new Date())
      setInput("")
      await sendMessage(message)
    },
    [
      addAssistantMessage,
      addUserMessage,
      currentConversationId,
      input,
      isLoading,
      sendMessage,
      state.conversations,
      updateTitle,
    ],
  )

  const handleRegenerate = useCallback(() => {
    const lastUser = messages.filter((m) => m.role === "user").pop()
    if (lastUser && !isLoading) {
      handleSend(lastUser.content)
    }
  }, [handleSend, isLoading, messages])

  if (!authChecked) return null

  return (
    <div className={cn("flex h-full w-full flex-col overflow-hidden")}>
      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

      <div className="flex flex-1 overflow-hidden">
        <div className="mx-auto flex w-full max-w-5xl flex-col relative">
          <ScrollArea
            className="flex-1 px-6 py-8"
            onScrollCapture={handleScroll}
          >
            <ChatMessages
              messages={visibleMessages}
              isLoading={isLoading}
              onRegenerate={handleRegenerate}
              onPromptClick={(text) => handleSend(text)}
            />
            <div ref={messagesEndRef} />
          </ScrollArea>

          <ChatScrollButton
            visible={showScrollButton}
            onClick={scrollToBottom}
          />

          <ChatComposer
            value={input}
            onChange={setInput}
            onSend={() => handleSend()}
            onNewConversation={newConversation}
            onStop={stopGeneration}
            isLoading={isLoading}
            isConnected={isConnected}
          />
        </div>
      </div>
    </div>
  )
}
