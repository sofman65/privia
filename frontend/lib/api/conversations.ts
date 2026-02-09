import { getToken } from "@/lib/auth"
import { apiFetch } from "./client"

// ---- Types matching backend ConversationOut ----

export interface ConversationApi {
  id: string
  title: string
  status: "empty" | "active"
  messages: { role: string; content: string; timestamp: string }[]
  created_at: string
  updated_at: string
}

export interface ConversationListItemApi {
  id: string
  title: string
  created_at: string
  updated_at: string
  message_count: number
}

// ---- Helpers ----

function authHeaders(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ---- API calls ----

/**
 * Idempotent create-or-return-empty conversation.
 * Backend will return an existing empty conversation if one exists,
 * or create a new one (subject to rate-limit).
 */
export async function createConversation(
  title?: string,
): Promise<ConversationApi> {
  return apiFetch<ConversationApi>("/api/conversations", {
    method: "POST",
    body: JSON.stringify(title ? { title } : {}),
    headers: authHeaders(),
  })
}

export async function listConversations() {
  return apiFetch<ConversationListItemApi[]>("/api/conversations", {
    headers: authHeaders(),
  })
}

export async function getConversation(id: string) {
  return apiFetch<ConversationApi>(`/api/conversations/${id}`, {
    headers: authHeaders(),
  })
}

export async function deleteConversationApi(id: string) {
  return apiFetch<void>(`/api/conversations/${id}`, {
    method: "DELETE",
    headers: authHeaders(),
    skipJson: true,
  })
}

export async function updateConversationTitle(id: string, title: string) {
  return apiFetch<ConversationApi>(`/api/conversations/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ title }),
  })
}
