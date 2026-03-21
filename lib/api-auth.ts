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

/** Ensure current user is SUPER_ADMIN or ADMIN (Institute Admin). Returns user if ok, null otherwise. */
export async function requireSuperAdminOrAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;
  const roleId = Number(user.roleId);
  if (roleId !== ROLES.SUPER_ADMIN && roleId !== ROLES.ADMIN) return null;
  return user;
}

/** Ensure current user is SUB_ADMIN with franchiseId. Returns user if ok, null otherwise. */
export async function requireFranchiseAdmin() {
  const user = await getCurrentUser();
  if (!user) return null;
  const roleId = Number(user.roleId);
  if (roleId !== ROLES.SUB_ADMIN || !user.franchiseId) return null;
  return user;
}

/** Get franchise ID for course management: super admin can pass any, sub-admin uses own. */
export async function getFranchiseIdForCourses(franchiseIdParam: string | null): Promise<{ franchiseId: bigint; isOwn: boolean } | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const roleId = Number(user.roleId);
  if ((roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN) && franchiseIdParam) {
    return { franchiseId: BigInt(franchiseIdParam), isOwn: false };
  }
  if (roleId === ROLES.SUB_ADMIN && user.franchiseId) {
    return { franchiseId: BigInt(user.franchiseId), isOwn: true };
  }
  return null;
}
