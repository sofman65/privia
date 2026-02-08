import type { Dispatch, SetStateAction } from "react"

export interface Message {
  role: "user" | "assistant" | "system"
  content: string
  timestamp: Date
  sources?: string[]
  mode?: "chat" | "rag" | "error"
}

export interface Conversation {
  id: string
  title: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

export interface ChatState {
  conversations: Conversation[]
  currentConversationId: string
}

export interface ChatSidebarProps {
  conversations?: Conversation[]
  currentId?: string
  sidebarOpen?: boolean
  setSidebarOpen?: Dispatch<SetStateAction<boolean>>
  onNewConversation: () => void
  isCreatingChat?: boolean
  onDelete: (id: string) => void
  onSelect: (id: string) => void
  searchQuery?: string
  setSearchQuery: (query: string) => void
  handleLogout?: () => void
  onOpenSettings?: () => void
}

export interface ChatComposerProps {
  value: string
  onChange: (value: string) => void
  onSend: (text?: string) => void
  onNewConversation: () => void
  onStop: () => void
  isLoading: boolean
  isConnected: boolean
}

export interface ChatLoadingProps {
  variant: "rag" | "chat"
}

export interface ChatMessageProps {
  message: Message
  isLast: boolean
  isLoading: boolean
  onRegenerate?: () => void
}

export interface ChatMessagesProps {
  messages: Message[]
  isLoading: boolean
  onRegenerate: () => void
  onPromptClick: (text: string) => void
}

export interface ChatScrollButtonProps {
  visible: boolean
  onClick: () => void
}

export interface ChatSourcesProps {
  sources?: string[]
}

export interface EmptyStateProps {
  onPromptClick: (prompt: string) => void
}

export interface MarkdownRendererProps {
  content: string
  className?: string
}

export type MessageFeedback = "up" | "down" | null

export interface MessageActionsProps {
  content: string
  onRegenerate?: () => void
  isAssistant: boolean
  messageId?: string
}

export interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export type ChatAction =
  | { type: "ADD_USER_MESSAGE"; conversationId: string; content: string; timestamp: Date }
  | { type: "ADD_ASSISTANT_MESSAGE"; conversationId: string; content?: string; timestamp: Date }
  | { type: "UPDATE_ASSISTANT_MESSAGE"; conversationId: string; updater: (msg: Message) => Message }
  | { type: "SET_SOURCES"; conversationId: string; sources: string[]; mode?: string }
  | { type: "SET_MODE"; conversationId: string; mode: string }
  | { type: "UPDATE_TITLE"; conversationId: string; title: string }
  | { type: "NEW_CONVERSATION"; conversation: Conversation }
  | { type: "DELETE_CONVERSATION"; conversationId: string }
  | { type: "SET_CURRENT"; conversationId: string }
