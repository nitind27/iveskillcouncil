import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, unauthorizedResponse, errorResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { hasPermission } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/** GET /api/admin/roles - List all roles (for permissions UI). */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (!user.permissions || !hasPermission(user.permissions, "permissions.manage")) {
      return errorResponse("Forbidden", 403);
    }

    const roles = await prisma.role.findMany({
      orderBy: { id: "asc" },
    });
    return successResponse(roles);
  } catch (e) {
    console.error("GET /api/admin/roles", e);
    return errorResponse("Failed to fetch roles", 500);
  }
}
