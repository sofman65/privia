import type { DefaultSession } from "next-auth"
import type { UserProfile } from "@/types/auth"

declare module "next-auth" {
  interface Session {
    user: {
      provider?: string
      providerAccountId?: string
    } & DefaultSession["user"]
    backendAccessToken?: string
    backendUser?: UserProfile
    oauthExchangeError?: string
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    provider?: string
    providerAccountId?: string
    backendAccessToken?: string
    backendUser?: UserProfile
    oauthExchangeError?: string
  }
}
