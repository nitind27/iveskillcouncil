import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/**
 * GET /api/students/lookup?q=STU-2026-000001
 * Navbar search by student unique ID (also matches name/email lightly).
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const roleId = Number(user.roleId);
    if (roleId !== ROLES.SUPER_ADMIN && roleId !== ROLES.ADMIN && roleId !== ROLES.SUB_ADMIN) {
      return errorResponse("Forbidden", 403);
    }

    const q = (request.nextUrl.searchParams.get("q") || "").trim();
    if (q.length < 2) {
      return successResponse({ items: [] }, "Type at least 2 characters");
    }

    const franchiseFilter =
      roleId === ROLES.SUB_ADMIN && user.franchiseId
        ? { franchiseId: BigInt(user.franchiseId) }
        : {};

    const upper = q.toUpperCase();
    const students = await prisma.student.findMany({
      where: {
        ...franchiseFilter,
        OR: [
          { studentCode: { contains: upper } },
          { studentCode: { contains: q } },
          { user: { fullName: { contains: q } } },
          { user: { email: { contains: q } } },
          { user: { phone: { contains: q } } },
        ],
      },
      take: 8,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { fullName: true, email: true, phone: true } },
        franchise: { select: { name: true } },
        course: { select: { name: true } },
      },
    });

    return successResponse(
      {
        items: students.map((s) => ({
          id: s.id.toString(),
          studentCode: s.studentCode,
          fullName: s.user.fullName,
          email: s.user.email,
          phone: s.user.phone,
          franchiseName: s.franchise.name,
          courseName: s.course?.name ?? null,
          status: s.status,
        })),
      },
      "Lookup results"
    );
  } catch (e) {
    console.error("GET students/lookup", e);
    return errorResponse("Lookup failed", 500);
  }
}
