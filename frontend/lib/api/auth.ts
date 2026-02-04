import { apiFetch } from "./client"
import type { TokenResponse, UserProfile } from "@/types/auth"

export const login = (email: string, password: string) => {
  const formData = new FormData()
  formData.append("username", email)
  formData.append("password", password)

  return apiFetch<TokenResponse>("/api/auth/login", {
    method: "POST",
    body: formData,
    // Let fetch set Content-Type for FormData
    headers: {},
  })
}

export const signup = (email: string, password: string, fullName?: string) =>
  apiFetch<void>("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
      full_name: fullName || email,
    }),
  })

export const getProfile = (token: string) =>
  apiFetch<UserProfile>("/api/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
