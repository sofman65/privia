export type Role = "user" | "assistant"
export type Mode = "rag" | "chat" | "error" | string

export interface Message {
  role: Role
  content: string
  sources?: string[]
  timestamp: Date
  mode?: Mode
}
