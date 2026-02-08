import { env } from "@/lib/env"
import { getToken } from "@/lib/auth"
import { apiFetch } from "./client"

export const chatUrls = {
  stream: () => `${env.apiUrl}/api/stream`,
  ws: () => `${env.wsUrl}/api/ws/chat`,
}

export const queryChat = (question: string) => {
  const token = getToken()
  const headers: Record<string, string> = {}
  if (token) headers["Authorization"] = `Bearer ${token}`
  return apiFetch<{ answer: string; sources?: string[]; mode?: string; conversation_id?: string }>(
    "/api/query",
    {
      method: "POST",
      body: JSON.stringify({ question }),
      headers,
    }
  )
}
