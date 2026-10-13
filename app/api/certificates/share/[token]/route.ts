import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse, unauthorizedResponse } from "@/lib/api-response";
import { requireSuperAdminOrAdmin } from "@/lib/api-auth";
import { parseShareStudentIds, readShareAccess, shareTokenOk, SHARE_COOKIE } from "@/lib/certificate-share";

export const dynamic = "force-dynamic";

async function loadStudents(studentIds: string[], courseName: string | null) {
  if (!studentIds.length) return [];
  const rows = await prisma.student.findMany({
    where: { id: { in: studentIds.map((id) => BigInt(id)) } },
    select: { id: true, studentCode: true, user: { select: { fullName: true } } },
  });
  const byId = new Map(rows.map((row) => [row.id.toString(), row]));
  return studentIds
    .map((id) => byId.get(id))
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .map((row) => ({
      id: row.id.toString(),
      studentCode: row.studentCode,
      studentName: row.user.fullName,
      courseName,
    }));
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!shareTokenOk(token)) return errorResponse("This link is not valid.", 404);

    const link = await prisma.certificateShareLink.findUnique({ where: { token } });
    if (!link) return errorResponse("This link is not valid.", 404);

    const cookie = cookies().get(SHARE_COOKIE)?.value;
    if (!readShareAccess(cookie, token)) {
      return successResponse({ locked: true });
    }

    const studentIds = parseShareStudentIds(link.studentIds);
    let courseName: string | null = null;
    if (link.courseId && /^\d+$/.test(link.courseId)) {
      const course = await prisma.course.findUnique({
        where: { id: BigInt(link.courseId) },
        select: { name: true },
      });
      courseName = course?.name ?? null;
    }

    return successResponse({
      locked: false,
      title: link.title,
      kinds: link.kinds,
      courseName,
      students: await loadStudents(studentIds, courseName),
    });
  } catch (err) {
    console.error("Open certificate share:", err);
    return errorResponse("Could not open this link", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return unauthorizedResponse();
    const { token } = await params;
    if (!shareTokenOk(token)) return errorResponse("This link is not valid.", 404);

    const link = await prisma.certificateShareLink.findUnique({ where: { token } });
    if (!link || link.createdBy?.toString() !== user.id) {
      return errorResponse("This link is not valid.", 404);
    }
    await prisma.certificateShareLink.delete({ where: { token } });
    return successResponse({ removed: true });
  } catch (err) {
    console.error("Remove certificate share:", err);
    return errorResponse("Could not remove the link", 500);
  }
}
