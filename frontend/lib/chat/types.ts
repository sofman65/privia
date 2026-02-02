export type Role = "user" | "assistant"
export type Mode = "rag" | "chat" | "error" | string

export interface UserProfile {
  id: string
  email?: string | null
  full_name?: string | null
  role?: string | null
  refresh_token?: string | null
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: UserProfile
}

export interface ApiError {
  detail: string
}

export interface Message {
  role: Role
  content: string
  sources?: string[]
  timestamp: Date
  mode?: Mode
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

export type ChatAction =
  | { type: "ADD_USER_MESSAGE"; conversationId: string; content: string; timestamp: Date }
  | { type: "ADD_ASSISTANT_MESSAGE"; conversationId: string; content?: string; timestamp: Date }
  | {
      type: "UPDATE_ASSISTANT_MESSAGE"
      conversationId: string
      updater: (msg: Message) => Message
    }
  | { type: "SET_SOURCES"; conversationId: string; sources: string[]; mode?: string }
  | { type: "SET_MODE"; conversationId: string; mode: string }
  | { type: "UPDATE_TITLE"; conversationId: string; title: string }
  | { type: "NEW_CONVERSATION"; conversation: Conversation }
  | { type: "DELETE_CONVERSATION"; conversationId: string }
  | { type: "SET_CURRENT"; conversationId: string }

export type ChatSidebarProps = {
  conversations: Conversation[]
  currentId: string
  sidebarOpen: boolean
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>
  onNewConversation: () => void
  onDelete: (id: string) => void
  onSelect: (id: string) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  handleLogout: () => void
  onOpenSettings: () => void
}

export interface ChatComposerProps {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onNewConversation: () => void
  onStop: () => void
  isLoading: boolean
  isConnected: boolean
}