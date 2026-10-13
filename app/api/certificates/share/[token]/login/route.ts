import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/api-response";
import { verifyPassword } from "@/lib/auth";
import {
  normalizeShareUsername,
  parseShareStudentIds,
  shareTokenOk,
  signShareAccess,
  SHARE_COOKIE,
} from "@/lib/certificate-share";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!shareTokenOk(token)) return errorResponse("Username or password is incorrect", 401);

    const link = await prisma.certificateShareLink.findUnique({ where: { token } });
    if (!link) return errorResponse("Username or password is incorrect", 401);

    const body = await request.json().catch(() => ({}));
    const username = normalizeShareUsername(body.username);
    const password = String(body.password ?? "");
    if (!username || username !== link.username || !(await verifyPassword(password, link.passwordHash))) {
      return errorResponse("Username or password is incorrect", 401);
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
    const rows = studentIds.length
      ? await prisma.student.findMany({
          where: { id: { in: studentIds.map((id) => BigInt(id)) } },
          select: { id: true, studentCode: true, user: { select: { fullName: true } } },
        })
      : [];
    const byId = new Map(rows.map((row) => [row.id.toString(), row]));

    const res = successResponse({
      locked: false,
      title: link.title,
      kinds: link.kinds,
      courseName,
      students: studentIds
        .map((id) => byId.get(id))
        .filter((row): row is NonNullable<typeof row> => Boolean(row))
        .map((row) => ({
          id: row.id.toString(),
          studentCode: row.studentCode,
          studentName: row.user.fullName,
          courseName,
        })),
    });
    res.cookies.set(SHARE_COOKIE, signShareAccess(token), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
    return res;
  } catch (err) {
    console.error("Certificate share login:", err);
    return errorResponse("Could not open this link", 500);
  }
}
