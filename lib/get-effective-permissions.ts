import { prisma } from "./prisma";
import { ROLES } from "./permissions";

/**
 * Get effective permission keys for a user.
 * - SUPER_ADMIN (roleId 1) without franchiseId: returns ["*"] (all access).
 * - Otherwise: role permissions from DB. If user has franchiseId, intersect with plan permissions.
 */
export async function getEffectivePermissions(
  roleId: number,
  franchiseId?: string | null
): Promise<string[]> {
  if (roleId === ROLES.SUPER_ADMIN && !franchiseId) {
    return ["*"];
  }

  const rolePerms = await prisma.rolePermission.findMany({
    where: { roleId },
    include: { permission: true },
  });
  const roleKeys = rolePerms.map((rp) => rp.permission.key);

  if (!franchiseId) {
    return roleKeys;
  }

  const franchise = await prisma.franchise.findUnique({
    where: { id: BigInt(franchiseId) },
    select: { planId: true },
  });
  if (!franchise) return roleKeys;

  const planPerms = await prisma.planPermission.findMany({
    where: { planId: franchise.planId },
    include: { permission: true },
  });
  const planKeys = new Set(planPerms.map((pp) => pp.permission.key));
  return roleKeys.filter((k) => planKeys.has(k));
}
