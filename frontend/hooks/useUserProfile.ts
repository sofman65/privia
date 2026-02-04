import { useEffect, useState } from "react"
import { getProfile } from "@/lib/api/auth"
import { getToken } from "@/lib/auth"
import type { UserProfile } from "@/types/auth"

export function useUserProfile() {
  const [userInfo, setUserInfo] = useState<UserProfile | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) return

    const fetchUser = async () => {
      try {
        const data = await getProfile(token)
        setUserInfo({
          full_name: data.full_name,
          role: data.role,
          id: data.id,
          email: data.email,
        })
      } catch {
        // ignore
      }
    }

    fetchUser()
  }, [])

  return userInfo
}
