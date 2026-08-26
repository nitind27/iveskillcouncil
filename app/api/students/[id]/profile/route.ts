import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/**
 * GET /api/students/[id]/profile — full student card for drawer
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
    const student = await prisma.student.findUnique({
      where: { id: BigInt(id) },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            status: true,
            createdAt: true,
          },
        },
        franchise: { select: { id: true, name: true } },
        course: { select: { id: true, name: true } },
        payments: {
          orderBy: { paymentDate: "desc" },
          take: 10,
          select: {
            id: true,
            amount: true,
            paymentMode: true,
            status: true,
            paymentDate: true,
          },
        },
      },
    });

    if (!student) return errorResponse("Student not found", 404);

    if (
      roleId === ROLES.SUB_ADMIN &&
      user.franchiseId &&
      BigInt(user.franchiseId) !== student.franchiseId
    ) {
      return errorResponse("Forbidden", 403);
    }

    const totalFee = Number(student.totalFee);
    const paidFee = Number(student.paidFee);

    return successResponse(
      {
        id: student.id.toString(),
        studentCode: student.studentCode,
        fullName: student.user.fullName,
        firstName: student.firstName,
        surname: student.surname,
        relationship: student.relationship,
        fatherHusbandName: student.fatherHusbandName,
        motherName: student.motherName,
        email: student.user.email,
        phone: student.user.phone,
        alternateMobile: student.alternateMobile,
        dateOfBirth: student.dateOfBirth
          ? student.dateOfBirth.toISOString().split("T")[0]
          : null,
        gender: student.gender,
        profileImageUrl: student.profileImageUrl,
        signatureUrl: student.signatureUrl,
        showFatherOnCertificate: student.showFatherOnCertificate,
        showSurnameOnCertificate: student.showSurnameOnCertificate,
        userStatus: student.user.status,
        status: student.status,
        franchiseId: student.franchise.id.toString(),
        franchiseName: student.franchise.name,
        courseId: student.course?.id.toString() ?? null,
        courseName: student.course?.name ?? null,
        courseAssigned: !!student.courseId,
        totalFee,
        paidFee,
        pendingFee: totalFee - paidFee,
        admissionDate: student.admissionDate.toISOString().split("T")[0],
        address: student.address,
        area: student.area,
        pincode: student.pincode,
        city: student.city,
        state: student.state,
        createdAt: student.createdAt.toISOString(),
        payments: student.payments.map((p) => ({
          id: p.id.toString(),
          amount: Number(p.amount),
          paymentMode: p.paymentMode,
          status: p.status,
          paymentDate: p.paymentDate.toISOString(),
        })),
      },
      "Student profile"
    );
  } catch (e) {
    console.error("GET student profile", e);
    return errorResponse("Failed to load profile", 500);
  }
}
