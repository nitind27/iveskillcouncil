import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/**
 * POST /api/students/[id]/assign-course
 * Separate step after student is created with personal details.
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
    const student = await prisma.student.findUnique({
      where: { id: BigInt(id) },
      include: { user: { select: { fullName: true } } },
    });
    if (!student) return errorResponse("Student not found", 404);

    if (
      roleId === ROLES.SUB_ADMIN &&
      user.franchiseId &&
      BigInt(user.franchiseId) !== student.franchiseId
    ) {
      return errorResponse("Cannot assign course for another franchise", 403);
    }

    const body = await request.json();
    const courseId = String(body.courseId || "");
    const totalFee = Number(body.totalFee);
    const initialPayment =
      body.initialPayment != null && Number(body.initialPayment) > 0
        ? Number(body.initialPayment)
        : 0;
    const paymentMode = ["CASH", "UPI", "CARD", "BANK_TRANSFER"].includes(body.paymentMode)
      ? body.paymentMode
      : "CASH";

    if (!courseId) return errorResponse("Select a course", 400);
    if (!Number.isFinite(totalFee) || totalFee < 0) {
      return errorResponse("Enter a valid total fee", 400);
    }
    if (initialPayment > totalFee) {
      return errorResponse("Initial payment cannot exceed total fee", 400);
    }

    const feeRow = await prisma.franchiseCourseFee.findUnique({
      where: {
        franchiseId_courseId: {
          franchiseId: student.franchiseId,
          courseId: BigInt(courseId),
        },
      },
      include: { course: { select: { name: true } } },
    });
    if (!feeRow) {
      return errorResponse("This course is not available for the student's franchise", 400);
    }

    const paidFee = Number(student.paidFee) + initialPayment;

    await prisma.student.update({
      where: { id: student.id },
      data: {
        courseId: BigInt(courseId),
        totalFee,
        paidFee,
      },
    });

    if (initialPayment > 0) {
      await prisma.payment.create({
        data: {
          studentId: student.id,
          franchiseId: student.franchiseId,
          amount: initialPayment,
          paymentMode,
          status: "SUCCESS",
          paymentDate: new Date(),
        },
      });
    }

    return successResponse(
      {
        id: student.id.toString(),
        studentCode: student.studentCode,
        fullName: student.user.fullName,
        courseId,
        courseName: feeRow.course.name,
        totalFee,
        paidFee,
      },
      "Course assigned successfully"
    );
  } catch (e) {
    console.error("POST assign-course", e);
    return errorResponse("Failed to assign course", 500);
  }
}
