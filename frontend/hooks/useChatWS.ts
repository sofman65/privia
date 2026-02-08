import { useEffect, useRef, useState } from "react"
import { chatUrls, queryChat } from "@/lib/api/chat"
import { getToken } from "@/lib/auth"

type Handlers = {
  onSources: (sources: string[], mode?: string) => void
  onToken: (content: string, mode?: string) => void
  onDone: (data?: any) => void
  onError: (msg: string) => void
}

export function useChatWS(handlers: Handlers) {
  const [ws, setWs] = useState<WebSocket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 3
  const handlersRef = useRef<Handlers>(handlers)

  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  useEffect(() => {
    const connect = () => {
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        return
      }
      try {
        const token = getToken()
        const baseWsUrl = chatUrls.ws()
        const wsUrl = token
          ? `${baseWsUrl}${baseWsUrl.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`
          : baseWsUrl
        const socket = new WebSocket(wsUrl)

        socket.onopen = () => {
          setIsConnected(true)
          reconnectAttempts.current = 0
        }

        socket.onclose = () => {
          setIsConnected(false)
          reconnectAttempts.current += 1
          setTimeout(connect, 3000)
        }

        socket.onerror = () => {
          setIsConnected(false)
        }

        socket.onmessage = (event) => {
          const data = JSON.parse(event.data)
          const h = handlersRef.current
          if (data.type === "sources") {
            h.onSources(data.sources || [], data.mode)
          } else if (data.type === "token") {
            h.onToken(data.content, data.mode)
          } else if (data.type === "done") {
            setIsLoading(false)
            h.onDone(data)
          } else if (data.type === "error") {
            setIsLoading(false)
            h.onError(data.content || "Backend error")
          }
        }

        setWs(socket)
      } catch (err: any) {
        setIsConnected(false)
      }
    }

    connect()

    return () => {
      ws?.close()
    }
  }, [])

  const sendMessage = async (question: string, conversationId?: string) => {
    setIsLoading(true)

    if (ws && ws.readyState === WebSocket.OPEN) {
      const payload: { question: string; conversation_id?: string } = { question }
      if (conversationId) payload.conversation_id = conversationId
      ws.send(JSON.stringify(payload))
      return
    }

    // REST fallback
    try {
      const data = await queryChat(question, conversationId)
      handlers.onToken(data.answer, data.mode)
      handlers.onSources(data.sources || [], data.mode)
      handlers.onDone(data)
    } catch (err: any) {
      handlers.onError(err.message || "Backend error")
    } finally {
      setIsLoading(false)
    }
  }

  const stopGeneration = () => {
    setIsLoading(false)
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "stop" }))
    }
  }

  return {
    isConnected,
    isLoading,
    sendMessage,
    stopGeneration,
  }
}
