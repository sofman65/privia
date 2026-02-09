import { ChatMessage } from "@/components/chat/ChatMessage"
import { ChatLoading } from "@/components/chat/ChatLoading"
import { EmptyState } from "@/components/chat/EmptyState"
import type { ChatMessagesProps } from "@/types/chat"

export function ChatMessages({ messages, isLoading, onRegenerate, onPromptClick }: ChatMessagesProps) {
  const showEmptyState = messages.filter((m) => m.content?.trim() !== "").length === 0
  const safeMessages = messages.filter((m) => m.content?.trim() !== "")
  const lastMessage = safeMessages[safeMessages.length - 1]
  const showRetrievalLoader = isLoading && lastMessage?.mode === "rag"
  const showChatLoader = isLoading && !showRetrievalLoader

  if (showEmptyState) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center overflow-hidden">
        <EmptyState onPromptClick={onPromptClick} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {safeMessages.map((message, index) => (
        <ChatMessage
          key={index}
          message={message}
          isLast={index === safeMessages.length - 1}
          isLoading={isLoading}
          onRegenerate={onRegenerate}
        />
      ))}

      {showRetrievalLoader && <ChatLoading variant="rag" />}
      {!showRetrievalLoader && showChatLoader && <ChatLoading variant="chat" />}
      <div aria-hidden />
    </div>
  )
}
