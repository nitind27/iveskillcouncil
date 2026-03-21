import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, notFoundResponse, forbiddenResponse } from "@/lib/api-response";
import { requireSuperAdminOrAdmin } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/** GET: List courses assigned to this franchise. Super admin only. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdminOrAdmin();
    if (!admin) return forbiddenResponse();

    const { id } = await params;
    const franchiseId = BigInt(id);

    const franchise = await prisma.franchise.findUnique({
      where: { id: franchiseId },
      include: {
        courses: {
          include: { course: true },
        },
      },
    });

    if (!franchise) return notFoundResponse();

    const items = franchise.courses.map((fc) => ({
      id: fc.id.toString(),
      courseId: fc.courseId.toString(),
      courseName: fc.course.name,
      customFee: Number(fc.customFee),
      type: fc.course.type,
    }));

    return successResponse({
      franchise: { id: franchise.id.toString(), name: franchise.name },
      courses: items,
    });
  } catch (err) {
    console.error("Admin franchise courses GET:", err);
    return errorResponse("Failed to fetch franchise courses", 500);
  }
}

/** POST: Assign courses to franchise. Body: { courseIds: string[], feeMap?: Record<string, number> } */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdminOrAdmin();
    if (!admin) return forbiddenResponse();

    const { id } = await params;
    const franchiseId = BigInt(id);
    const body = await request.json();
    const { courseIds, feeMap } = body;

    if (!Array.isArray(courseIds) || courseIds.length === 0) {
      return errorResponse("courseIds array required", 400);
    }

    const franchise = await prisma.franchise.findUnique({ where: { id: franchiseId } });
    if (!franchise) return notFoundResponse();

    const courseIdsBigInt = courseIds.map((c: string | number) => BigInt(c));
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIdsBigInt }, status: "ACTIVE" },
    });

    const toCreate = courses.map((c) => ({
      franchiseId,
      courseId: c.id,
      customFee: feeMap?.[c.id.toString()] ?? c.baseFee,
    }));

    await prisma.franchiseCourseFee.createMany({
      data: toCreate,
      skipDuplicates: true,
    });

    return successResponse(null, "Courses assigned successfully");
  } catch (err) {
    console.error("Admin franchise courses POST:", err);
    return errorResponse("Failed to assign courses", 500);
  }
}

/** DELETE: Remove course from franchise. Query: ?courseId=xxx */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireSuperAdminOrAdmin();
    if (!admin) return forbiddenResponse();

    const { id } = await params;
    const franchiseId = BigInt(id);
    const courseId = request.nextUrl.searchParams.get("courseId");
    if (!courseId) return errorResponse("courseId query param required", 400);

    await prisma.franchiseCourseFee.deleteMany({
      where: { franchiseId, courseId: BigInt(courseId) },
    });

    return successResponse(null, "Course removed from franchise");
  } catch (err) {
    console.error("Admin franchise courses DELETE:", err);
    return errorResponse("Failed to remove course", 500);
  }
}
