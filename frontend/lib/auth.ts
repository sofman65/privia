const TOKEN_KEY = "token"
const USER_KEY = "user"

export const getToken = () => (typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null)
export const getStoredUser = () => {
  if (typeof window === "undefined") return null
  const raw = localStorage.getItem(USER_KEY)
  return raw ? JSON.parse(raw) : null
}

export const storeAuth = (token: string, user?: unknown) => {
  if (typeof window === "undefined") return
  localStorage.setItem(TOKEN_KEY, token)
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user))
  }
}

export const clearAuth = () => {
  if (typeof window === "undefined") return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}
