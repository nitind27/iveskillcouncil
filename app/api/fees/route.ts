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
    const pendingOnly = searchParams.get("pendingOnly") === "1";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
    const limit = pendingOnly ? 200 : Math.min(50, Math.max(10, parseInt(searchParams.get("limit") || "15", 10) || 15));
    const search = (searchParams.get("search") || "").trim();
    const franchiseId = searchParams.get("franchiseId");

    const franchiseFilter = getFranchiseFilter(user);
    const baseWhere: Record<string, unknown> = { ...franchiseFilter };
    if (franchiseId && (roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN)) {
      baseWhere.franchiseId = BigInt(franchiseId);
    }
    if (search && search.length > 0) {
      baseWhere.user = {
        OR: [
          { fullName: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ],
      };
    }

    const paymentFilter = baseWhere.franchiseId != null ? { franchiseId: baseWhere.franchiseId } : franchiseFilter;

    const [allStudents, recentPayments, agg] = await Promise.all([
      prisma.student.findMany({
        where: baseWhere,
        skip: pendingOnly ? 0 : (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { fullName: true, email: true, phone: true } },
          course: { select: { name: true } },
          franchise: { select: { name: true } },
        },
      }),
      prisma.payment.findMany({
        where: paymentFilter,
        take: 15,
        orderBy: { createdAt: "desc" },
        include: {
          student: { include: { user: { select: { fullName: true } } } },
        },
      }),
      prisma.student.aggregate({
        where: baseWhere,
        _sum: { totalFee: true, paidFee: true },
        _count: true,
      }),
    ]);

    let items = allStudents.map((s) => ({
      id: s.id.toString(),
      fullName: s.user.fullName,
      email: s.user.email,
      phone: s.user.phone,
      courseName: s.course.name,
      franchiseName: s.franchise.name,
      totalFee: Number(s.totalFee),
      paidFee: Number(s.paidFee),
      pendingFee: Number(s.totalFee) - Number(s.paidFee),
      address: s.address,
      area: s.area,
      pincode: s.pincode,
      city: s.city,
      state: s.state,
    }));

    if (pendingOnly) {
      items = items.filter((s) => s.pendingFee > 0);
    }

    const totalCount = agg._count;
    const totalFee = Number(agg._sum.totalFee ?? 0);
    const paidFee = Number(agg._sum.paidFee ?? 0);

    const responseData: Record<string, unknown> = {
      items,
      pendingFees: items.filter((s) => s.pendingFee > 0),
      recentPayments: recentPayments.map((p) => ({
        id: p.id.toString(),
        studentName: p.student.user.fullName,
        amount: Number(p.amount),
        status: p.status,
        paymentMode: p.paymentMode,
        paymentDate: p.paymentDate?.toISOString() ?? p.createdAt.toISOString(),
      })),
      summary: {
        totalStudents: totalCount,
        totalFee,
        paidFee,
        pendingFee: totalFee - paidFee,
      },
    };
    if (!pendingOnly) {
      responseData.pagination = {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      };
    }
    return successResponse(responseData, "Fees retrieved");
  } catch (err: unknown) {
    console.error("Fees GET:", err);
    const msg = err instanceof Error ? err.message : (typeof err === "string" ? err : JSON.stringify(err));
    if (msg.includes("Unknown column") || msg.includes("address") || msg.includes("area")) {
      return errorResponse("Database schema outdated. Please run the student address migration (scripts/run-all-migrations.sql block 5).", 500);
    }
    return errorResponse(msg || "Failed to fetch fees", 500);
  }
}

/** POST /api/fees – Record a new payment for a student */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const roleId = Number(user.roleId);
    if (roleId !== ROLES.SUPER_ADMIN && roleId !== ROLES.ADMIN && roleId !== ROLES.SUB_ADMIN) {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const { studentId, amount, paymentMode, transactionReference } = body;

    if (!studentId || amount == null || amount <= 0) {
      return errorResponse("Missing or invalid: studentId, amount (must be > 0)", 400);
    }

    const sid = BigInt(studentId);
    const mode = ["CASH", "UPI", "CARD", "BANK_TRANSFER"].includes(paymentMode) ? paymentMode : "CASH";

    const student = await prisma.student.findUnique({
      where: { id: sid },
      include: { franchise: true },
    });
    if (!student) return errorResponse("Student not found", 404);

    const filter = getFranchiseFilter(user);
    if (Object.keys(filter).length && student.franchiseId !== BigInt(user.franchiseId!)) {
      return errorResponse("Cannot add payment for student from another franchise", 403);
    }

    const amountNum = Number(amount);
    const currentPaid = Number(student.paidFee);
    const totalFee = Number(student.totalFee);
    if (currentPaid + amountNum > totalFee) {
      return errorResponse(`Amount exceeds pending fee (₹${(totalFee - currentPaid).toLocaleString("en-IN")})`, 400);
    }

    await prisma.$transaction([
      prisma.payment.create({
        data: {
          studentId: sid,
          franchiseId: student.franchiseId,
          amount: amountNum,
          paymentMode: mode,
          transactionReference: transactionReference?.trim() || null,
          status: "SUCCESS",
          paymentDate: new Date(),
        },
      }),
      prisma.student.update({
        where: { id: sid },
        data: { paidFee: { increment: amountNum } },
      }),
    ]);

    return successResponse(
      { studentId: studentId, amount: amountNum, newPaidFee: currentPaid + amountNum },
      "Payment recorded successfully"
    );
  } catch (err) {
    console.error("Fees POST:", err);
    return errorResponse("Failed to record payment", 500);
  }
}
