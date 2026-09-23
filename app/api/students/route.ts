import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";
import { hashPassword } from "@/lib/auth";
import { validateName, validateEmail, validatePhone } from "@/lib/validation";
import { sendStudentWelcomeEmail } from "@/lib/email";
import { generateStudentCode } from "@/lib/student-code";
import { saveStudentImage } from "@/lib/student-images";

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
      where.OR = [
        { studentCode: { contains: search } },
        {
          user: {
            OR: [
              { fullName: { contains: search } },
              { email: { contains: search } },
              { phone: { contains: search } },
            ],
          },
        },
      ];
    }

    const [students, total, statusGroups] = await Promise.all([
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
      prisma.student.groupBy({
        by: ["status"],
        where: getFranchiseFilter(user),
        _count: { _all: true },
      }),
    ]);

    const counts: Record<string, number> = { ACTIVE: 0, COMPLETED: 0, DROPPED: 0 };
    let allTotal = 0;
    for (const g of statusGroups) {
      counts[g.status] = g._count._all;
      allTotal += g._count._all;
    }

    const items = students.map((s) => ({
      id: s.id.toString(),
      studentCode: s.studentCode,
      fullName: s.user.fullName,
      email: s.user.email,
      phone: s.user.phone,
      profileImageUrl: s.profileImageUrl || null,
      franchiseId: s.franchise.id.toString(),
      franchiseName: s.franchise.name,
      courseId: s.course?.id.toString() ?? null,
      courseName: s.course?.name ?? null,
      courseAssigned: !!s.courseId,
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
      {
        items,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        counts: { ...counts, total: allTotal },
      },
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
      firstName,
      surname,
      relationship,
      fatherHusbandName,
      motherName,
      email,
      phone,
      alternateMobile,
      dateOfBirth,
      gender,
      password,
      confirmPassword,
      franchiseId,
      admissionDate,
      address,
      area,
      pincode,
      city,
      state,
      profileImageBase64,
      signatureBase64,
      showFatherOnCertificate,
      showSurnameOnCertificate,
    } = body;

    const first = String(firstName || "").trim();
    const last = String(surname || "").trim();
    const fullName = [first, last].filter(Boolean).join(" ").trim();
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const rawPhone = phone != null ? String(phone).trim() : "";
    const normalizedPhone = rawPhone
      ? rawPhone.replace(/\D/g, "").replace(/^91/, "").slice(-10)
      : "";

    if (!first || !normalizedEmail || !franchiseId) {
      return errorResponse("Missing required fields: firstName, email, franchiseId", 400);
    }
    if (password && confirmPassword && password !== confirmPassword) {
      return errorResponse("Password and confirm password do not match", 400);
    }
    const nameR = validateName(first);
    const emailR = validateEmail(normalizedEmail);
    const phoneR = normalizedPhone ? validatePhone(normalizedPhone) : { valid: true };
    if (!nameR.valid) return errorResponse(nameR.error!, 400, "firstName");
    if (!emailR.valid) return errorResponse(emailR.error!, 400, "email");
    if (!phoneR.valid) return errorResponse(phoneR.error!, 400, "phone");

    const fid = BigInt(franchiseId);

    if (roleId === ROLES.SUB_ADMIN && user.franchiseId && BigInt(user.franchiseId) !== fid) {
      return errorResponse("Cannot add student to another franchise", 403);
    }

    // ——— Email check (separate from mobile) ———
    const existingEmail = await prisma.user.findFirst({
      where: { email: normalizedEmail },
      select: {
        id: true,
        roleId: true,
        phone: true,
        student: { select: { id: true } },
      },
    });
    if (existingEmail?.student) {
      return errorResponse(
        "This email is already registered. Please use a different email.",
        400,
        "email"
      );
    }
    if (existingEmail && existingEmail.roleId !== ROLES.STUDENT) {
      return errorResponse(
        "This email is already registered. Please use a different email.",
        400,
        "email"
      );
    }

    // ——— Mobile check (separate from email) ———
    // users.phone is UNIQUE. Same parent number for siblings is common — if taken,
    // keep login phone null and save number on student.alternateMobile (no fake email error).
    let phoneVal: string | null = null;
    let phoneSharedAsAlternate: string | null = null;
    if (normalizedPhone) {
      const existingPhone = await prisma.user.findFirst({
        where: { phone: normalizedPhone },
        select: { id: true, email: true },
      });
      if (existingPhone) {
        phoneVal = null;
        phoneSharedAsAlternate = normalizedPhone;
      } else {
        phoneVal = normalizedPhone;
      }
    }

    const altFromForm = alternateMobile?.trim() || null;
    const alternateMobileVal = altFromForm || phoneSharedAsAlternate;

    const hashedPassword = await hashPassword(password || "Student@123");
    const admission = admissionDate ? new Date(admissionDate) : new Date();

    let profileImageUrl: string | null = null;
    let signatureUrl: string | null = null;
    // Generate code first for image paths; recreate inside txn if needed
    let studentCode = await generateStudentCode();
    try {
      if (profileImageBase64) {
        profileImageUrl = await saveStudentImage(
          String(profileImageBase64),
          "profile",
          studentCode
        );
      }
      if (signatureBase64) {
        signatureUrl = await saveStudentImage(
          String(signatureBase64),
          "signature",
          studentCode
        );
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid image";
      return errorResponse(msg, 400);
    }

    const genderVal = ["MALE", "FEMALE", "OTHER"].includes(String(gender || "").toUpperCase())
      ? String(gender).toUpperCase()
      : null;
    const relationVal = ["FATHER", "HUSBAND", "GUARDIAN", "OTHER"].includes(
      String(relationship || "").toUpperCase()
    )
      ? String(relationship).toUpperCase()
      : null;

    // Atomic create — avoids orphan users (email stuck in users without student row)
    let newUserId: bigint;
    let newStudentId: bigint;
    try {
      const created = await prisma.$transaction(async (tx) => {
        let userId: bigint;

        if (existingEmail && !existingEmail.student && existingEmail.roleId === ROLES.STUDENT) {
          // Reuse orphan student login row from a previous failed create
          await tx.user.update({
            where: { id: existingEmail.id },
            data: {
              franchiseId: fid,
              fullName,
              phone: phoneVal ?? existingEmail.phone,
              password: hashedPassword,
              status: "ACTIVE",
            },
          });
          userId = existingEmail.id;
        } else {
          const createdUser = await tx.user.create({
            data: {
              roleId: ROLES.STUDENT,
              franchiseId: fid,
              fullName,
              email: normalizedEmail,
              phone: phoneVal,
              password: hashedPassword,
            },
          });
          userId = createdUser.id;
        }

        let code = studentCode;
        let studentRow;
        try {
          studentRow = await tx.student.create({
            data: {
              studentCode: code,
              userId,
              franchiseId: fid,
              courseId: null,
              totalFee: 0,
              paidFee: 0,
              admissionDate: admission,
              firstName: first,
              surname: last || null,
              relationship: relationVal,
              fatherHusbandName: fatherHusbandName?.trim() || null,
              motherName: motherName?.trim() || null,
              alternateMobile: alternateMobileVal,
              dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
              gender: genderVal,
              profileImageUrl,
              signatureUrl,
              showFatherOnCertificate: showFatherOnCertificate !== false,
              showSurnameOnCertificate: showSurnameOnCertificate !== false,
              address: address?.trim() || null,
              area: area?.trim() || null,
              pincode: pincode?.trim() || null,
              city: city?.trim() || null,
              state: state?.trim() || null,
            },
          });
        } catch (inner: unknown) {
          // Rare student_code race — retry once with a fresh code
          const isDup =
            (inner instanceof Prisma.PrismaClientKnownRequestError && inner.code === "P2002") ||
            (inner instanceof Error && /Duplicate|Unique/i.test(inner.message));
          if (!isDup) throw inner;
          code = await generateStudentCode();
          studentCode = code;
          studentRow = await tx.student.create({
            data: {
              studentCode: code,
              userId,
              franchiseId: fid,
              courseId: null,
              totalFee: 0,
              paidFee: 0,
              admissionDate: admission,
              firstName: first,
              surname: last || null,
              relationship: relationVal,
              fatherHusbandName: fatherHusbandName?.trim() || null,
              motherName: motherName?.trim() || null,
              alternateMobile: alternateMobileVal,
              dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
              gender: genderVal,
              profileImageUrl,
              signatureUrl,
              showFatherOnCertificate: showFatherOnCertificate !== false,
              showSurnameOnCertificate: showSurnameOnCertificate !== false,
              address: address?.trim() || null,
              area: area?.trim() || null,
              pincode: pincode?.trim() || null,
              city: city?.trim() || null,
              state: state?.trim() || null,
            },
          });
        }

        return { userId, studentId: studentRow.id, studentCode: code };
      });

      newUserId = created.userId;
      newStudentId = created.studentId;
      studentCode = created.studentCode;
    } catch (txnErr: unknown) {
      // Surface unique conflicts clearly (should be rare after phone-share handling)
      if (txnErr instanceof Prisma.PrismaClientKnownRequestError && txnErr.code === "P2002") {
        const target = txnErr.meta?.target;
        const fields = Array.isArray(target)
          ? target.map(String)
          : typeof target === "string"
            ? [target]
            : [];
        const joined = fields.join(" ").toLowerCase();
        if (joined.includes("email")) {
          return errorResponse(
            "This email is already registered. Please use a different email.",
            400,
            "email"
          );
        }
        if (joined.includes("phone")) {
          return errorResponse(
            "This mobile number is already registered. Please use a different mobile number.",
            400,
            "phone"
          );
        }
        if (joined.includes("student_code") || joined.includes("studentcode")) {
          return errorResponse("Could not generate unique student ID. Please try again.", 400);
        }
      }
      throw txnErr;
    }

    void newUserId;

    const franchise = await prisma.franchise.findUnique({
      where: { id: fid },
      select: { name: true },
    });

    const loginUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL}`}/login`
        : "/login";

    const emailResult = await sendStudentWelcomeEmail(normalizedEmail, {
      fullName,
      email: normalizedEmail,
      password: password || "Student@123",
      loginUrl,
      courseName: "Not assigned yet",
      franchiseName: franchise?.name ?? "Franchise",
      totalFee: 0,
      paidFee: 0,
      pendingFee: 0,
      admissionDate: admission.toISOString().split("T")[0],
      studentCode,
      phone: phoneVal || alternateMobileVal,
      address: address?.trim() || null,
      area: area?.trim() || null,
      pincode: pincode?.trim() || null,
      city: city?.trim() || null,
      state: state?.trim() || null,
    });

    if (!emailResult.success) {
      console.warn("Student welcome email failed:", emailResult.error);
    }

    return successResponse(
      {
        id: newStudentId.toString(),
        studentCode,
        emailSent: emailResult.success,
        needsCourse: true,
        phoneShared: !!phoneSharedAsAlternate,
      },
      phoneSharedAsAlternate
        ? "Student added — this phone was already used by another account, so it was saved as alternate mobile. Assign a course next."
        : "Student added — assign a course next"
    );
  } catch (err: unknown) {
    console.error("Students POST:", err);
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("Unknown column") || msg.includes("address") || msg.includes("area") || msg.includes("pincode")) {
      return errorResponse("Database schema outdated. Please run the student address migration (scripts/run-all-migrations.sql block 5).", 500);
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = err.meta?.target;
      const fields = Array.isArray(target)
        ? target.map(String)
        : typeof target === "string"
          ? [target]
          : [];
      const joined = fields.join(" ").toLowerCase();
      if (joined.includes("email")) {
        return errorResponse(
          "This email is already registered. Please use a different email.",
          400,
          "email"
        );
      }
      if (joined.includes("phone")) {
        return errorResponse(
          "This mobile number is already registered. Please use a different mobile number.",
          400,
          "phone"
        );
      }
      if (joined.includes("student_code") || joined.includes("studentcode")) {
        return errorResponse("Could not generate unique student ID. Please try again.", 400);
      }
      return errorResponse("Duplicate data found. Check email and mobile separately.", 400);
    }

    if (msg.includes("Duplicate entry") || msg.includes("Unique constraint")) {
      const lower = msg.toLowerCase();
      if (lower.includes("phone")) {
        return errorResponse(
          "This mobile number is already registered. Please use a different mobile number.",
          400,
          "phone"
        );
      }
      if (lower.includes("student_code") || lower.includes("studentcode")) {
        return errorResponse("Could not generate unique student ID. Please try again.", 400);
      }
      if (lower.includes("email")) {
        return errorResponse(
          "This email is already registered. Please use a different email.",
          400,
          "email"
        );
      }
      return errorResponse("Duplicate data found. Check email and mobile separately.", 400);
    }
    return errorResponse(msg || "Failed to add student", 500);
  }
}
