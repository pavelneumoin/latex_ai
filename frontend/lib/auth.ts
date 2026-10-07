import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { authenticatePassword } from "./password-login";

// Accounts are issued by the owner. Public registration and OAuth are disabled.
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login", newUser: "/cabinet" },
  providers: [CredentialsProvider({
    name: "Логин и пароль",
    credentials: {
      username: { label: "Логин", type: "text" },
      email: { label: "Прежний логин", type: "text" },
      password: { label: "Пароль", type: "password" },
    },
    authorize(credentials) {
      return authenticatePassword({
        username: credentials?.username || credentials?.email,
        password: credentials?.password,
      });
    },
  })],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.uid = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.uid) session.user.id = token.uid as string;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
