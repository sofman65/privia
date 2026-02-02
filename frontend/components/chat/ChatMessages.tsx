import { ChatMessage } from "@/components/chat/ChatMessage"
import { ChatLoading } from "@/components/chat/ChatLoading"
import { EmptyState } from "@/components/chat/EmptyState"
import type { Message } from "@/lib/chat/types"

interface ChatMessagesProps {
  messages: Message[]
  isLoading: boolean
  onRegenerate: () => void
  onPromptClick: (text: string) => void
}

export function ChatMessages({ messages, isLoading, onRegenerate, onPromptClick }: ChatMessagesProps) {
  const showEmptyState = messages.length === 0
  const lastMessage = messages[messages.length - 1]
  const showRetrievalLoader = isLoading && lastMessage?.mode === "rag"
  const showChatLoader = isLoading && !showRetrievalLoader

  if (showEmptyState) {
    return <EmptyState onPromptClick={onPromptClick} />
  }

  return (
    <div className="space-y-6">
      {messages.map((message, index) => (
        <ChatMessage
          key={index}
          message={message}
          isLast={index === messages.length - 1}
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
