import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/api-auth";
import { errorResponse, successResponse, unauthorizedResponse, rateLimitResponse } from "@/lib/api-response";
import { rateLimiter, rateLimitConfig, getClientIdentifier } from "@/lib/rate-limit";
import { ROLES } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import {
  buildStudentReport,
  getStudentReportCourseOptions,
  parseStudentReportFilters,
  type StudentReportFilters,
} from "@/lib/student-report";
import { buildStudentReportPdf } from "@/lib/student-report-pdf";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const FEE_LABELS: Record<StudentReportFilters["fee"], string> = {
  ALL: "All",
  PENDING: "Pending fees",
  PAID: "Fully paid",
  UNPAID: "Nothing paid",
};

const SORT_LABELS: Record<StudentReportFilters["sort"], string> = {
  admission_desc: "Newest admission first",
  admission_asc: "Oldest admission first",
  name: "Name (A–Z)",
  pending_desc: "Highest pending first",
  course: "Course",
};

function fmt(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
}

export async function GET(request: NextRequest) {
  try {
    const clientId = getClientIdentifier(request);
    if (!rateLimiter.check(clientId, rateLimitConfig.api.maxRequests, rateLimitConfig.api.windowMs)) {
      return rateLimitResponse();
    }

    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const roleId = Number(user.roleId);
    const isAdmin = roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN;
    if (!isAdmin && roleId !== ROLES.SUB_ADMIN) return errorResponse("Forbidden", 403);

    const sp = request.nextUrl.searchParams;
    const requested = sp.get("franchiseId");
    let franchiseId: string | null = null;
    if (isAdmin) {
      if (requested && !/^\d+$/.test(requested)) return errorResponse("Invalid franchiseId", 400);
      franchiseId = requested || null;
    } else {
      if (!user.franchiseId) return errorResponse("Forbidden", 403);
      franchiseId = String(user.franchiseId);
    }

    const filters = parseStudentReportFilters(sp, franchiseId);
    const format = (sp.get("format") || "json").toLowerCase();

    if (format !== "pdf") {
      const [report, courseOptions] = await Promise.all([
        buildStudentReport(filters),
        getStudentReportCourseOptions(franchiseId),
      ]);
      const { rows: _rows, ...rest } = report;
      return successResponse({ ...rest, courseOptions }, "Student report");
    }

    const report = await buildStudentReport(filters);

    let franchiseLabel = "All franchises";
    if (franchiseId) {
      const f = await prisma.franchise.findUnique({ where: { id: BigInt(franchiseId) }, select: { name: true } });
      franchiseLabel = f?.name || `Franchise #${franchiseId}`;
    }
    let courseLabel = "All courses";
    if (filters.courseId === "none") courseLabel = "No course assigned";
    else if (filters.courseId) {
      const c = await prisma.course.findUnique({ where: { id: BigInt(filters.courseId) }, select: { name: true } });
      courseLabel = c?.name || `Course #${filters.courseId}`;
    }

    const applied: [string, string][] = [
      ["Franchise", franchiseLabel],
      ["Course", courseLabel],
      ["Fee status", FEE_LABELS[filters.fee]],
      ["Student status", filters.status === "ALL" ? "All" : filters.status.charAt(0) + filters.status.slice(1).toLowerCase()],
    ];
    if (filters.gender !== "ALL") applied.push(["Gender", filters.gender.charAt(0) + filters.gender.slice(1).toLowerCase()]);
    if (filters.from || filters.to) {
      applied.push([
        "Admission",
        filters.from && filters.to
          ? `${fmt(filters.from)} to ${fmt(filters.to)}`
          : filters.from
            ? `From ${fmt(filters.from)}`
            : `Up to ${fmt(filters.to!)}`,
      ]);
    }
    if (filters.search) applied.push(["Search", `"${filters.search}"`]);
    applied.push(["Sorted by", SORT_LABELS[filters.sort]]);

    const buf = await buildStudentReportPdf(report, {
      filters: applied,
      generatedBy: user.fullName || user.email,
      showFranchiseColumn: isAdmin && !franchiseId && report.franchises.length > 1,
      includeStudents: sp.get("list") !== "0",
    });

    const stamp = new Date().toISOString().slice(0, 10);
    const tag = filters.fee === "PENDING" ? "Pending-Fees" : "Students";
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="IVESDC-${tag}-Report-${stamp}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error: unknown) {
    console.error("Students report error:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to build student report", 500);
  }
}
