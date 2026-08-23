import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";
import { canRequestCertificates } from "@/lib/certificate-access";

export const dynamic = "force-dynamic";

function getFranchiseFilter(user: { roleId: number; franchiseId?: string | null }) {
  if (user.roleId === ROLES.SUB_ADMIN && user.franchiseId) {
    return { franchiseId: BigInt(user.franchiseId) };
  }
  return {};
}

function mapCertItem(c: {
  id: bigint;
  certificateNumber: string;
  status: string;
  issueDate: Date | null;
  createdAt: Date;
  student: {
    id: bigint;
    courseId: bigint;
    user: { fullName: string; email: string };
    course: { id: bigint; name: string };
  };
  franchise: { id: bigint; name: string };
}) {
  return {
    id: c.id.toString(),
    studentId: c.student.id.toString(),
    courseId: c.student.courseId.toString(),
    franchiseId: c.franchise.id.toString(),
    studentName: c.student.user.fullName,
    studentEmail: c.student.user.email,
    courseName: c.student.course.name,
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

    const where: Record<string, unknown> = { ...getFranchiseFilter(user) };
    if (status) where.status = status;
    if (franchiseId && (roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN)) {
      where.franchiseId = BigInt(franchiseId);
    }
    if (courseId) {
      where.student = { courseId: BigInt(courseId) };
    }

    const [certificates, total] = await Promise.all([
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
            },
          },
          franchise: { select: { id: true, name: true } },
        },
      }),
      prisma.certificate.count({ where }),
    ]);

    const items = certificates.map(mapCertItem);

    return successResponse(
      { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
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
        where: { courseId: cid, ...franchiseFilter, status: { in: ["ACTIVE", "COMPLETED"] } },
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

    const ids: bigint[] = studentIds?.length
      ? studentIds.map((id: string) => BigInt(id))
      : studentId
        ? [BigInt(studentId)]
        : [];

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
