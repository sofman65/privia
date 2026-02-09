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

import { getToken } from "@/lib/auth"
import {
  createConversation,
  deleteConversationApi,
  getConversation,
  listConversations,
  updateConversationTitle,
  type ConversationApi,
} from "@/lib/api/conversations"
import type { Conversation, Message } from "@/types/chat"

const toConversation = (apiConv: ConversationApi): Conversation => ({
  id: apiConv.id,
  title: apiConv.title,
  messages: apiConv.messages.map((message) => ({
    role: message.role as Message["role"],
    content: message.content,
    timestamp: new Date(message.timestamp),
  })),
  createdAt: new Date(apiConv.created_at),
  updatedAt: new Date(apiConv.updated_at),
})

export default function PriviaChatPage() {
  const [input, setInput] = useState("")
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [useSSE] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isHydrating, setIsHydrating] = useState(true)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    state,
    currentConversation,
    setConversations,
    replaceConversationId,
    setCurrentConversation,
    addUserMessage,
    addAssistantMessage,
    updateAssistantMessage,
    setSources,
    setMode,
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

  // --- Auth + conversation bootstrap
  useEffect(() => {
    let isCancelled = false

    const bootstrap = async () => {
      const token = getToken()
      if (!token) {
        window.location.href = "/login"
        return
      }

      try {
        const summaries = await listConversations()
        if (isCancelled) return

        if (summaries.length) {
          const fullConversations = await Promise.all(
            summaries.map(async (summary) => {
              try {
                return await getConversation(summary.id)
              } catch (error) {
                console.error(`Failed to load conversation ${summary.id}`, error)
                return null
              }
            }),
          )

          if (isCancelled) return

          const mapped = fullConversations
            .filter((conversation): conversation is ConversationApi => conversation !== null)
            .map(toConversation)

          if (mapped.length) {
            setConversations(mapped, mapped[0].id)
          } else {
            const apiConv = await createConversation()
            if (isCancelled) return
            const first = toConversation(apiConv)
            setConversations([first], first.id)
          }
        } else {
          const apiConv = await createConversation()
          if (isCancelled) return
          const first = toConversation(apiConv)
          setConversations([first], first.id)
        }
      } catch (error) {
        console.error("Failed to bootstrap conversations", error)
        try {
          const apiConv = await createConversation()
          if (isCancelled) return
          const first = toConversation(apiConv)
          setConversations([first], first.id)
        } catch (createError) {
          console.error("Failed to create fallback conversation", createError)
        }
      } finally {
        if (!isCancelled) {
          setIsHydrating(false)
        }
      }
    }

    bootstrap()

    return () => {
      isCancelled = true
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
      onDone: (data?: {
        conversation_id?: string
        mode?: string
        sources?: string[]
      }) => {
        const backendConversationId = data?.conversation_id
        const nextConversationId = backendConversationId ?? currentConversationId

        if (backendConversationId && backendConversationId !== currentConversationId) {
          replaceConversationId(currentConversationId, backendConversationId)
          setCurrentConversation(backendConversationId)
        }

        if (data?.mode) {
          setMode(nextConversationId, data.mode)
        }

        if (data?.sources) {
          setSources(nextConversationId, data.sources, data.mode)
        }
      },
      onError: (msg: string) => {
        updateAssistantMessage(currentConversationId, (m: Message) => ({
          ...m,
          content: `Error: ${msg}`,
          mode: "error",
        }))
      },
    }),
    [
      currentConversationId,
      replaceConversationId,
      setCurrentConversation,
      setMode,
      setSources,
      updateAssistantMessage,
    ],
  )

  const ws = useChatWS(handlers)
  const sse = useChatSSE(handlers)

  const { isConnected, isLoading, sendMessage, stopGeneration } =
    useSSE ? sse : ws

  // Keep mobile overlays mutually exclusive.
  useEffect(() => {
    if (settingsOpen && sidebarOpen) {
      setSidebarOpen(false)
    }
  }, [settingsOpen, sidebarOpen])

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
      if (!message.trim() || isLoading || isHydrating) return

      const convId = currentConversationId
      const conv = state.conversations.find((c: Conversation) => c.id === convId)
      const firstUser = !conv || conv.messages.every((m: Message) => m.role !== "user")

      addUserMessage(convId, message, new Date())

      if (firstUser) {
        const firstTitle = message.slice(0, 40) + (message.length > 40 ? "…" : "")
        updateTitle(
          convId,
          firstTitle,
        )
        if (convId !== "1") {
          void updateConversationTitle(convId, firstTitle).catch((error) => {
            console.error(`Failed to persist title for conversation ${convId}`, error)
          })
        }
      }

      addAssistantMessage(convId, "", new Date())
      setInput("")
      const conversationIdForApi = convId === "1" ? undefined : convId
      await sendMessage(message, conversationIdForApi)
    },
    [
      addAssistantMessage,
      addUserMessage,
      currentConversationId,
      input,
      isHydrating,
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
    if (isHydrating) return

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
      const conv = toConversation(apiConv)
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
  }, [hasEmptyActiveChat, isCreatingChat, isHydrating, newConversation, setCurrentConversation, state.conversations])

  const handleDeleteConversation = useCallback(
    async (conversationId: string) => {
      try {
        if (conversationId !== "1") {
          await deleteConversationApi(conversationId)
        }
        deleteConversation(conversationId)
      } catch (error) {
        console.error(`Failed to delete conversation ${conversationId}`, error)
      }
    },
    [deleteConversation],
  )

  const handleOpenSettings = useCallback(() => {
    setSidebarOpen(false)
    setSettingsOpen(true)
  }, [])

  return (
    <div className="flex flex-col md:flex-row h-screen w-full min-h-0 overflow-hidden bg-background">
      <ChatSidebar
        conversations={state.conversations}
        currentId={currentConversationId}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onNewConversation={handleNewConversation}
        isCreatingChat={isCreatingChat}
        onDelete={handleDeleteConversation}
        onSelect={setCurrentConversation}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenSettings={handleOpenSettings}
      />

      <main className="flex-1 min-w-0 min-h-0 overflow-hidden flex flex-col">
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
