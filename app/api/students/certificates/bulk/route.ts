import { NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { canPrintCertificates } from "@/lib/certificate-access";
import {
  buildStudentOfficialDocuments,
  findStudentsForOfficialDocuments,
  loadOfficialLayouts,
  type StudentOfficialDocuments,
} from "@/lib/student-official-documents";
import { assignMarksheetNumbers } from "@/lib/marksheet-numbers";

export const dynamic = "force-dynamic";

const MAX_BATCH = 100;
const CONCURRENCY = 8;

/**
 * POST /api/students/certificates/bulk
 * Body: { studentIds?: string[], franchiseId?, courseId?, status?, search? }
 * Returns Certificate of Completion + Result 3 data for each student (max 100 per batch).
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (!canPrintCertificates(Number(user.roleId))) return errorResponse("Forbidden", 403);

    const body = (await request.json().catch(() => ({}))) as {
      studentIds?: string[];
      franchiseId?: string;
      courseId?: string;
      status?: string;
      search?: string;
    };

    const where: Prisma.StudentWhereInput = {};
    const ids = (body.studentIds || []).filter((v) => /^\d+$/.test(String(v)));
    if (ids.length > 0) {
      where.id = { in: ids.map((v) => BigInt(v)) };
    } else {
      if (body.franchiseId) where.franchiseId = BigInt(body.franchiseId);
      if (body.courseId) where.courseId = BigInt(body.courseId);
      if (body.status === "ACTIVE" || body.status === "COMPLETED" || body.status === "DROPPED") {
        where.status = body.status;
      }
      const search = (body.search || "").trim();
      if (search) {
        where.OR = [
          { studentCode: { contains: search } },
          { user: { fullName: { contains: search } } },
        ];
      }
    }

    const students = await findStudentsForOfficialDocuments(where, MAX_BATCH);
    const layouts = await loadOfficialLayouts();
    await assignMarksheetNumbers(students.map((s) => s.id));

    const items: StudentOfficialDocuments[] = new Array(students.length);
    for (let i = 0; i < students.length; i += CONCURRENCY) {
      const chunk = students.slice(i, i + CONCURRENCY);
      const built = await Promise.all(chunk.map((s) => buildStudentOfficialDocuments(s, layouts)));
      built.forEach((doc, j) => {
        items[i + j] = doc;
      });
    }

    return successResponse({ items, limit: MAX_BATCH }, "Official documents");
  } catch (err) {
    console.error("POST bulk official documents", err);
    return errorResponse("Failed to load official documents", 500);
  }
}
