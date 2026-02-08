import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"
import Google from "next-auth/providers/google"

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
    async jwt({ token, account }) {
      if (account) {
        token.provider = account.provider
        token.providerAccountId = account.providerAccountId
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).provider = token.provider as string;
        (session.user as any).providerAccountId = token.providerAccountId as string
      }
      return session
    },
  },
})
