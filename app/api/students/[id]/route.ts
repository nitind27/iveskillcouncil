import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";
import { hashPassword } from "@/lib/auth";
import { validateEmail, validatePhone } from "@/lib/validation";
import { saveStudentImage } from "@/lib/student-images";
import { unlink } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

/**
 * GET /api/students/[id] – Full student details for edit/view
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
    const sid = BigInt(id);

    const student = await prisma.student.findUnique({
      where: { id: sid },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            status: true,
            roleId: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        franchise: { select: { id: true, name: true, city: true, state: true } },
        course: { select: { id: true, name: true, type: true, baseFee: true, durationMonths: true } },
        _count: {
          select: {
            certificates: true,
            payments: true,
            feedback: true,
            examAttempts: true,
          },
        },
      },
    });

    if (!student) return errorResponse("Student not found", 404);

    if (roleId === ROLES.SUB_ADMIN && user.franchiseId && BigInt(user.franchiseId) !== student.franchiseId) {
      return errorResponse("Cannot view student from another franchise", 403);
    }

    const totalFee = Number(student.totalFee);
    const paidFee = Number(student.paidFee);

    return successResponse(
      {
        id: student.id.toString(),
        studentCode: student.studentCode,
        userId: student.userId.toString(),
        franchiseId: student.franchise.id.toString(),
        franchiseName: student.franchise.name,
        courseId: student.course?.id.toString() ?? null,
        courseName: student.course?.name ?? null,
        courseType: student.course?.type ?? null,
        courseAssigned: !!student.courseId,
        firstName: student.firstName || "",
        surname: student.surname || "",
        fullName: student.user.fullName,
        email: student.user.email,
        phone: student.user.phone || "",
        alternateMobile: student.alternateMobile || "",
        relationship: student.relationship || "",
        fatherHusbandName: student.fatherHusbandName || "",
        motherName: student.motherName || "",
        gender: student.gender || "",
        dateOfBirth: student.dateOfBirth ? student.dateOfBirth.toISOString().split("T")[0] : "",
        admissionDate: student.admissionDate.toISOString().split("T")[0],
        status: student.status,
        userStatus: student.user.status,
        totalFee,
        paidFee,
        pendingFee: Math.max(0, totalFee - paidFee),
        address: student.address || "",
        area: student.area || "",
        pincode: student.pincode || "",
        city: student.city || "",
        state: student.state || "",
        showFatherOnCertificate: Boolean(student.showFatherOnCertificate),
        showSurnameOnCertificate: Boolean(student.showSurnameOnCertificate),
        profileImageUrl: student.profileImageUrl,
        signatureUrl: student.signatureUrl,
        createdAt: student.createdAt.toISOString(),
        updatedAt: student.updatedAt.toISOString(),
        counts: student._count,
      },
      "Student details retrieved"
    );
  } catch (err) {
    console.error("Student GET error:", err);
    return errorResponse("Failed to fetch student details", 500);
  }
}

/**
 * PATCH /api/students/[id] – Full update for student & associated user account
 */
export async function PATCH(
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
    const sid = BigInt(id);

    const student = await prisma.student.findUnique({
      where: { id: sid },
      include: { user: true },
    });
    if (!student) return errorResponse("Student not found", 404);

    if (roleId === ROLES.SUB_ADMIN && user.franchiseId && BigInt(user.franchiseId) !== student.franchiseId) {
      return errorResponse("Cannot edit student from another franchise", 403);
    }

    const body = await request.json();

    const studentUpdate: Record<string, unknown> = {};
    const userUpdate: Record<string, unknown> = {};

    // 1. Franchise change (Super Admin / Admin only)
    if (body.franchiseId !== undefined && body.franchiseId !== null) {
      if (roleId === ROLES.SUB_ADMIN) {
        if (BigInt(body.franchiseId) !== student.franchiseId) {
          return errorResponse("Franchise admin cannot change student franchise", 403);
        }
      } else {
        const newFid = BigInt(body.franchiseId);
        const franchise = await prisma.franchise.findUnique({ where: { id: newFid } });
        if (!franchise) return errorResponse("Selected franchise does not exist", 400);
        studentUpdate.franchiseId = newFid;
        userUpdate.franchiseId = newFid;
      }
    }

    // 2. Personal Information
    if (body.firstName !== undefined) {
      studentUpdate.firstName = body.firstName ? String(body.firstName).trim() : null;
    }
    if (body.surname !== undefined) {
      studentUpdate.surname = body.surname ? String(body.surname).trim() : null;
    }

    // Derive or set fullName for user
    const first = body.firstName !== undefined ? String(body.firstName || "").trim() : (student.firstName || "");
    const last = body.surname !== undefined ? String(body.surname || "").trim() : (student.surname || "");
    const derivedFullName = [first, last].filter(Boolean).join(" ").trim();
    if (body.fullName !== undefined && String(body.fullName).trim()) {
      userUpdate.fullName = String(body.fullName).trim();
    } else if (derivedFullName) {
      userUpdate.fullName = derivedFullName;
    }

    if (body.relationship !== undefined) {
      const rel = String(body.relationship || "").toUpperCase();
      studentUpdate.relationship = ["FATHER", "HUSBAND", "GUARDIAN", "OTHER"].includes(rel) ? rel : null;
    }
    if (body.fatherHusbandName !== undefined) {
      studentUpdate.fatherHusbandName = body.fatherHusbandName ? String(body.fatherHusbandName).trim() : null;
    }
    if (body.motherName !== undefined) {
      studentUpdate.motherName = body.motherName ? String(body.motherName).trim() : null;
    }
    if (body.gender !== undefined) {
      const g = String(body.gender || "").toUpperCase();
      studentUpdate.gender = ["MALE", "FEMALE", "OTHER"].includes(g) ? g : null;
    }
    if (body.dateOfBirth !== undefined) {
      studentUpdate.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
    }
    if (body.admissionDate !== undefined && body.admissionDate) {
      studentUpdate.admissionDate = new Date(body.admissionDate);
    }

    // 3. Contact & User credentials
    if (body.email !== undefined && body.email) {
      const trimmedEmail = String(body.email).trim().toLowerCase();
      const emailValidation = validateEmail(trimmedEmail);
      if (!emailValidation.valid) return errorResponse(emailValidation.error!, 400);

      if (trimmedEmail !== student.user.email) {
        const existing = await prisma.user.findFirst({
          where: {
            email: trimmedEmail,
            NOT: { id: student.userId },
          },
        });
        if (existing) return errorResponse("This email is already in use by another account", 400);
        userUpdate.email = trimmedEmail;
      }
    }

    if (body.phone !== undefined) {
      const trimmedPhone = body.phone ? String(body.phone).trim() : null;
      if (trimmedPhone) {
        const phoneValidation = validatePhone(trimmedPhone);
        if (!phoneValidation.valid) return errorResponse(phoneValidation.error!, 400);

        if (trimmedPhone !== student.user.phone) {
          const existing = await prisma.user.findFirst({
            where: {
              phone: trimmedPhone,
              NOT: { id: student.userId },
            },
          });
          if (existing) return errorResponse("This phone number is already registered to another user", 400);
        }
      }
      userUpdate.phone = trimmedPhone;
    }

    if (body.alternateMobile !== undefined) {
      studentUpdate.alternateMobile = body.alternateMobile ? String(body.alternateMobile).trim() : null;
    }

    // 4. Statuses
    if (body.status !== undefined) {
      const st = String(body.status).toUpperCase();
      if (!["ACTIVE", "COMPLETED", "DROPPED"].includes(st)) {
        return errorResponse("Invalid student status. Must be ACTIVE, COMPLETED, or DROPPED", 400);
      }
      studentUpdate.status = st;
    }

    if (body.userStatus !== undefined) {
      const ust = String(body.userStatus).toUpperCase();
      if (!["ACTIVE", "INACTIVE", "SUSPENDED"].includes(ust)) {
        return errorResponse("Invalid user status. Must be ACTIVE, INACTIVE, or SUSPENDED", 400);
      }
      userUpdate.status = ust;
    }

    // 5. Password reset
    if (body.newPassword) {
      const pwd = String(body.newPassword);
      if (pwd.length < 6) {
        return errorResponse("New password must be at least 6 characters", 400);
      }
      userUpdate.password = await hashPassword(pwd);
    }

    // 6. Course & Fees
    if (body.courseId !== undefined) {
      if (body.courseId === null || body.courseId === "" || body.courseId === "0") {
        studentUpdate.courseId = null;
      } else {
        const cid = BigInt(body.courseId);
        const course = await prisma.course.findUnique({ where: { id: cid } });
        if (!course) return errorResponse("Selected course does not exist", 400);
        studentUpdate.courseId = cid;
      }
    }

    if (body.totalFee !== undefined && body.totalFee !== null) {
      const tf = Number(body.totalFee);
      if (!Number.isFinite(tf) || tf < 0) return errorResponse("Total fee cannot be negative", 400);
      const paid = body.paidFee !== undefined && body.paidFee !== null ? Number(body.paidFee) : Number(student.paidFee);
      if (tf < paid) {
        return errorResponse(
          `Total fee cannot be less than paid amount (₹${paid.toLocaleString("en-IN")})`,
          400
        );
      }
      studentUpdate.totalFee = tf;
    }

    if (body.paidFee !== undefined && body.paidFee !== null) {
      const pf = Number(body.paidFee);
      if (!Number.isFinite(pf) || pf < 0) return errorResponse("Paid fee cannot be negative", 400);
      const currentTotal = body.totalFee !== undefined && body.totalFee !== null ? Number(body.totalFee) : Number(student.totalFee);
      if (pf > currentTotal) {
        return errorResponse("Paid fee cannot exceed total fee", 400);
      }
      studentUpdate.paidFee = pf;
    }

    // 7. Address
    if (body.address !== undefined) studentUpdate.address = body.address ? String(body.address).trim() : null;
    if (body.area !== undefined) studentUpdate.area = body.area ? String(body.area).trim() : null;
    if (body.pincode !== undefined) studentUpdate.pincode = body.pincode ? String(body.pincode).trim() : null;
    if (body.city !== undefined) studentUpdate.city = body.city ? String(body.city).trim() : null;
    if (body.state !== undefined) studentUpdate.state = body.state ? String(body.state).trim() : null;

    // 8. Certificate options
    if (body.showFatherOnCertificate !== undefined) {
      studentUpdate.showFatherOnCertificate = Boolean(body.showFatherOnCertificate);
    }
    if (body.showSurnameOnCertificate !== undefined) {
      studentUpdate.showSurnameOnCertificate = Boolean(body.showSurnameOnCertificate);
    }

    // 9. Photos / Signatures
    if (body.removeProfileImage) {
      studentUpdate.profileImageUrl = null;
    } else if (body.profileImageBase64) {
      try {
        studentUpdate.profileImageUrl = await saveStudentImage(
          String(body.profileImageBase64),
          "profile",
          student.studentCode
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Invalid profile image";
        return errorResponse(msg, 400);
      }
    }

    if (body.removeSignature) {
      studentUpdate.signatureUrl = null;
    } else if (body.signatureBase64) {
      try {
        studentUpdate.signatureUrl = await saveStudentImage(
          String(body.signatureBase64),
          "signature",
          student.studentCode
        );
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Invalid signature image";
        return errorResponse(msg, 400);
      }
    }

    if (Object.keys(studentUpdate).length === 0 && Object.keys(userUpdate).length === 0) {
      return errorResponse("No fields to update", 400);
    }

    // Execute in transaction
    const [updatedStudent, updatedUser] = await prisma.$transaction(async (tx) => {
      let uUser = null;
      if (Object.keys(userUpdate).length > 0) {
        uUser = await tx.user.update({
          where: { id: student.userId },
          data: userUpdate,
        });
      }

      let uStudent = null;
      if (Object.keys(studentUpdate).length > 0) {
        uStudent = await tx.student.update({
          where: { id: sid },
          data: studentUpdate,
          include: {
            course: { select: { id: true, name: true } },
            franchise: { select: { id: true, name: true } },
          },
        });
      }

      return [uStudent, uUser];
    });

    return successResponse(
      {
        id,
        studentCode: student.studentCode,
        fullName: updatedUser?.fullName || student.user.fullName,
        email: updatedUser?.email || student.user.email,
        student: updatedStudent,
      },
      "Student updated successfully"
    );
  } catch (err) {
    console.error("Students PATCH error:", err);
    const msg = err instanceof Error ? err.message : "Failed to update student";
    return errorResponse(msg, 500);
  }
}

/** Also support PUT identically to PATCH */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  return PATCH(request, context);
}

/**
 * DELETE /api/students/[id] – Delete student and all associated records cleanly
 */
export async function DELETE(
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
    const sid = BigInt(id);

    const student = await prisma.student.findUnique({
      where: { id: sid },
      include: {
        user: true,
        franchise: { select: { id: true, name: true } },
      },
    });

    if (!student) return errorResponse("Student not found", 404);

    if (roleId === ROLES.SUB_ADMIN && user.franchiseId && BigInt(user.franchiseId) !== student.franchiseId) {
      return errorResponse("Cannot delete student from another franchise", 403);
    }

    const studentCode = student.studentCode;
    const studentName = student.user.fullName;
    const profileImageUrl = student.profileImageUrl;
    const signatureUrl = student.signatureUrl;

    // Clean up all related records in atomic transaction
    await prisma.$transaction(async (tx) => {
      // 1. Exam attempts, answers, proctor events
      const attempts = await tx.examAttempt.findMany({
        where: {
          OR: [{ studentId: sid }, { userId: student.userId }],
        },
        select: { id: true },
      });

      if (attempts.length > 0) {
        const attemptIds = attempts.map((a) => a.id);
        await tx.examAnswer.deleteMany({ where: { attemptId: { in: attemptIds } } });
        await tx.examProctorEvent.deleteMany({ where: { attemptId: { in: attemptIds } } });
        await tx.examAttempt.deleteMany({ where: { id: { in: attemptIds } } });
      }

      // 2. Certificates
      await tx.certificate.deleteMany({ where: { studentId: sid } });

      // 3. Feedback
      await tx.feedback.deleteMany({ where: { studentId: sid } });

      // 4. Payments
      await tx.payment.deleteMany({ where: { studentId: sid } });

      // 5. Attendance
      await tx.attendance.deleteMany({ where: { userId: student.userId } });

      // 6. Chat memberships / typing
      await tx.chatRoomMember.deleteMany({ where: { userId: student.userId } });
      await tx.chatTyping.deleteMany({ where: { userId: student.userId } });
      await tx.chatMessage.deleteMany({ where: { senderId: student.userId } });

      // 7. Delete student record
      await tx.student.delete({ where: { id: sid } });

      // 8. Delete user account
      await tx.user.delete({ where: { id: student.userId } });
    });

    // Optionally cleanup image files on disk (non-blocking)
    const cleanupFile = async (relUrl: string | null) => {
      if (!relUrl || !relUrl.startsWith("/uploads/students/")) return;
      try {
        const localPath = path.join(process.cwd(), "public", relUrl.replace(/^\//, ""));
        await unlink(localPath);
      } catch {
        // Ignore file removal errors
      }
    };
    await Promise.allSettled([cleanupFile(profileImageUrl), cleanupFile(signatureUrl)]);

    return successResponse(
      { id, studentCode, fullName: studentName },
      `Student ${studentName} (${studentCode}) deleted successfully`
    );
  } catch (err) {
    console.error("Student DELETE error:", err);
    const msg = err instanceof Error ? err.message : "Failed to delete student";
    return errorResponse(msg, 500);
  }
}
