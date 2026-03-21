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

    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(5, parseInt(searchParams.get("limit") || "10")));
    const status = searchParams.get("status");

    if (user.roleId === ROLES.STUDENT) {
      const student = await prisma.student.findUnique({
        where: { userId: BigInt(user.id) },
      });
      if (!student) return successResponse({ items: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

      const where: Record<string, unknown> = { studentId: student.id };
      if (status) where.status = status;

      const [items, total] = await Promise.all([
        prisma.feedback.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: "desc" },
        }),
        prisma.feedback.count({ where }),
      ]);

      return successResponse({
        items: items.map((f) => ({
          id: f.id.toString(),
          message: f.message,
          response: f.response,
          status: f.status,
          createdAt: f.createdAt.toISOString(),
        })),
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    const roleId = Number(user.roleId);
    if (roleId !== ROLES.SUPER_ADMIN && roleId !== ROLES.ADMIN && roleId !== ROLES.SUB_ADMIN) {
      return errorResponse("Forbidden", 403);
    }

    const filter = getFranchiseFilter(user);
    const where: Record<string, unknown> = { ...filter };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          student: {
            include: { user: { select: { fullName: true, email: true } } },
          },
        },
      }),
      prisma.feedback.count({ where }),
    ]);

    return successResponse({
      items: items.map((f) => ({
        id: f.id.toString(),
        studentName: f.student.user.fullName,
        studentEmail: f.student.user.email,
        message: f.message,
        response: f.response,
        status: f.status,
        createdAt: f.createdAt.toISOString(),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Feedback GET:", err);
    return errorResponse("Failed to fetch feedback", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    if (user.roleId !== ROLES.STUDENT) {
      return errorResponse("Only students can submit feedback", 403);
    }

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return errorResponse("Message is required", 400);
    }

    const student = await prisma.student.findUnique({
      where: { userId: BigInt(user.id) },
    });

    if (!student) return errorResponse("Student record not found", 404);

    await prisma.feedback.create({
      data: {
        studentId: student.id,
        franchiseId: student.franchiseId,
        message: message.trim(),
      },
    });

    return successResponse(null, "Feedback submitted");
  } catch (err) {
    console.error("Feedback POST:", err);
    return errorResponse("Failed to submit feedback", 500);
  }
}
