import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./db";
import { checkRate } from "./rate-limit";

const credentialsSchema = z.object({
  username: z.string().trim().min(3).max(254),
  password: z.string().min(6).max(200),
});

// The email fallback preserves existing owner accounts; new accounts need no email.
export async function authenticatePassword(credentials: unknown) {
  const parsed = credentialsSchema.safeParse(credentials);
  if (!parsed.success) return null;
  const login = parsed.data.username.toLowerCase();
  if (!checkRate("password-login", login, { limit: 15, windowMs: 10 * 60_000 }).ok) return null;
  const user = await prisma.user.findUnique({
    where: login.includes("@") ? { email: login } : { username: login },
  });
  if (!user?.passwordHash || user.status !== "active") return null;
  if (!await bcrypt.compare(parsed.data.password, user.passwordHash)) return null;
  return { id: user.id, email: user.email, name: user.name, image: user.image };
}
