import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";
import { hashPassword } from "@/lib/auth";
import { validateName, validateEmail, validatePhone } from "@/lib/validation";
import { sendStudentWelcomeEmail } from "@/lib/email";

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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(5, parseInt(searchParams.get("limit") || "10")));
    const search = (searchParams.get("search") || "").trim();
    const status = searchParams.get("status");
    const franchiseId = searchParams.get("franchiseId");
    const courseId = searchParams.get("courseId");

    const where: Record<string, unknown> = { ...getFranchiseFilter(user) };
    if (status) where.status = status;
    if (franchiseId && (roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN)) {
      where.franchiseId = BigInt(franchiseId);
    }
    if (courseId && (roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN)) {
      where.courseId = BigInt(courseId);
    }
    if (search) {
      where.user = {
        OR: [
          { fullName: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ],
      };
    }

    const [students, total] = await Promise.all([
      prisma.student.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, fullName: true, email: true, phone: true } },
          franchise: { select: { id: true, name: true } },
          course: { select: { id: true, name: true } },
        },
      }),
      prisma.student.count({ where }),
    ]);

    const items = students.map((s) => ({
      id: s.id.toString(),
      fullName: s.user.fullName,
      email: s.user.email,
      phone: s.user.phone,
      franchiseName: s.franchise.name,
      courseName: s.course.name,
      totalFee: Number(s.totalFee),
      paidFee: Number(s.paidFee),
      pendingFee: Number(s.totalFee) - Number(s.paidFee),
      admissionDate: s.admissionDate.toISOString().split("T")[0],
      status: s.status,
      address: s.address,
      area: s.area,
      pincode: s.pincode,
      city: s.city,
      state: s.state,
    }));

    return successResponse(
      { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
      "Students retrieved"
    );
  } catch (err: unknown) {
    console.error("Students GET:", err);
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unknown column") || msg.includes("address") || msg.includes("area") || msg.includes("pincode")) {
      return errorResponse("Database schema outdated. Please run the student address migration (scripts/run-all-migrations.sql block 5).", 500);
    }
    return errorResponse(msg || "Failed to fetch students", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const roleId = Number(user.roleId);
    if (roleId !== ROLES.SUPER_ADMIN && roleId !== ROLES.ADMIN && roleId !== ROLES.SUB_ADMIN) {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const {
      fullName,
      email,
      phone,
      password,
      franchiseId,
      courseId,
      totalFee,
      admissionDate,
      address,
      area,
      pincode,
      city,
      state,
      initialPayment,
      paymentMode,
    } = body;

    if (!fullName || !email || !franchiseId || !courseId || totalFee == null) {
      return errorResponse("Missing required fields: fullName, email, franchiseId, courseId, totalFee", 400);
    }
    const nameR = validateName(String(fullName).trim());
    const emailR = validateEmail(String(email).trim());
    const phoneR = phone ? validatePhone(String(phone).trim()) : { valid: true };
    if (!nameR.valid) return errorResponse(nameR.error!, 400);
    if (!emailR.valid) return errorResponse(emailR.error!, 400);
    if (!phoneR.valid) return errorResponse(phoneR.error!, 400);

    const fid = BigInt(franchiseId);
    const cid = BigInt(courseId);

    if (roleId === ROLES.SUB_ADMIN && user.franchiseId && BigInt(user.franchiseId) !== fid) {
      return errorResponse("Cannot add student to another franchise", 403);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return errorResponse("Email already registered", 400);

    const hashedPassword = await hashPassword(password || "Student@123");
    const admission = admissionDate ? new Date(admissionDate) : new Date();
    const totalFeeNum = Number(totalFee);
    const initialAmount = initialPayment != null && Number(initialPayment) > 0 ? Number(initialPayment) : 0;
    const mode = ["CASH", "UPI", "CARD", "BANK_TRANSFER"].includes(paymentMode) ? paymentMode : "CASH";

    const newUser = await prisma.user.create({
      data: {
        roleId: ROLES.STUDENT,
        franchiseId: fid,
        fullName,
        email,
        phone: phone || null,
        password: hashedPassword,
      },
    });

    const newStudent = await prisma.student.create({
      data: {
        userId: newUser.id,
        franchiseId: fid,
        courseId: cid,
        totalFee: totalFeeNum,
        paidFee: initialAmount,
        admissionDate: admission,
        address: address?.trim() || null,
        area: area?.trim() || null,
        pincode: pincode?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
      },
    });

    if (initialAmount > 0) {
      await prisma.payment.create({
        data: {
          studentId: newStudent.id,
          franchiseId: fid,
          amount: initialAmount,
          paymentMode: mode,
          status: "SUCCESS",
          paymentDate: new Date(),
        },
      });
    }

    const [franchise, course] = await Promise.all([
      prisma.franchise.findUnique({ where: { id: fid }, select: { name: true } }),
      prisma.course.findUnique({ where: { id: cid }, select: { name: true } }),
    ]);

    const loginUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL}`}/login`
        : "/login";

    const emailResult = await sendStudentWelcomeEmail(email, {
      fullName,
      email,
      password: password || "Student@123",
      loginUrl,
      courseName: course?.name ?? "Course",
      franchiseName: franchise?.name ?? "Franchise",
      totalFee: totalFeeNum,
      paidFee: initialAmount,
      pendingFee: totalFeeNum - initialAmount,
      admissionDate: admission.toISOString().split("T")[0],
      address: address?.trim() || null,
      area: area?.trim() || null,
      pincode: pincode?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || null,
      initialPaymentAmount: initialAmount > 0 ? initialAmount : undefined,
    });

    if (!emailResult.success) {
      console.warn("Student welcome email failed:", emailResult.error);
    }

    return successResponse(
      { id: newUser.id.toString(), emailSent: emailResult.success },
      "Student added successfully"
    );
  } catch (err: unknown) {
    console.error("Students POST:", err);
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unknown column") || msg.includes("address") || msg.includes("area") || msg.includes("pincode")) {
      return errorResponse("Database schema outdated. Please run the student address migration (scripts/run-all-migrations.sql block 5).", 500);
    }
    if (msg.includes("Duplicate entry") || msg.includes("Unique constraint")) {
      return errorResponse("Email already registered", 400);
    }
    return errorResponse(msg || "Failed to add student", 500);
  }
}
