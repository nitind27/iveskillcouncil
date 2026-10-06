import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";
import { sendFeeReceiptEmail, sendStudentWelcomeEmail } from "@/lib/email";
import { refreshStudentCourseTotals } from "@/lib/student-enrollments";

export const dynamic = "force-dynamic";

function buildLoginUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/login`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}/login`;
  }
  return "/login";
}

async function loadStudentForAssign(id: string) {
  return prisma.student.findUnique({
    where: { id: BigInt(id) },
    include: {
      user: { select: { fullName: true, email: true, phone: true } },
      franchise: { select: { name: true } },
      course: { select: { id: true, name: true } },
      enrollments: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "asc" },
        include: { course: { select: { id: true, name: true } } },
      },
    },
  });
}

function canAssign(
  roleId: number,
  userFranchiseId: string | null | undefined,
  studentFranchiseId: bigint
) {
  return !(
    roleId === ROLES.SUB_ADMIN &&
    userFranchiseId &&
    BigInt(userFranchiseId) !== studentFranchiseId
  );
}

/** GET current courses so admin can add more without replacing them. */
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
    const student = await loadStudentForAssign(id);
    if (!student) return errorResponse("Student not found", 404);
    if (!canAssign(roleId, user.franchiseId, student.franchiseId)) {
      return errorResponse("Cannot view courses for another franchise", 403);
    }

    return successResponse(
      {
        primaryCourseId: student.courseId?.toString() ?? null,
        enrollments: student.enrollments.map((row) => ({
          id: row.id.toString(),
          courseId: row.courseId.toString(),
          courseName: row.course.name,
          totalFee: Number(row.totalFee),
          primary: student.courseId?.toString() === row.courseId.toString(),
        })),
      },
      "Enrollments"
    );
  } catch (e) {
    console.error("GET assign-course", e);
    return errorResponse("Failed to load courses", 500);
  }
}

/**
 * POST /api/students/[id]/assign-course
 * Adds one or more courses. Existing enrollments stay.
 */
export async function POST(
  request: NextRequest,
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
    const student = await loadStudentForAssign(id);
    if (!student) return errorResponse("Student not found", 404);
    if (!canAssign(roleId, user.franchiseId, student.franchiseId)) {
      return errorResponse("Cannot assign course for another franchise", 403);
    }

    const body = await request.json();
    const rawCourses: Array<{ courseId?: string; totalFee?: number }> = Array.isArray(body.courses)
      ? body.courses
      : body.courseId
        ? [{ courseId: body.courseId, totalFee: body.totalFee }]
        : [];

    const requested = rawCourses
      .map((row) => ({
        courseId: String(row.courseId || ""),
        totalFee: Number(row.totalFee),
      }))
      .filter((row) => row.courseId);

    if (!requested.length) return errorResponse("Select at least one course", 400);

    const seen = new Set<string>();
    for (const row of requested) {
      if (seen.has(row.courseId)) return errorResponse("Each course can be selected once", 400);
      seen.add(row.courseId);
      if (!Number.isFinite(row.totalFee) || row.totalFee < 0) {
        return errorResponse("Enter a valid fee for every selected course", 400);
      }
    }

    const already = new Set(student.enrollments.map((row) => row.courseId.toString()));
    const duplicate = requested.find((row) => already.has(row.courseId));
    if (duplicate) {
      const name =
        student.enrollments.find((row) => row.courseId.toString() === duplicate.courseId)?.course
          .name || "this course";
      return errorResponse(`${name} is already added. Pick a different course.`, 400);
    }

    const feeRows = await Promise.all(
      requested.map((row) =>
        prisma.franchiseCourseFee.findUnique({
          where: {
            franchiseId_courseId: {
              franchiseId: student.franchiseId,
              courseId: BigInt(row.courseId),
            },
          },
          include: { course: { select: { name: true } } },
        })
      )
    );
    if (feeRows.some((row) => !row)) {
      return errorResponse("One of the courses is not available for this franchise", 400);
    }

    const addedFee = requested.reduce((sum, row) => sum + row.totalFee, 0);
    const initialPayment =
      body.initialPayment != null && Number(body.initialPayment) > 0
        ? Number(body.initialPayment)
        : 0;
    const paymentMode = ["CASH", "UPI", "CARD", "BANK_TRANSFER"].includes(body.paymentMode)
      ? body.paymentMode
      : "CASH";
    if (initialPayment > addedFee) {
      return errorResponse("Initial payment cannot exceed the fee of the courses you are adding", 400);
    }

    await prisma.studentEnrollment.createMany({
      data: requested.map((row) => ({
        studentId: student.id,
        courseId: BigInt(row.courseId),
        totalFee: row.totalFee,
        status: "ACTIVE",
      })),
    });

    if (!student.courseId) {
      await prisma.student.update({
        where: { id: student.id },
        data: { courseId: BigInt(requested[0].courseId) },
      });
    }

    await refreshStudentCourseTotals(student.id);

    const paymentDate = new Date();
    let paymentId: bigint | null = null;
    if (initialPayment > 0) {
      const payment = await prisma.payment.create({
        data: {
          studentId: student.id,
          franchiseId: student.franchiseId,
          amount: initialPayment,
          paymentMode,
          status: "SUCCESS",
          paymentDate,
        },
      });
      paymentId = payment.id;
      await prisma.student.update({
        where: { id: student.id },
        data: { paidFee: { increment: initialPayment } },
      });
    }

    const fresh = await prisma.student.findUnique({
      where: { id: student.id },
      select: { totalFee: true, paidFee: true },
    });
    const totalFee = Number(fresh?.totalFee ?? 0);
    const paidFee = Number(fresh?.paidFee ?? 0);
    const pendingFee = Math.max(0, totalFee - paidFee);
    const courseName = feeRows.map((row) => row!.course.name).join(", ");
    const franchiseName = student.franchise?.name ?? "Franchise";
    const studentEmail = student.user.email;
    let emailSent = false;
    let receiptEmailSent = false;

    if (studentEmail) {
      const enrollResult = await sendStudentWelcomeEmail(studentEmail, {
        fullName: student.user.fullName,
        email: studentEmail,
        loginUrl: buildLoginUrl(),
        courseName,
        franchiseName,
        totalFee,
        paidFee,
        pendingFee,
        admissionDate: student.admissionDate
          ? student.admissionDate.toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        studentCode: student.studentCode,
        phone: student.user.phone,
        address: student.address,
        area: student.area,
        pincode: student.pincode,
        city: student.city,
        state: student.state,
        initialPaymentAmount: initialPayment > 0 ? initialPayment : undefined,
        courseUpdateOnly: true,
      });
      emailSent = enrollResult.success;
      if (!enrollResult.success) {
        console.warn("Course assign email failed:", enrollResult.error);
      }
    }

    if (initialPayment > 0 && paymentId && studentEmail) {
      const receiptNo = `RCP-${paymentId.toString().padStart(6, "0")}`;
      const receiptResult = await sendFeeReceiptEmail(studentEmail, {
        fullName: student.user.fullName,
        studentCode: student.studentCode,
        email: studentEmail,
        franchiseName,
        courseName,
        receiptNo,
        paymentDate: paymentDate.toISOString().split("T")[0],
        amountPaid: initialPayment,
        paymentMode,
        totalFee,
        paidFee,
        pendingFee,
      });
      receiptEmailSent = receiptResult.success;
      if (!receiptResult.success) {
        console.warn("Initial fee receipt email failed:", receiptResult.error);
      }
    }

    return successResponse(
      {
        id: student.id.toString(),
        studentCode: student.studentCode,
        fullName: student.user.fullName,
        courseName,
        added: requested.map((row, i) => ({
          courseId: row.courseId,
          courseName: feeRows[i]!.course.name,
          totalFee: row.totalFee,
        })),
        totalFee,
        paidFee,
        pendingFee,
        emailSent,
        receiptEmailSent,
      },
      requested.length > 1 ? "Courses added" : "Course added"
    );
  } catch (e) {
    console.error("POST assign-course", e);
    return errorResponse("Failed to assign course", 500);
  }
}

/** Remove one course. Other courses stay. Certificate course moves to the next one if needed. */
export async function DELETE(
  request: NextRequest,
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
    const student = await prisma.student.findUnique({ where: { id: BigInt(id) } });
    if (!student) return errorResponse("Student not found", 404);
    if (!canAssign(roleId, user.franchiseId, student.franchiseId)) {
      return errorResponse("Cannot change courses for another franchise", 403);
    }

    const courseId = request.nextUrl.searchParams.get("courseId");
    if (!courseId) return errorResponse("courseId is required", 400);

    await prisma.studentEnrollment.deleteMany({
      where: { studentId: student.id, courseId: BigInt(courseId) },
    });
    await refreshStudentCourseTotals(student.id);

    return successResponse({ courseId }, "Course removed");
  } catch (e) {
    console.error("DELETE assign-course", e);
    return errorResponse("Failed to remove course", 500);
  }
}
