import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

function getFranchiseFilter(user: { roleId: number; franchiseId?: string | null }) {
  if (user.roleId === ROLES.SUB_ADMIN && user.franchiseId) {
    return { franchiseId: BigInt(user.franchiseId) };
  }
  return {};
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const roleId = Number(user.roleId);
    if (roleId !== ROLES.SUPER_ADMIN && roleId !== ROLES.ADMIN && roleId !== ROLES.SUB_ADMIN) {
      return errorResponse("Forbidden", 403);
    }

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = Math.min(50, Math.max(5, parseInt(searchParams.get("limit") || "10", 10) || 10));
    const status = searchParams.get("status");
    const franchiseId = searchParams.get("franchiseId");

    const where: Record<string, unknown> = { ...getFranchiseFilter(user) };
    if (status) where.status = status;
    if (franchiseId && (roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN)) {
      where.franchiseId = BigInt(franchiseId);
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
              course: { select: { name: true } },
            },
          },
          franchise: { select: { name: true } },
        },
      }),
      prisma.certificate.count({ where }),
    ]);

    const items = certificates.map((c) => ({
      id: c.id.toString(),
      studentName: c.student.user.fullName,
      studentEmail: c.student.user.email,
      courseName: c.student.course.name,
      franchiseName: c.franchise.name,
      certificateNumber: c.certificateNumber,
      status: c.status,
      issueDate: c.issueDate?.toISOString().split("T")[0] ?? null,
      createdAt: c.createdAt.toISOString(),
    }));

    return successResponse(
      { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
      "Certificates retrieved"
    );
  } catch (err) {
    console.error("Certificates GET:", err);
    return errorResponse("Failed to fetch certificates", 500);
  }
}

/** POST – Create certificate request for a student (admin creates on behalf) */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const roleId = Number(user.roleId);
    if (roleId !== ROLES.SUPER_ADMIN && roleId !== ROLES.ADMIN && roleId !== ROLES.SUB_ADMIN) {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const { studentId } = body;

    if (!studentId) return errorResponse("Missing studentId", 400);

    const sid = BigInt(studentId);
    const student = await prisma.student.findUnique({
      where: { id: sid },
      include: { franchise: true },
    });

    if (!student) return errorResponse("Student not found", 404);

    if (roleId === ROLES.SUB_ADMIN && user.franchiseId && BigInt(user.franchiseId) !== student.franchiseId) {
      return errorResponse("Cannot create certificate for student from another franchise", 403);
    }

    const existing = await prisma.certificate.findFirst({
      where: { studentId: sid },
      orderBy: { createdAt: "desc" },
    });
    if (existing && existing.status !== "REJECTED") {
      return errorResponse("Certificate request already exists for this student", 400);
    }

    const certNum = `CERT-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    const cert = await prisma.certificate.create({
      data: {
        studentId: sid,
        franchiseId: student.franchiseId,
        certificateNumber: certNum,
        status: "REQUESTED",
      },
    });

    return successResponse({ id: cert.id.toString(), certificateNumber: certNum }, "Certificate request created");
  } catch (err) {
    console.error("Certificates POST:", err);
    return errorResponse("Failed to create certificate request", 500);
  }
}
