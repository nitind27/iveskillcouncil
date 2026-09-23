import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import {
  ensureCourseSubjectsFromLegacy,
  serializeCourseSubject,
  syncCourseSubjects,
} from "@/lib/course-subjects";

export const dynamic = "force-dynamic";

function canManageCourse(
  user: { roleId: number | string; franchiseId?: string | null },
  course: { franchiseId: bigint | null }
) {
  const roleId = Number(user.roleId);
  if (roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN) return true;
  if (roleId === ROLES.SUB_ADMIN && user.franchiseId && course.franchiseId) {
    return course.franchiseId.toString() === String(user.franchiseId);
  }
  return false;
}

function canViewCourse(
  user: { roleId: number | string; franchiseId?: string | null },
  course: { franchiseId: bigint | null }
) {
  const roleId = Number(user.roleId);
  if (roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN) return true;
  if (roleId === ROLES.SUB_ADMIN) {
    // Franchise can view global + own course subjects
    return course.franchiseId == null || course.franchiseId.toString() === String(user.franchiseId);
  }
  return false;
}

/** GET ?courseId= — list subjects for a course */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const roleId = Number(user.roleId);
    if (roleId !== ROLES.SUPER_ADMIN && roleId !== ROLES.ADMIN && roleId !== ROLES.SUB_ADMIN) {
      return errorResponse("Forbidden", 403);
    }

    const courseIdParam = request.nextUrl.searchParams.get("courseId");
    if (!courseIdParam) return errorResponse("courseId is required", 400);

    const courseId = BigInt(courseIdParam);
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        name: true,
        franchiseId: true,
        certificateSubject: true,
        objectiveMarks: true,
        practicalMarks: true,
      },
    });
    if (!course) return errorResponse("Course not found", 404);
    if (!canViewCourse(user, course)) return errorResponse("Forbidden", 403);

    await ensureCourseSubjectsFromLegacy(courseId);

    const subjects = await prisma.courseSubject.findMany({
      where: { courseId },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return successResponse({
      course: {
        id: course.id.toString(),
        name: course.name,
        franchiseId: course.franchiseId?.toString() ?? null,
        canManage: canManageCourse(user, course),
        defaultMaxMarks: course.objectiveMarks ?? course.practicalMarks ?? 100,
      },
      subjects: subjects.map(serializeCourseSubject),
    });
  } catch (e) {
    console.error("[GET /api/course-subjects]", e);
    return errorResponse("Failed to load subjects", 500);
  }
}

/** POST — add one subject { courseId, name, maxMarks? } OR replace all { courseId, subjects: [...] } */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const body = await request.json();
    const courseIdParam = body?.courseId;
    if (!courseIdParam) return errorResponse("courseId is required", 400);

    const courseId = BigInt(String(courseIdParam));
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        franchiseId: true,
        objectiveMarks: true,
        practicalMarks: true,
      },
    });
    if (!course) return errorResponse("Course not found", 404);
    if (!canManageCourse(user, course)) return errorResponse("Forbidden", 403);

    const defaultMax = course.objectiveMarks ?? course.practicalMarks ?? 100;

    // Bulk replace
    if (Array.isArray(body.subjects)) {
      const rows = await syncCourseSubjects(
        courseId,
        body.subjects.map((s: { name?: string; maxMarks?: number } | string) =>
          typeof s === "string"
            ? { name: s, maxMarks: defaultMax }
            : { name: String(s?.name || ""), maxMarks: s?.maxMarks ?? defaultMax }
        ),
        defaultMax
      );
      return successResponse(
        { subjects: rows.map(serializeCourseSubject) },
        "Subjects saved"
      );
    }

    const name = String(body?.name || "").trim();
    if (!name) return errorResponse("Subject name is required", 400);
    if (name.length > 150) return errorResponse("Subject name too long", 400);

    const maxMarks =
      body?.maxMarks != null && Number.isFinite(Number(body.maxMarks)) && Number(body.maxMarks) > 0
        ? Math.round(Number(body.maxMarks))
        : defaultMax;

    const maxSort = await prisma.courseSubject.aggregate({
      where: { courseId },
      _max: { sortOrder: true },
    });

    try {
      const created = await prisma.courseSubject.create({
        data: {
          courseId,
          name,
          maxMarks,
          sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
        },
      });

      // Keep legacy string in sync
      const all = await prisma.courseSubject.findMany({
        where: { courseId },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { name: true },
      });
      await prisma.course.update({
        where: { id: courseId },
        data: { certificateSubject: all.map((s) => s.name).join(", ") || null },
      });

      return successResponse(serializeCourseSubject(created), "Subject added");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "P2002") {
        return errorResponse("This subject already exists for the course", 409);
      }
      throw err;
    }
  } catch (e) {
    console.error("[POST /api/course-subjects]", e);
    return errorResponse("Failed to save subject", 500);
  }
}
