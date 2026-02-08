"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatSidebar } from "@/components/chat/ChatSidebar"
import { ChatMessages } from "@/components/chat/ChatMessages"
import { SettingsModal } from "@/components/chat/SettingsModal"
import { ChatComposer } from "@/components/chat/ChatComposer"
import { ChatScrollButton } from "@/components/chat/ChatScrollButton"

import { useConversations } from "@/hooks/useConversations"
import { useChatWS } from "@/hooks/useChatWS"
import { useChatSSE } from "@/hooks/useChatSSE"

import { clearAuth, getToken } from "@/lib/auth"
import { createConversation } from "@/lib/api/conversations"
import type { Conversation, Message } from "@/types/chat"

import { cn } from "@/lib/utils"

export default function PriviaChatPage() {
  const [input, setInput] = useState("")
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [useSSE, setUseSSE] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

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
    (m: Message) =>
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
    }
  }, [])

  // --- Streaming handlers
  const handlers = useMemo(
    () => ({
      onSources: (sources: string[], mode?: string) => {
        setSources(currentConversationId, sources, mode)
      },
      onToken: (content: string, mode?: string) => {
        updateAssistantMessage(currentConversationId, (msg: Message) => {
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
        updateAssistantMessage(currentConversationId, (m: Message) => ({
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
      const conv = state.conversations.find((c: Conversation) => c.id === convId)
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
    const lastUser = messages.filter((m: { role: string }) => m.role === "user").pop()
    if (lastUser && !isLoading) {
      handleSend(lastUser.content)
    }
  }, [handleSend, isLoading, messages])

  const [isCreatingChat, setIsCreatingChat] = useState(false)

  const hasEmptyActiveChat = useMemo(
    () => state.conversations.some(
      (c: Conversation) =>
        c.messages.filter((m: Message) => m.role === "user").length === 0
    ),
    [state.conversations],
  )

  const handleNewConversation = useCallback(async () => {
    // Layer 1 guards: block while in-flight, redirect to existing empty chat
    if (isCreatingChat) return
    if (hasEmptyActiveChat) {
      const empty = state.conversations.find(
        (c: Conversation) =>
          c.messages.filter((m: Message) => m.role === "user").length === 0
      )
      if (empty) {
        setCurrentConversation(empty.id)
        return
      }
    }

    setIsCreatingChat(true)
    try {
      const apiConv = await createConversation()
      const conv: Conversation = {
        id: apiConv.id,
        title: apiConv.title,
        messages: apiConv.messages.map((m) => ({
          role: m.role as Message["role"],
          content: m.content,
          timestamp: new Date(m.timestamp),
        })),
        createdAt: new Date(apiConv.created_at),
        updatedAt: new Date(apiConv.updated_at),
      }
      // If backend returned a conv we already have locally, just select it
      const alreadyLocal = state.conversations.find((c: Conversation) => c.id === conv.id)
      if (alreadyLocal) {
        setCurrentConversation(conv.id)
      } else {
        newConversation(conv)
      }
    } catch (err: any) {
      // 429 = rate limited — no need to surface
      if (err?.status !== 429) {
        console.error("Failed to create conversation:", err)
      }
    } finally {
      setIsCreatingChat(false)
    }
  }, [isCreatingChat, hasEmptyActiveChat, state.conversations, newConversation, setCurrentConversation])

  return (
    <div className="flex h-screen w-full min-h-0 overflow-hidden bg-background">
      <ChatSidebar
        conversations={state.conversations}
        currentId={currentConversationId}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onNewConversation={handleNewConversation}
        isCreatingChat={isCreatingChat}
        onDelete={deleteConversation}
        onSelect={setCurrentConversation}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

        <div className="flex flex-1 overflow-hidden min-h-0">
          <div className="mx-auto flex w-full max-w-5xl flex-col relative h-full min-h-0">
          <ScrollArea
            className="flex-1 h-full px-4 py-6 md:px-6 md:py-8 pb-28 min-h-0"
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
            onNewConversation={handleNewConversation}
            onStop={stopGeneration}
            isLoading={isLoading}
            isConnected={isConnected}
          />
          </div>
        </div>
      </main>
    </div>
  )
}
