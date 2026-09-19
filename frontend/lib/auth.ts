// NextAuth конфиг.
// MVP: email + password (Credentials). Magic-link на nodemailer добавим, когда подключим SMTP.
// VK ID is enabled when the application ID is configured.

import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./db";
import { createVKIDProvider } from "./auth-vkid";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).max(200),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/cabinet",
  },
  providers: [
    ...(process.env.VK_ID_CLIENT_ID ? [createVKIDProvider()] : []),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Пароль", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user || !user.passwordHash) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        if (user.status === "banned") return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? undefined,
          image: user.image ?? undefined,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "vkid") {
        const linked = await prisma.account.findUnique({ where: { provider_providerAccountId: { provider: "vkid", providerAccountId: account.providerAccountId } }, include: { user: true } });
        if (linked?.user.status === "banned") return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) {
        (session.user as { id?: string }).id = token.uid as string;
      }
      if (session.user?.email?.endsWith("@vk-id.invalid")) session.user.email = null;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export async function registerUser(email: string, password: string, name?: string) {
  const schema = z.object({
    email: z.string().email(),
    password: z.string().min(6).max(200),
    name: z.string().min(1).max(120).optional(),
  });
  const parsed = schema.parse({ email, password, name });

  const existing = await prisma.user.findUnique({ where: { email: parsed.email } });
  if (existing) {
    throw new Error("email_taken");
  }

  const passwordHash = await bcrypt.hash(parsed.password, 10);
  const user = await prisma.user.create({
    data: {
      email: parsed.email,
      passwordHash,
      name: parsed.name ?? null,
    },
  });

  // Дать пользователю Free план
  const free = await prisma.plan.findUnique({ where: { id: "free" } });
  if (free) {
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);
    await prisma.subscription.create({
      data: {
        userId: user.id,
        planId: free.id,
        currentPeriodEnd: periodEnd,
      },
    });
  }

  return user;
}
