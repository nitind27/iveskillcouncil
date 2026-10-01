import { NextRequest } from "next/server";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";
import {
  buildStudentOfficialDocuments,
  findStudentForOfficialDocuments,
  loadOfficialLayouts,
} from "@/lib/student-official-documents";

export const dynamic = "force-dynamic";

/**
 * GET /api/students/[id]/certificates
 * Certificate of Completion + Statement of Marks (Result) - 3 filled with this student's live data
 * (subjects, marks, ATC, photo, enrollment) — layout from saved template.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const roleId = Number(user.roleId);
    if (roleId !== ROLES.SUPER_ADMIN && roleId !== ROLES.ADMIN && roleId !== ROLES.SUB_ADMIN) {
      return errorResponse("Forbidden", 403);
    }

    const { id } = await params;
    const student = await findStudentForOfficialDocuments(BigInt(id));
    if (!student) return errorResponse("Student not found", 404);

    if (roleId === ROLES.SUB_ADMIN && user.franchiseId && BigInt(user.franchiseId) !== student.franchiseId) {
      return errorResponse("Cannot view student from another franchise", 403);
    }

    const layouts = await loadOfficialLayouts();
    const docs = await buildStudentOfficialDocuments(student, layouts);

    return successResponse(docs, "Student certificates");
  } catch (err) {
    console.error("GET student certificates", err);
    return errorResponse("Failed to load student certificates", 500);
  }
}
