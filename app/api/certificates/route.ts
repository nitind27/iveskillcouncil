import { NextRequest } from "next/server";
import type { CertificateStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";
import { canManageCertificateWorkflow, canRequestCertificates } from "@/lib/certificate-access";
import {
  applyCertificateStatus,
  WORKFLOW_STATUSES,
  type WorkflowStatus,
} from "@/lib/certificate-workflow";

export const dynamic = "force-dynamic";

const STATUS_VALUES: CertificateStatus[] = ["REQUESTED", "APPROVED", "ISSUED", "REJECTED"];
const MAX_BULK = 500;

function getFranchiseFilter(user: { roleId: number; franchiseId?: string | null }) {
  if (user.roleId === ROLES.SUB_ADMIN && user.franchiseId) {
    return { franchiseId: BigInt(user.franchiseId) };
  }
  return {};
}

function studentOnCourse(courseId: string): Prisma.StudentWhereInput | null {
  if (!/^\d+$/.test(courseId)) return null;
  const cid = BigInt(courseId);
  return {
    OR: [
      { courseId: cid },
      { enrollments: { some: { courseId: cid, status: "ACTIVE" } } },
    ],
  };
}

function studentListFilter(courseId: string, search: string): Prisma.StudentWhereInput | undefined {
  const and: Prisma.StudentWhereInput[] = [];
  const course = studentOnCourse(courseId);
  if (course) and.push(course);
  const term = search.trim();
  if (term) {
    and.push({
      OR: [
        { studentCode: { contains: term } },
        { user: { fullName: { contains: term } } },
      ],
    });
  }
  if (!and.length) return undefined;
  return and.length === 1 ? and[0] : { AND: and };
}

function mapCertItem(
  c: {
    id: bigint;
    certificateNumber: string;
    status: string;
    issueDate: Date | null;
    createdAt: Date;
    student: {
      id: bigint;
      studentCode: string;
      courseId: bigint | null;
      user: { fullName: string; email: string };
      course: { id: bigint; name: string } | null;
      enrollments: { course: { id: bigint; name: string } }[];
    };
    franchise: { id: bigint; name: string };
  },
  filterCourseId: string
) {
  const courses: { id: string; name: string }[] = [];
  const pushCourse = (course: { id: bigint; name: string } | null | undefined) => {
    if (!course) return;
    const id = course.id.toString();
    if (!courses.some((row) => row.id === id)) courses.push({ id, name: course.name });
  };
  pushCourse(c.student.course);
  for (const row of c.student.enrollments) pushCourse(row.course);

  const selected = filterCourseId ? courses.find((row) => row.id === filterCourseId) : undefined;
  const shown = selected ? [selected] : courses;

  return {
    id: c.id.toString(),
    studentId: c.student.id.toString(),
    studentCode: c.student.studentCode,
    courseId: shown[0]?.id ?? c.student.courseId?.toString() ?? null,
    franchiseId: c.franchise.id.toString(),
    studentName: c.student.user.fullName,
    studentEmail: c.student.user.email,
    courseName: shown.length ? shown.map((row) => row.name).join(", ") : "—",
    franchiseName: c.franchise.name,
    certificateNumber: c.certificateNumber,
    status: c.status,
    issueDate: c.issueDate?.toISOString().split("T")[0] ?? null,
    createdAt: c.createdAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const roleId = Number(user.roleId);
    if (!canRequestCertificates(roleId)) {
      return errorResponse("Forbidden", 403);
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(100, Math.max(5, parseInt(searchParams.get("limit") || "20", 10) || 20));
    const status = searchParams.get("status");
    const franchiseId = searchParams.get("franchiseId");
    const courseId = searchParams.get("courseId");
    const search = (searchParams.get("search") || "").trim();

    const baseWhere: Prisma.CertificateWhereInput = { ...getFranchiseFilter(user) };
    if (franchiseId && /^\d+$/.test(franchiseId) && (roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN)) {
      baseWhere.franchiseId = BigInt(franchiseId);
    }
    const studentWhere = studentListFilter(courseId || "", search);
    if (studentWhere) baseWhere.student = studentWhere;

    const where: Prisma.CertificateWhereInput = { ...baseWhere };
    const statuses = (status || "")
      .split(",")
      .map((s) => s.trim().toUpperCase())
      .filter((s): s is CertificateStatus => STATUS_VALUES.includes(s as CertificateStatus));
    if (statuses.length === 1) where.status = statuses[0];
    else if (statuses.length > 1) where.status = { in: statuses };

    const [certificates, total, grouped] = await Promise.all([
      prisma.certificate.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            include: {
              user: { select: { fullName: true, email: true } },
              course: { select: { id: true, name: true } },
              enrollments: {
                where: { status: "ACTIVE" },
                select: { course: { select: { id: true, name: true } } },
              },
            },
          },
          franchise: { select: { id: true, name: true } },
        },
      }),
      prisma.certificate.count({ where }),
      prisma.certificate.groupBy({ by: ["status"], where: baseWhere, _count: { _all: true } }),
    ]);

    const items = certificates.map((row) => mapCertItem(row, courseId || ""));
    const counts = { REQUESTED: 0, APPROVED: 0, ISSUED: 0, REJECTED: 0 };
    for (const g of grouped) counts[g.status] = g._count._all;

    return successResponse(
      { items, counts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
      "Certificates retrieved"
    );
  } catch (err) {
    console.error("Certificates GET:", err);
    return errorResponse("Failed to fetch certificates", 500);
  }
}

type CreateRequestResult =
  | { error: string }
  | { id: string; certificateNumber: string };

async function createOneRequest(
  studentId: bigint,
  userId: string,
  roleId: number,
  franchiseId?: string | null
): Promise<CreateRequestResult> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: { franchise: true },
  });
  if (!student) return { error: "Student not found" };

  if (roleId === ROLES.SUB_ADMIN && franchiseId && BigInt(franchiseId) !== student.franchiseId) {
    return { error: "Cannot create certificate for student from another franchise" };
  }

  const existing = await prisma.certificate.findFirst({
    where: { studentId },
    orderBy: { createdAt: "desc" },
  });
  if (existing && existing.status !== "REJECTED") {
    return { error: "Certificate request already exists for this student" };
  }

  const certNum = `CERT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const cert = await prisma.certificate.create({
    data: {
      studentId,
      franchiseId: student.franchiseId,
      certificateNumber: certNum,
      status: "REQUESTED",
      requestedBy: BigInt(userId),
    },
  });

  return { id: cert.id.toString(), certificateNumber: certNum };
}

/** POST – single or batch certificate request (franchise → institute admin) */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const roleId = Number(user.roleId);
    if (!canRequestCertificates(roleId)) {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const { studentId, studentIds, courseId } = body;

    if (courseId) {
      const cid = BigInt(courseId);
      const franchiseFilter =
        roleId === ROLES.SUB_ADMIN && user.franchiseId
          ? { franchiseId: BigInt(user.franchiseId) }
          : body.franchiseId
            ? { franchiseId: BigInt(body.franchiseId) }
            : {};

      const students = await prisma.student.findMany({
        where: {
          ...franchiseFilter,
          status: { in: ["ACTIVE", "COMPLETED"] },
          OR: [
            { courseId: cid },
            { enrollments: { some: { courseId: cid, status: "ACTIVE" } } },
          ],
        },
        select: { id: true },
      });

      const created: string[] = [];
      const skipped: string[] = [];
      const errors: string[] = [];

      for (const s of students) {
        const result = await createOneRequest(s.id, user.id, roleId, user.franchiseId);
        if ("error" in result) {
          if (result.error.includes("already exists")) skipped.push(s.id.toString());
          else errors.push(result.error);
        } else {
          created.push(result.id);
        }
      }

      return successResponse(
        { created: created.length, skipped: skipped.length, ids: created },
        `Batch request: ${created.length} created, ${skipped.length} skipped (already requested)`
      );
    }

    if (Array.isArray(studentIds) && studentIds.length) {
      const list = Array.from(new Set((studentIds as unknown[]).map(String).filter((v) => /^\d+$/.test(v))));
      if (!list.length) return errorResponse("No valid students selected", 400);
      if (list.length > MAX_BULK) return errorResponse(`Select at most ${MAX_BULK} students at a time`, 400);

      let created = 0;
      let skipped = 0;
      const errors: string[] = [];
      for (const sid of list) {
        const result = await createOneRequest(BigInt(sid), user.id, roleId, user.franchiseId);
        if (!("error" in result)) created += 1;
        else if (result.error.includes("already exists")) skipped += 1;
        else errors.push(result.error);
      }
      if (!created && !skipped && errors.length) return errorResponse(errors[0], 400);
      return successResponse(
        { created, skipped, failed: errors.length },
        `${created} request(s) sent, ${skipped} already requested`
      );
    }

    const ids: bigint[] = studentId && /^\d+$/.test(String(studentId)) ? [BigInt(studentId)] : [];

    if (!ids.length) return errorResponse("Provide studentId, studentIds, or courseId for batch", 400);

    const results = [];
    for (const sid of ids) {
      const result = await createOneRequest(sid, user.id, roleId, user.franchiseId);
      if ("error" in result) return errorResponse(result.error, 400);
      results.push(result);
    }

    return successResponse(
      results.length === 1 ? results[0] : { items: results, count: results.length },
      results.length === 1 ? "Certificate request created" : `${results.length} requests created`
    );
  } catch (err) {
    console.error("Certificates POST:", err);
    return errorResponse("Failed to create certificate request", 500);
  }
}

/**
 * PUT – bulk approve / reject / issue (institute admin).
 * Body: { status, ids: string[] } or { status, franchiseId } for every eligible request of that franchise.
 */
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();
    if (!canManageCertificateWorkflow(Number(user.roleId))) {
      return errorResponse("Only institute admin can approve or issue certificates", 403);
    }

    const body = (await request.json().catch(() => ({}))) as {
      status?: WorkflowStatus;
      ids?: unknown[];
      franchiseId?: string;
      courseId?: string;
      search?: string;
    };
    const status = body.status as WorkflowStatus;
    if (!WORKFLOW_STATUSES.includes(status)) {
      return errorResponse("Invalid status. Use APPROVED, ISSUED, or REJECTED", 400);
    }

    let ids: bigint[] = [];
    if (Array.isArray(body.ids) && body.ids.length) {
      ids = Array.from(new Set(body.ids.map(String).filter((v) => /^\d+$/.test(v)))).map((v) => BigInt(v));
    } else if (body.franchiseId && /^\d+$/.test(String(body.franchiseId))) {
      const studentWhere = studentListFilter(String(body.courseId || ""), String(body.search || ""));
      const rows = await prisma.certificate.findMany({
        where: {
          franchiseId: BigInt(body.franchiseId),
          status: status === "ISSUED" ? "APPROVED" : "REQUESTED",
          ...(studentWhere ? { student: studentWhere } : {}),
        },
        select: { id: true },
        take: MAX_BULK,
      });
      ids = rows.map((r) => r.id);
    }

    if (!ids.length) return errorResponse("No certificate requests to update", 400);
    if (ids.length > MAX_BULK) return errorResponse(`Update at most ${MAX_BULK} requests at a time`, 400);

    const result = await applyCertificateStatus(ids, status, user.id);
    return successResponse(result, `${result.updated} request(s) ${status.toLowerCase()}`);
  } catch (err) {
    console.error("Certificates bulk PUT:", err);
    return errorResponse("Failed to update certificate requests", 500);
  }
}
