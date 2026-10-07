import { prisma } from "./db";
import { getSessionUser } from "./session";

// Read role from the database on every request; JWT claims cannot grant access.
export async function isCatalogAdmin(userId?: string | null) {
  if (!userId) return false;
  const user = await prisma.user.findUnique({where:{id:userId},select:{role:true,status:true}});
  return user?.role === "admin" && user.status === "active";
}
export async function catalogAdmin() {
  const user = await getSessionUser();
  return user && await isCatalogAdmin(user.id) ? user : null;
}
export function sameOrigin(request:Request) {
  const origin=request.headers.get("origin");
  return origin === new URL(request.url).origin;
}
