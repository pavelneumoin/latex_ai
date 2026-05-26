// Хелперы для работы с серверной сессией NextAuth в Route Handlers.

import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export interface SessionUser {
  id: string;
  email?: string | null;
  name?: string | null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
  };
}

/**
 * Возвращает session user; кидает специальный объект-ошибку, который роут конвертит в 401.
 */
export async function requireUser(): Promise<SessionUser> {
  const u = await getSessionUser();
  if (!u) {
    const err = new Error("unauthorized");
    (err as Error & { code?: string }).code = "unauthorized";
    throw err;
  }
  return u;
}
