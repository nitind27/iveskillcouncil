import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/**
 * GET: Courses available for student enrollment for a franchise.
 * - SUB_ADMIN: returns courses for their franchise (from FranchiseCourseFee)
 * - SUPER_ADMIN/ADMIN: returns courses for franchiseId query param
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const roleId = Number(user.roleId);
    if (roleId !== ROLES.SUPER_ADMIN && roleId !== ROLES.ADMIN && roleId !== ROLES.SUB_ADMIN) {
      return errorResponse("Forbidden", 403);
    }

    let franchiseId: bigint;
    if (roleId === ROLES.SUB_ADMIN) {
      if (!user.franchiseId) return errorResponse("Franchise admin must have franchise", 403);
      franchiseId = BigInt(user.franchiseId);
    } else {
      const param = request.nextUrl.searchParams.get("franchiseId");
      if (!param) return errorResponse("franchiseId required for Super Admin/Admin", 400);
      franchiseId = BigInt(param);
    }

    const franchise = await prisma.franchise.findUnique({
      where: { id: franchiseId },
      include: {
        courses: { include: { course: true } },
      },
    });

    if (!franchise) return errorResponse("Franchise not found", 404);

    const courses = franchise.courses.map((fc) => ({
      id: fc.courseId.toString(),
      name: fc.course.name,
      baseFee: Number(fc.customFee),
      type: fc.course.type,
      durationMonths: fc.course.durationMonths,
    }));

    return successResponse(
      { franchise: { id: franchise.id.toString(), name: franchise.name }, courses },
      "Franchise courses retrieved"
    );
  } catch (err) {
    console.error("Franchise courses GET:", err);
    return errorResponse("Failed to fetch franchise courses", 500);
  }
}
