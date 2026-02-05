import { env } from "@/lib/env"
import { apiFetch } from "./client"

export const chatUrls = {
  stream: () => `${env.apiUrl}/api/stream`,
  ws: () => `${env.wsUrl}/api/ws/chat`,
}

export const queryChat = (question: string) =>
  apiFetch<{ answer: string; sources?: string[]; mode?: string }>("/api/query", {
    method: "POST",
    body: JSON.stringify({ question }),
  })
