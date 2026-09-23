import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import { serializeCourseSubject } from "@/lib/course-subjects";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

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

async function syncLegacyString(courseId: bigint) {
  const all = await prisma.courseSubject.findMany({
    where: { courseId },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { name: true },
  });
  await prisma.course.update({
    where: { id: courseId },
    data: { certificateSubject: all.map((s) => s.name).join(", ") || null },
  });
}

/** PATCH — rename / update max marks / sort */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const subjectId = BigInt(id);
    const existing = await prisma.courseSubject.findUnique({
      where: { id: subjectId },
      include: { course: { select: { franchiseId: true } } },
    });
    if (!existing) return errorResponse("Subject not found", 404);
    if (!canManageCourse(user, existing.course)) return errorResponse("Forbidden", 403);

    const body = await request.json();
    const data: { name?: string; maxMarks?: number; sortOrder?: number } = {};

    if (body?.name != null) {
      const name = String(body.name).trim();
      if (!name) return errorResponse("Subject name is required", 400);
      data.name = name;
    }
    if (body?.maxMarks != null) {
      const max = Number(body.maxMarks);
      if (!Number.isFinite(max) || max <= 0) return errorResponse("Invalid max marks", 400);
      data.maxMarks = Math.round(max);
    }
    if (body?.sortOrder != null) {
      const sort = Number(body.sortOrder);
      if (!Number.isFinite(sort)) return errorResponse("Invalid sort order", 400);
      data.sortOrder = Math.round(sort);
    }

    if (Object.keys(data).length === 0) {
      return errorResponse("Nothing to update", 400);
    }

    const oldName = existing.name;
    try {
      const updated = await prisma.courseSubject.update({
        where: { id: subjectId },
        data,
      });

      // If renamed, update existing marks rows that used the old name
      if (data.name && data.name !== oldName) {
        await prisma.studentSubjectMark.updateMany({
          where: {
            courseId: existing.courseId,
            subjectName: oldName,
          },
          data: { subjectName: data.name },
        });
      }

      await syncLegacyString(existing.courseId);
      return successResponse(serializeCourseSubject(updated), "Subject updated");
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      if (code === "P2002") {
        return errorResponse("This subject already exists for the course", 409);
      }
      throw err;
    }
  } catch (e) {
    console.error("[PATCH /api/course-subjects/:id]", e);
    return errorResponse("Failed to update subject", 500);
  }
}

/** DELETE subject */
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const subjectId = BigInt(id);
    const existing = await prisma.courseSubject.findUnique({
      where: { id: subjectId },
      include: { course: { select: { franchiseId: true } } },
    });
    if (!existing) return errorResponse("Subject not found", 404);
    if (!canManageCourse(user, existing.course)) return errorResponse("Forbidden", 403);

    await prisma.courseSubject.delete({ where: { id: subjectId } });
    await syncLegacyString(existing.courseId);

    return successResponse({ id: String(subjectId) }, "Subject deleted");
  } catch (e) {
    console.error("[DELETE /api/course-subjects/:id]", e);
    return errorResponse("Failed to delete subject", 500);
  }
}
