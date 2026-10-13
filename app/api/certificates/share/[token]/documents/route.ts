import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { errorResponse, successResponse } from "@/lib/api-response";
import { parseShareKind, parseShareStudentIds, readShareAccess, shareTokenOk, SHARE_COOKIE } from "@/lib/certificate-share";
import {
  buildStudentOfficialDocuments,
  findStudentForOfficialDocuments,
  loadOfficialLayouts,
} from "@/lib/student-official-documents";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!shareTokenOk(token)) return errorResponse("This link is not valid.", 404);

    const cookie = cookies().get(SHARE_COOKIE)?.value;
    if (!readShareAccess(cookie, token)) {
      return errorResponse("Sign in with the username and password for this link", 401);
    }

    const link = await prisma.certificateShareLink.findUnique({ where: { token } });
    if (!link) return errorResponse("This link is not valid.", 404);

    const studentId = request.nextUrl.searchParams.get("studentId") || "";
    const allowed = parseShareStudentIds(link.studentIds);
    if (!allowed.includes(studentId)) return errorResponse("This document is not on this link", 404);

    const student = await findStudentForOfficialDocuments(BigInt(studentId));
    if (!student) return errorResponse("This document is not on this link", 404);

    const kinds = parseShareKind(link.kinds) ?? "both";
    const courseId = link.courseId && /^\d+$/.test(link.courseId) ? BigInt(link.courseId) : null;
    const layouts = await loadOfficialLayouts();
    const docs = await buildStudentOfficialDocuments(student, layouts, { courseId });

    return successResponse({
      studentId: docs.studentId,
      studentName: docs.studentName,
      studentCode: docs.studentCode,
      courseName: docs.courseName,
      vocational: kinds === "result" ? null : docs.vocational,
      marksheet: kinds === "certificate" ? null : docs.marksheet,
    });
  } catch (err) {
    console.error("Certificate share document:", err);
    return errorResponse("Could not load this document", 500);
  }
}
