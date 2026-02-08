"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { storeAuth } from "@/lib/auth"
import { apiFetch } from "@/lib/api/client"
import type { TokenResponse } from "@/types/auth"

/**
 * OAuth callback page.
 *
 * After NextAuth completes the OAuth flow (Google / GitHub) it redirects here.
 * We read the NextAuth session, send the provider + profile to the FastAPI
 * backend POST /api/auth/oauth, which returns our own JWT + user object.
 * Then we store that JWT and redirect to /app -- same flow as local login.
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

    const exchange = async () => {
      try {
        const data = await apiFetch<TokenResponse>("/api/auth/oauth", {
          method: "POST",
          body: JSON.stringify({
            provider: session.user.provider,
            provider_account_id: session.user.providerAccountId,
            email: session.user.email,
            full_name: session.user.name,
            avatar_url: session.user.image,
          }),
        })
        storeAuth(data.access_token, data.user)
        router.replace("/app")
      } catch (err: any) {
        console.error("OAuth exchange failed:", err)
        setError("Failed to complete sign-in. Please try again.")
      }
    }

    exchange()
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
