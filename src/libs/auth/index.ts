import db from "@/models"
import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { JWT } from "next-auth/jwt"
import { User } from "@prisma/client"

declare module "next-auth" {
  interface Session {
    user?: User
  }
}

// Extend the JWT type
declare module "next-auth/jwt" {
  interface JWT {
    user: User
  }
}

export const { auth: session, handlers: authHandlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  providers: [Google],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        token.user = user
      }
      return token
    },
    async session({ session, token }) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      session.user = token.user
      return session
    },
  },
})