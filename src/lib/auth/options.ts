/**
 * NeuralHub · NextAuth Configuration
 *
 * Supports:
 *   - Email/password (Credentials)
 *   - GitHub OAuth
 *   - Google OAuth
 */

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

declare module "next-auth" {
  interface Session {
    user: { id: string; email: string; name?: string | null; plan: string };
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],

  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days

  pages: {
    signIn: "/auth/login",
    error:  "/auth/error",
  },

  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email",    type: "email"    },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),

    ...(process.env.GITHUB_CLIENT_ID
      ? [GitHubProvider({
          clientId:     process.env.GITHUB_CLIENT_ID!,
          clientSecret: process.env.GITHUB_CLIENT_SECRET!,
        })]
      : []),

    ...(process.env.GOOGLE_CLIENT_ID
      ? [GoogleProvider({
          clientId:     process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        })]
      : []),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },

    async session({ session, token }) {
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where:  { id: token.sub },
          select: { id: true, email: true, name: true, plan: true },
        });
        if (dbUser) {
          session.user = { ...session.user, id: dbUser.id, plan: dbUser.plan };
        }
      }
      return session;
    },
  },

  events: {
    async createUser({ user }) {
      // Seed default plan limits when a user is first created via OAuth
      await prisma.user.update({
        where: { id: user.id },
        data:  {
          plan: "FREE",
          monthlyTokenBudget: BigInt(1_000_000),
          monthlyCostBudget:  5,
        },
      });
    },
  },
};
