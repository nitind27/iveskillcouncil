import { cookies } from "next/headers";
import { getUserFromToken } from "./auth";
import { ROLES } from "./permissions";

/** Get current user from request (cookies). Returns null if not authenticated. */
export async function getCurrentUser() {
  const cookieStore = cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return null;
  return getUserFromToken(token);
}

/** Ensure current user is SUPER_ADMIN. Returns user if ok, null otherwise. */
export async function requireSuperAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;
  const roleId = Number(user.roleId);
  if (roleId !== ROLES.SUPER_ADMIN) return null;
  return user;
}
