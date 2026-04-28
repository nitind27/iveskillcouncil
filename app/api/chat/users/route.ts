import { getCurrentUser } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { successResponse, unauthorizedResponse } from "@/lib/api-response";
import { ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/** GET — list all admins/franchise-admins for starting a chat */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorizedResponse();
  const uid = BigInt(user.id);
  const roleId = Number(user.roleId);

  let where: Record<string, unknown> = { status: "ACTIVE", id: { not: uid } };

  if (roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN) {
    // Super admin can chat with all admins and franchise admins
    where = { ...where, roleId: { in: [ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SUB_ADMIN] } };
  } else if (roleId === ROLES.SUB_ADMIN) {
    // Franchise admin can only chat with super admin / admin
    where = { ...where, roleId: { in: [ROLES.SUPER_ADMIN, ROLES.ADMIN] } };
  } else {
    return successResponse([]);
  }

  const users = await prisma.user.findMany({
    where,
    select: {
      id: true,
      fullName: true,
      email: true,
      roleId: true,
      franchise: { select: { id: true, name: true } },
    },
    orderBy: [{ roleId: "asc" }, { fullName: "asc" }],
    take: 200,
  });

  return successResponse(
    users.map((u) => ({
      id:          u.id.toString(),
      fullName:    u.fullName,
      email:       u.email,
      roleId:      u.roleId,
      franchiseName: u.franchise?.name ?? null,
    }))
  );
}
