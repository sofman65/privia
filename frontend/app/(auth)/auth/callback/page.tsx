"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { storeAuth } from "@/lib/auth"

/**
 * OAuth callback page.
 *
 * After NextAuth completes OAuth, the backend token is already exchanged
 * server-side in NextAuth callbacks. We only persist it in browser storage
 * and redirect to /app.
 */
export default function OAuthCallbackPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [error, setError] = useState("")
  const [exchanged, setExchanged] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.replace("/login")
      return
    }
    if (!session?.user || exchanged) return

    setExchanged(true)

    const token = session.backendAccessToken
    if (!token) {
      setError(session.oauthExchangeError || "Failed to complete sign-in. Please try again.")
      return
    }

    storeAuth(token, session.backendUser)
    router.replace("/app")
  }, [session, status, router, exchanged])

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="text-sm text-accent hover:underline"
          >
            Back to login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="text-sm">Completing sign-in...</p>
      </div>
    </div>
  )
}
