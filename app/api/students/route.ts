import { NextRequest } from "next/server";
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

    if (!first || !email || !franchiseId) {
      return errorResponse("Missing required fields: firstName, email, franchiseId", 400);
    }
    if (password && confirmPassword && password !== confirmPassword) {
      return errorResponse("Password and confirm password do not match", 400);
    }
    const nameR = validateName(first);
    const emailR = validateEmail(String(email).trim());
    const phoneR = phone ? validatePhone(String(phone).trim()) : { valid: true };
    if (!nameR.valid) return errorResponse(nameR.error!, 400);
    if (!emailR.valid) return errorResponse(emailR.error!, 400);
    if (!phoneR.valid) return errorResponse(phoneR.error!, 400);

    const fid = BigInt(franchiseId);

    if (roleId === ROLES.SUB_ADMIN && user.franchiseId && BigInt(user.franchiseId) !== fid) {
      return errorResponse("Cannot add student to another franchise", 403);
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return errorResponse("Email already registered", 400);

    const hashedPassword = await hashPassword(password || "Student@123");
    const admission = admissionDate ? new Date(admissionDate) : new Date();
    const studentCode = await generateStudentCode();

    let profileImageUrl: string | null = null;
    let signatureUrl: string | null = null;
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
        studentCode,
        userId: newUser.id,
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
        alternateMobile: alternateMobile?.trim() || null,
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

    const franchise = await prisma.franchise.findUnique({
      where: { id: fid },
      select: { name: true },
    });

    const loginUrl =
      process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
        ? `${process.env.NEXT_PUBLIC_APP_URL || `https://${process.env.VERCEL_URL}`}/login`
        : "/login";

    const emailResult = await sendStudentWelcomeEmail(email, {
      fullName,
      email,
      password: password || "Student@123",
      loginUrl,
      courseName: "Not assigned yet",
      franchiseName: franchise?.name ?? "Franchise",
      totalFee: 0,
      paidFee: 0,
      pendingFee: 0,
      admissionDate: admission.toISOString().split("T")[0],
      studentCode,
      phone: phone || null,
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
        id: newStudent.id.toString(),
        studentCode,
        emailSent: emailResult.success,
        needsCourse: true,
      },
      "Student added — assign a course next"
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
