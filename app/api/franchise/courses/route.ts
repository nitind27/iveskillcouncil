import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, forbiddenResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/** GET: List courses for sub-admin's own franchise. */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return forbiddenResponse();

    const roleId = Number(user.roleId);
    const franchiseId = user.franchiseId ? BigInt(user.franchiseId) : null;

    if (roleId !== ROLES.SUB_ADMIN || !franchiseId) {
      return errorResponse("Franchise admin access required", 403);
    }

    const franchise = await prisma.franchise.findUnique({
      where: { id: franchiseId },
      include: {
        courses: { include: { course: true } },
        ownedCourses: true,
      },
    });

    if (!franchise) return errorResponse("Franchise not found", 404);

    // Assigned via FranchiseCourseFee
    const assigned = franchise.courses.map((fc) => ({
      id: fc.id.toString(),
      courseId: fc.courseId.toString(),
      courseName: fc.course.name,
      customFee: Number(fc.customFee),
      type: fc.course.type,
      durationMonths: fc.course.durationMonths,
      isOwn: fc.course.franchiseId?.toString() === franchiseId.toString(),
    }));

    return successResponse({
      franchise: { id: franchise.id.toString(), name: franchise.name },
      courses: assigned,
    });
  } catch (err) {
    console.error("Franchise courses GET:", err);
    return errorResponse("Failed to fetch courses", 500);
  }
}

/** POST: Add course to franchise. Body: { courseIds: string[] } or create new: { name, description, type, baseFee, durationMonths } */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return forbiddenResponse();

    const roleId = Number(user.roleId);
    const franchiseId = user.franchiseId ? BigInt(user.franchiseId) : null;

    if (roleId !== ROLES.SUB_ADMIN || !franchiseId) {
      return errorResponse("Franchise admin access required", 403);
    }

    const body = await request.json();

    // Create new course for franchise
    if (body.name && body.type && body.baseFee != null && body.durationMonths != null) {
      const { name, description, type, baseFee, durationMonths } = body;
      const course = await prisma.course.create({
        data: {
          franchiseId,
          name: String(name).trim(),
          description: description ? String(description).trim() : null,
          type,
          baseFee: Number(baseFee),
          durationMonths: Number(durationMonths),
          status: "ACTIVE",
        },
      });
      await prisma.franchiseCourseFee.create({
        data: {
          franchiseId,
          courseId: course.id,
          customFee: course.baseFee,
        },
      });
      return successResponse(
        { id: course.id.toString(), name: course.name },
        "Course created and added to your franchise"
      );
    }

    // Assign existing global courses
    const courseIds = body.courseIds;
    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return errorResponse("courseIds array required", 400);
    }

    const courses = await prisma.course.findMany({
      where: {
        id: { in: courseIds.map((c: string) => BigInt(c)) },
        status: "ACTIVE",
        franchiseId: null, // Only global courses can be assigned
      },
    });

    const toCreate = courses.map((c) => ({
      franchiseId,
      courseId: c.id,
      customFee: body.feeMap?.[c.id.toString()] ?? c.baseFee,
    }));

    await prisma.franchiseCourseFee.createMany({
      data: toCreate,
      skipDuplicates: true,
    });

    return successResponse(null, "Courses added to your franchise");
  } catch (err) {
    console.error("Franchise courses POST:", err);
    return errorResponse("Failed to add courses", 500);
  }
}

/** DELETE: Remove course from franchise. Query: ?courseId=xxx */
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return forbiddenResponse();

    const roleId = Number(user.roleId);
    const franchiseId = user.franchiseId ? BigInt(user.franchiseId) : null;

    if (roleId !== ROLES.SUB_ADMIN || !franchiseId) {
      return errorResponse("Franchise admin access required", 403);
    }

    const courseId = request.nextUrl.searchParams.get("courseId");
    if (!courseId) return errorResponse("courseId query param required", 400);

    const course = await prisma.course.findUnique({
      where: { id: BigInt(courseId) },
    });
    if (!course) return errorResponse("Course not found", 404);

    // If course was created by this franchise (franchiseId set), delete the course entirely
    if (course.franchiseId?.toString() === franchiseId.toString()) {
      await prisma.course.delete({ where: { id: BigInt(courseId) } });
      return successResponse(null, "Course removed from your franchise");
    }

    // Otherwise just remove FranchiseCourseFee
    await prisma.franchiseCourseFee.deleteMany({
      where: { franchiseId, courseId: BigInt(courseId) },
    });
    return successResponse(null, "Course removed from your franchise");
  } catch (err) {
    console.error("Franchise courses DELETE:", err);
    return errorResponse("Failed to remove course", 500);
  }
}
