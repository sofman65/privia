import { useCallback, useEffect, useRef, useState } from "react"
import { chatUrls, queryChat } from "@/lib/api/chat"
import { getToken } from "@/lib/auth"

type Handlers = {
  onSources: (sources: string[], mode?: string) => void
  onToken: (content: string, mode?: string) => void
  onDone: (data?: any) => void
  onError: (msg: string) => void
}

export function useChatWS(handlers: Handlers) {
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const reconnectAttempts = useRef(0)
  const maxReconnectAttempts = 3
  const handlersRef = useRef<Handlers>(handlers)
  const socketRef = useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isUnmountedRef = useRef(false)

  useEffect(() => {
    handlersRef.current = handlers
  }, [handlers])

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
  }, [])

  const connect = useCallback(() => {
    if (isUnmountedRef.current) return
    if (reconnectAttempts.current >= maxReconnectAttempts) return

    const currentSocket = socketRef.current
    if (currentSocket && (currentSocket.readyState === WebSocket.OPEN || currentSocket.readyState === WebSocket.CONNECTING)) {
      return
    }

    try {
      const token = getToken()
      const baseWsUrl = chatUrls.ws()
      const wsUrl = token
        ? `${baseWsUrl}${baseWsUrl.includes("?") ? "&" : "?"}token=${encodeURIComponent(token)}`
        : baseWsUrl

      const socket = new WebSocket(wsUrl)
      socketRef.current = socket

      socket.onopen = () => {
        if (isUnmountedRef.current) return
        setIsConnected(true)
        reconnectAttempts.current = 0
        clearReconnectTimeout()
      }

      socket.onclose = () => {
        if (socketRef.current === socket) {
          socketRef.current = null
        }
        if (isUnmountedRef.current) return

        setIsConnected(false)
        reconnectAttempts.current += 1
        if (reconnectAttempts.current < maxReconnectAttempts) {
          clearReconnectTimeout()
          reconnectTimeoutRef.current = setTimeout(connect, 3000)
        }
      }

      socket.onerror = () => {
        if (isUnmountedRef.current) return
        setIsConnected(false)
      }

      socket.onmessage = (event) => {
        try {
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
        } catch {
          handlersRef.current.onError("Invalid websocket payload")
          setIsLoading(false)
        }
      }
    } catch {
      setIsConnected(false)
    }
  }, [clearReconnectTimeout])

  useEffect(() => {
    isUnmountedRef.current = false
    connect()

    return () => {
      isUnmountedRef.current = true
      clearReconnectTimeout()
      const socket = socketRef.current
      socketRef.current = null
      if (socket) {
        socket.onopen = null
        socket.onclose = null
        socket.onerror = null
        socket.onmessage = null
        if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
          socket.close()
        }
      }
    }
  }, [clearReconnectTimeout, connect])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== "visible") return
      reconnectAttempts.current = 0
      connect()
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [connect])

  const sendMessage = async (question: string, conversationId?: string) => {
    setIsLoading(true)

    const socket = socketRef.current
    if (socket && socket.readyState === WebSocket.OPEN) {
      const payload: { question: string; conversation_id?: string } = { question }
      if (conversationId) payload.conversation_id = conversationId
      socket.send(JSON.stringify(payload))
      return
    }

    // REST fallback
    try {
      const data = await queryChat(question, conversationId)
      const h = handlersRef.current
      h.onToken(data.answer, data.mode)
      h.onSources(data.sources || [], data.mode)
      h.onDone(data)
    } catch (err: any) {
      handlersRef.current.onError(err.message || "Backend error")
    } finally {
      setIsLoading(false)
    }
  }

  const stopGeneration = () => {
    setIsLoading(false)
    const socket = socketRef.current
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "stop" }))
    }
  }

  return {
    isConnected,
    isLoading,
    sendMessage,
    stopGeneration,
  }
}
