"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChatSidebar } from "@/components/chat/ChatSidebar"
import { ChatMessages } from "@/components/chat/ChatMessages"
import { SettingsModal } from "@/components/chat/SettingsModal"
import { ChatComposer } from "@/components/chat/ChatComposer"
import { ChatScrollButton } from "@/components/chat/ChatScrollButton"
import { useConversations } from "@/hooks/useConversations"
import { useHermesWS } from "@/hooks/useHermesWS"
import { useHermesSSE } from "@/hooks/useHermesSSE"
import { Conversation } from "@/lib/chat/types"
import { cn } from "@/lib/utils"

export default function PriviaChat() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [input, setInput] = useState("")
  const [backendUrl] = useState(process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
  const [showScrollButton, setShowScrollButton] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [useSSE, setUseSSE] = useState(true) // Use SSE by default (ChatGPT-style)
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

  const currentConversationId = currentConversation?.id ?? state.currentConversationId
  const messages = currentConversation?.messages || []

  const visibleMessages = messages.filter(
    (m) =>
      !(
        m.role === "assistant" &&
        (m.content === "" || m.content.toLowerCase().includes("welcome to privia"))
      ),
  )

  // Redirect to login if no token
  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null
    if (!token) {
      window.location.href = "/login"
    }
  }, [])

  const wsHandlers = useMemo(
    () => ({
      onSources: (sources: string[], mode?: string) => {
        setSources(currentConversationId, sources, mode)
      },
      onToken: (content: string, mode?: string) => {
        // For SSE: content is the FULL accumulated answer
        // For WS: content might be a token to append
        updateAssistantMessage(currentConversationId, (msg:any) => {
          // SSE sends full content, WS sends incremental tokens
          // Check if this looks like a full replacement (longer than current + token)
          const isFullContent = content.length > msg.content.length + 50 || msg.content === ""
          if (isFullContent || mode === "rag") {
            return { ...msg, content, mode }
          }
          return { ...msg, content: msg.content + content, mode }
        })
      },
      onDone: () => {},
      onError: (msg: string) => {
        updateAssistantMessage(currentConversationId, (m:any) => ({ ...m, content: `Error: ${msg}`, mode: "error" }))
      },
    }),
    [currentConversationId, setSources, updateAssistantMessage],
  )

  // Use SSE or WebSocket based on toggle
  const wsConnection = useHermesWS(backendUrl, wsHandlers)
  const sseConnection = useHermesSSE(backendUrl, wsHandlers)
  
  const { isConnected, isLoading, sendMessage, stopGeneration } = useSSE ? sseConnection : wsConnection

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    if (isLoading || visibleMessages.length > 0) {
      scrollToBottom()
    }
  }, [visibleMessages.length, isLoading, scrollToBottom])

  // Handle scroll to show/hide scroll button
  const handleScroll = useCallback(
    (e: any) => {
      const element = e.target
      const isNearBottom = element.scrollHeight - element.scrollTop - element.clientHeight < 100
      setShowScrollButton(!isNearBottom && visibleMessages.length > 0)
    },
    [visibleMessages.length],
  )

  const handleSend = useCallback(
    async (text?: string) => {
      const messageToSend = text || input
      if (!messageToSend.trim() || isLoading) return

      const convId = currentConversationId
      const conversation = state.conversations.find((c) => c.id === convId)
      const isFirstUserMessage = conversation ? conversation.messages.length === 1 && conversation.messages[0].role === "assistant" : false

      addUserMessage(convId, messageToSend, new Date())
      if (isFirstUserMessage) {
        updateTitle(convId, messageToSend.slice(0, 40) + (messageToSend.length > 40 ? "..." : ""))
      }
      addAssistantMessage(convId, "", new Date())
      setInput("")
      await sendMessage(messageToSend)
    },
    [addAssistantMessage, addUserMessage, currentConversationId, input, isLoading, sendMessage, state.conversations, updateTitle],
  )

  const handleRegenerate = useCallback(() => {
    const lastUserMessage = messages.filter((m) => m.role === "user").pop()
    if (lastUserMessage && !isLoading) {
      handleSend(lastUserMessage.content)
    }
  }, [handleSend, isLoading, messages])

  const createNewConversation = () => {
    const now = new Date()
    const conv: Conversation = {
      id: Date.now().toString(),
      title: "New conversation",
      messages: [
        {
          role: "assistant",
          content:
            "Welcome to Privia. I’m your private workspace assistant—ask anything about your workstreams, documents, or product plans and I’ll keep it organized here.",
          timestamp: now,
        },
      ],
      createdAt: now,
      updatedAt: now,
    }
    newConversation(conv)
  }

  const handleDeleteConversation = (id: string) => {
    deleteConversation(id)
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/login"
  }

  return (
    <div className={cn("flex h-screen w-full flex-col md:flex-row overflow-hidden bg-background")}>
      <ChatSidebar
        conversations={state.conversations}
        currentId={currentConversationId}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onNewConversation={createNewConversation}
        onDelete={handleDeleteConversation}
        onSelect={setCurrentConversation}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleLogout={handleLogout}
        onOpenSettings={() => setSettingsOpen(true)}
      />

      <SettingsModal open={settingsOpen} onOpenChange={setSettingsOpen} />

      <div className="flex flex-1 overflow-hidden">
        <div className="mx-auto flex w-full max-w-5xl flex-col relative">
          <ScrollArea className="flex-1 px-6 py-8" onScrollCapture={handleScroll}>
            <ChatMessages
              messages={visibleMessages}
              isLoading={isLoading}
              onRegenerate={handleRegenerate}
              onPromptClick={(text) => handleSend(text)}
            />
            <div ref={messagesEndRef} />
          </ScrollArea>

          <ChatScrollButton visible={showScrollButton} onClick={scrollToBottom} />

          <div className="">
            <ChatComposer
              value={input}
              onChange={setInput}
              onSend={() => handleSend()}
              onNewConversation={createNewConversation}
              onStop={stopGeneration}
              isLoading={isLoading}
              isConnected={isConnected}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
