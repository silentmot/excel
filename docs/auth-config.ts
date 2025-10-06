import NextAuth from "next-auth"
import AzureADProvider from "next-auth/providers/azure-ad"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
      authorization: {
        params: {
          scope: "openid email profile User.Read"
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // CRITICAL: Enforce @sirc.sa domain restriction
      const email = user.email || (profile as { email?: string })?.email
      
      if (!email) {
        console.error("Sign-in attempt without email")
        return false
      }
      
      if (!email.endsWith('@sirc.sa')) {
        console.error(`Sign-in rejected: ${email} is not a @sirc.sa domain`)
        return false
      }
      
      console.log(`Sign-in approved: ${email}`)
      return true
    },
    async session({ session, user }) {
      // Add user ID to session for database queries
      if (session.user) {
        session.user.id = user.id
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
})
