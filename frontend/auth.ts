import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"
import type { TokenResponse } from "@/types/auth"

const backendApiUrl = process.env.BACKEND_API_URL || process.env.NEXT_PUBLIC_API_URL

async function exchangeOAuthForBackendToken(params: {
  provider: string
  providerAccountId: string
  email: string
  fullName?: string | null
  avatarUrl?: string | null
}): Promise<TokenResponse> {
  if (!backendApiUrl) {
    throw new Error("Missing BACKEND_API_URL/NEXT_PUBLIC_API_URL for OAuth exchange")
  }

  const res = await fetch(`${backendApiUrl}/api/auth/oauth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: params.provider,
      provider_account_id: params.providerAccountId,
      email: params.email,
      full_name: params.fullName,
      avatar_url: params.avatarUrl,
    }),
    cache: "no-store",
  })

  if (!res.ok) {
    throw new Error(`Backend OAuth exchange failed with status ${res.status}`)
  }

  return (await res.json()) as TokenResponse
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  providers: [
    GitHub({
      clientId: process.env.CLIENT_ID!,
      clientSecret: process.env.CLIENT_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.provider = account.provider
        token.providerAccountId = account.providerAccountId

        try {
          if (!account.providerAccountId || !user?.email) {
            throw new Error("Missing provider account id or email in OAuth profile")
          }

          const data = await exchangeOAuthForBackendToken({
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            email: user.email,
            fullName: user.name,
            avatarUrl: user.image,
          })

          token.backendAccessToken = data.access_token
          token.backendUser = data.user
          token.oauthExchangeError = undefined
        } catch (error) {
          token.backendAccessToken = undefined
          token.backendUser = undefined
          token.oauthExchangeError =
            error instanceof Error ? error.message : "OAuth exchange failed"
        }
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        const sessionUser = session.user as any
        sessionUser.provider = token.provider as string
        sessionUser.providerAccountId = token.providerAccountId as string
      }
      const mutableSession = session as any
      mutableSession.backendAccessToken = token.backendAccessToken
      mutableSession.backendUser = token.backendUser
      mutableSession.oauthExchangeError = token.oauthExchangeError
      return session
    },
  },
})
