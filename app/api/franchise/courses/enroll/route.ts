import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, forbiddenResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";
import { refreshStudentCourseTotals } from "@/lib/student-enrollments";

export const dynamic = "force-dynamic";

async function franchiseOf(user: { roleId: number; franchiseId?: string | null }) {
  if (Number(user.roleId) !== ROLES.SUB_ADMIN || !user.franchiseId) return null;
  return BigInt(user.franchiseId);
}

/** Students of this institute, marked if they are already in the course. */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return forbiddenResponse();
    const franchiseId = await franchiseOf(user);
    if (!franchiseId) return errorResponse("Institute access required", 403);

    const courseId = request.nextUrl.searchParams.get("courseId");
    if (!courseId) return errorResponse("courseId is required", 400);
    const search = (request.nextUrl.searchParams.get("search") || "").trim();

    const fee = await prisma.franchiseCourseFee.findUnique({
      where: { franchiseId_courseId: { franchiseId, courseId: BigInt(courseId) } },
      include: { course: { select: { name: true } } },
    });
    if (!fee) return errorResponse("This course is not on your institute", 404);

    const students = await prisma.student.findMany({
      where: {
        franchiseId,
        status: { not: "DROPPED" },
        ...(search
          ? {
              OR: [
                { studentCode: { contains: search } },
                {
                  user: {
                    OR: [
                      { fullName: { contains: search } },
                      { phone: { contains: search } },
                    ],
                  },
                },
              ],
            }
          : {}),
      },
      orderBy: { user: { fullName: "asc" } },
      take: 300,
      select: {
        id: true,
        studentCode: true,
        user: { select: { fullName: true, phone: true } },
        enrollments: {
          where: { courseId: BigInt(courseId), status: "ACTIVE" },
          select: { id: true },
        },
      },
    });

    return successResponse(
      {
        courseId,
        courseName: fee.course.name,
        fee: Number(fee.customFee),
        students: students.map((s) => ({
          id: s.id.toString(),
          studentCode: s.studentCode,
          fullName: s.user.fullName,
          phone: s.user.phone,
          enrolled: s.enrollments.length > 0,
        })),
      },
      "Institute students"
    );
  } catch (e) {
    console.error("GET franchise course enroll", e);
    return errorResponse("Failed to load students", 500);
  }
}

/** Add this institute's students to one course. Other courses stay. */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return forbiddenResponse();
    const franchiseId = await franchiseOf(user);
    if (!franchiseId) return errorResponse("Institute access required", 403);

    const body = await request.json();
    const courseId = String(body.courseId || "");
    const rawIds: unknown[] = Array.isArray(body.studentIds) ? body.studentIds : [];
    const studentIds = [
      ...new Set(rawIds.map((id) => String(id).trim()).filter((id) => id.length > 0)),
    ];
    if (!courseId) return errorResponse("Select a course", 400);
    if (!studentIds.length) return errorResponse("Select at least one student", 400);

    const fee = await prisma.franchiseCourseFee.findUnique({
      where: { franchiseId_courseId: { franchiseId, courseId: BigInt(courseId) } },
    });
    if (!fee) return errorResponse("This course is not on your institute", 400);

    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds.map((id) => BigInt(id)) },
        franchiseId,
      },
      select: {
        id: true,
        courseId: true,
        enrollments: {
          where: { courseId: BigInt(courseId), status: "ACTIVE" },
          select: { id: true },
        },
      },
    });

    const fresh = students.filter((s) => s.enrollments.length === 0);
    if (!fresh.length) return errorResponse("Selected students are already in this course", 400);

    await prisma.studentEnrollment.createMany({
      data: fresh.map((s) => ({
        studentId: s.id,
        courseId: BigInt(courseId),
        totalFee: fee.customFee,
        status: "ACTIVE",
      })),
    });

    const needsPrimary = fresh.filter((s) => !s.courseId).map((s) => s.id);
    if (needsPrimary.length) {
      await prisma.student.updateMany({
        where: { id: { in: needsPrimary } },
        data: { courseId: BigInt(courseId) },
      });
    }

    for (const s of fresh) {
      await refreshStudentCourseTotals(s.id);
    }

    return successResponse(
      { added: fresh.length, courseId },
      fresh.length === 1 ? "Student added to course" : `${fresh.length} students added to course`
    );
  } catch (e) {
    console.error("POST franchise course enroll", e);
    return errorResponse("Failed to add students", 500);
  }
}
