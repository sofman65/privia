import { ChatAction, ChatState, Conversation } from "@/types/chat"
import { Message } from "@/types/chat"

const createWelcomeConversation = (): Conversation => {
  const now = new Date()
  return {
    id: "1",
    title: "New conversation",
    messages: [
      {
        role: "assistant",
        content:
          "Welcome to Privia. I’m your private workspace assistant—ask anything about your workstreams, documents, or product plans and I’ll keep it organized here.",
        timestamp: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  }
}

export const initialChatState: ChatState = {
  conversations: [createWelcomeConversation()],
  currentConversationId: "1",
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "SET_CONVERSATIONS": {
      if (!action.conversations.length) {
        const welcome = createWelcomeConversation()
        return {
          conversations: [welcome],
          currentConversationId: welcome.id,
        }
      }

      const nextCurrentId =
        action.currentConversationId &&
        action.conversations.some((c) => c.id === action.currentConversationId)
          ? action.currentConversationId
          : action.conversations[0].id

      return {
        conversations: action.conversations,
        currentConversationId: nextCurrentId,
      }
    }

    case "REPLACE_CONVERSATION_ID": {
      const updated = state.conversations.map((conv) =>
        conv.id === action.oldId ? { ...conv, id: action.newId } : conv,
      )

      const deduped = updated.filter(
        (conv, index, all) => all.findIndex((candidate) => candidate.id === conv.id) === index,
      )

      return {
        conversations: deduped,
        currentConversationId:
          state.currentConversationId === action.oldId
            ? action.newId
            : state.currentConversationId,
      }
    }

    case "SET_CURRENT":
      return { ...state, currentConversationId: action.conversationId }

    case "NEW_CONVERSATION":
      return {
        ...state,
        conversations: [action.conversation, ...state.conversations],
        currentConversationId: action.conversation.id,
      }

    case "DELETE_CONVERSATION": {
      const remaining = state.conversations.filter((c) => c.id !== action.conversationId)
      const nextId = remaining[0]?.id ?? createWelcomeConversation().id
      return {
        ...state,
        conversations: remaining.length ? remaining : [createWelcomeConversation()],
        currentConversationId: nextId,
      }
    }

    case "ADD_USER_MESSAGE":
    case "ADD_ASSISTANT_MESSAGE":
    case "UPDATE_ASSISTANT_MESSAGE":
    case "SET_SOURCES":
    case "SET_MODE":
    case "UPDATE_TITLE": {
      const conversations = state.conversations.map((conv) => {
        if (conv.id !== action.conversationId) return conv

        let updatedMessages = conv.messages

        if (action.type === "ADD_USER_MESSAGE") {
          const message: Message = {
            role: "user",
            content: action.content,
            timestamp: action.timestamp,
          }
          updatedMessages = [...conv.messages, message]
        } else if (action.type === "ADD_ASSISTANT_MESSAGE") {
          const message: Message = {
            role: "assistant",
            content: action.content ?? "",
            timestamp: action.timestamp,
          }
          updatedMessages = [...conv.messages, message]
        } else if (action.type === "UPDATE_ASSISTANT_MESSAGE") {
          const newMessages = [...conv.messages]
          const last = newMessages[newMessages.length - 1]
          if (last?.role === "assistant") {
            newMessages[newMessages.length - 1] = action.updater(last)
          }
          updatedMessages = newMessages
        } else if (action.type === "SET_SOURCES") {
          const newMessages = [...conv.messages]
          const last = newMessages[newMessages.length - 1]
          if (last?.role === "assistant") {
            newMessages[newMessages.length - 1] = {
              ...last,
              sources: action.sources,
              mode: (action.mode as Message["mode"]) ?? last.mode,
            }
          }
          updatedMessages = newMessages
        } else if (action.type === "SET_MODE") {
          const newMessages = [...conv.messages]
          const last = newMessages[newMessages.length - 1]
          if (last?.role === "assistant") {
            newMessages[newMessages.length - 1] = { ...last, mode: action.mode as Message["mode"] }
          }
          updatedMessages = newMessages
        } else if (action.type === "UPDATE_TITLE") {
          // title handled below
        }

        const updatedTitle =
          action.type === "UPDATE_TITLE" ? action.title : conv.title

        return {
          ...conv,
          messages: updatedMessages,
          title: updatedTitle,
          updatedAt: new Date(),
        }
      })

      return { ...state, conversations }
    }

    default:
      return state
  }
}
