import { NextRequest } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";
import {
  SAMPLE_CERTIFICATE_PRESETS,
  type CertificateDemoData,
  type CertificateTypeId,
} from "@/components/certificates/demo/types";
import {
  buildMarksheetSubjects,
  fillCertificateFromStudent,
  percentFromSubjects,
} from "@/lib/student-certificate-fill";
import { ensureCourseSubjectsFromLegacy } from "@/lib/course-subjects";

export const dynamic = "force-dynamic";

const CONFIG_FILE_PATH = path.join(process.cwd(), "data", "certificate-templates-config.json");

async function loadLayouts(): Promise<Record<CertificateTypeId, CertificateDemoData>> {
  try {
    const raw = await fs.readFile(CONFIG_FILE_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return { ...SAMPLE_CERTIFICATE_PRESETS, ...parsed };
    }
  } catch {
    // fall through
  }
  return SAMPLE_CERTIFICATE_PRESETS;
}

/**
 * GET /api/students/[id]/certificates
 * Official Certificate + Marksheet filled with this student's live data
 * (subjects, marks, ATC, photo, enrollment) — layout from saved template.
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
        user: { select: { fullName: true } },
        franchise: {
          select: {
            id: true,
            name: true,
            slug: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
          },
        },
        course: {
          select: {
            id: true,
            name: true,
            slug: true,
            durationMonths: true,
            durationValue: true,
            durationUnit: true,
            certificateSubject: true,
          },
        },
        certificates: {
          where: { status: "ISSUED" },
          orderBy: { issueDate: "desc" },
          take: 1,
          select: { certificateNumber: true },
        },
        examAttempts: {
          where: { status: { in: ["SUBMITTED", "AUTO_SUBMITTED"] } },
          orderBy: { submittedAt: "desc" },
          take: 1,
          select: { percent: true, enrollmentNumber: true },
        },
      },
    });

    if (!student) return errorResponse("Student not found", 404);

    if (roleId === ROLES.SUB_ADMIN && user.franchiseId && BigInt(user.franchiseId) !== student.franchiseId) {
      return errorResponse("Cannot view student from another franchise", 403);
    }

    // —— Dynamic subjects + marks from course syllabus + StudentSubjectMark ——
    let subjects = null as ReturnType<typeof buildMarksheetSubjects> | null;
    let marksPercent: number | null = null;

    if (student.courseId) {
      await ensureCourseSubjectsFromLegacy(student.courseId);

      const [courseSubjects, subjectMarks] = await Promise.all([
        prisma.courseSubject.findMany({
          where: { courseId: student.courseId },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          select: { name: true, maxMarks: true, sortOrder: true },
        }),
        prisma.studentSubjectMark.findMany({
          where: { studentId: student.id, courseId: student.courseId },
          select: { subjectName: true, maxMarks: true, obtainedMarks: true },
        }),
      ]);

      subjects = buildMarksheetSubjects({
        courseSubjects,
        marks: subjectMarks,
      });

      if (subjects.length === 0) {
        subjects = null;
      } else {
        marksPercent = percentFromSubjects(subjects);
      }
    }

    // Fallback % from exam / attendance only if no subject marks yet
    if (marksPercent == null) {
      const attempt = student.examAttempts[0];
      if (attempt?.percent != null) {
        marksPercent = Number(attempt.percent);
      } else {
        const attendance = await prisma.attendance.findMany({
          where: { userId: student.userId, franchiseId: student.franchiseId },
          select: { status: true },
        });
        if (attendance.length > 0) {
          const present = attendance.filter(
            (r) => r.status === "PRESENT" || r.status === "LATE"
          ).length;
          marksPercent = Math.round((present / attendance.length) * 100);
        }
      }
    }

    const attempt = student.examAttempts[0];
    const courseSlug = student.course?.slug?.trim() || "";
    const courseCode = courseSlug
      ? courseSlug.replace(/-/g, "/").toUpperCase()
      : student.course?.name
        ? student.course.name
            .split(/\s+/)
            .map((w) => w[0])
            .join("")
            .toUpperCase()
            .slice(0, 8)
        : null;

    const franchiseSlug = student.franchise.slug?.trim() || "";
    const atcCodeFromFranchise = franchiseSlug
      ? `IVESDC/ATC/${franchiseSlug.replace(/-/g, "/").toUpperCase()}`
      : `IVESDC/ATC/${String(student.franchise.id).padStart(5, "0")}`;

    const source = {
      id: student.id.toString(),
      studentCode: student.studentCode,
      fullName: student.user.fullName,
      firstName: student.firstName,
      surname: student.surname,
      showFatherOnCertificate: student.showFatherOnCertificate,
      showSurnameOnCertificate: student.showSurnameOnCertificate,
      fatherHusbandName: student.fatherHusbandName,
      motherName: student.motherName,
      gender: student.gender,
      profileImageUrl: student.profileImageUrl,
      signatureUrl: student.signatureUrl,
      city: student.city,
      state: student.state,
      address: student.address,
      area: student.area,
      pincode: student.pincode,
      admissionDate: student.admissionDate.toISOString(),
      status: student.status,
      franchiseName: student.franchise.name,
      franchiseSlug: student.franchise.slug,
      franchiseAddress: student.franchise.address,
      franchiseCity: student.franchise.city,
      franchiseState: student.franchise.state,
      franchisePincode: student.franchise.pincode,
      franchiseId: student.franchise.id.toString(),
      courseName: student.course?.name ?? null,
      courseCode,
      durationMonths: student.course?.durationMonths ?? student.course?.durationValue ?? null,
      durationValue: student.course?.durationValue ?? student.course?.durationMonths ?? null,
      durationUnit: student.course?.durationUnit ?? "Months",
      certificateNumber: student.certificates[0]?.certificateNumber ?? null,
      enrollmentNumber:
        student.studentCode || attempt?.enrollmentNumber || student.id.toString(),
      marksPercent,
      subjects,
    };

    const layouts = await loadLayouts();
    const vocational = fillCertificateFromStudent(layouts.vocational, source, "vocational");
    const marksheet = fillCertificateFromStudent(
      layouts.marksheet2 || layouts.marksheet,
      source,
      "marksheet2"
    );

    // Prefer structured ATC code
    if (atcCodeFromFranchise) {
      vocational.atcCode = atcCodeFromFranchise;
      marksheet.atcCode = atcCodeFromFranchise;
    }

    return successResponse(
      {
        studentName: source.fullName,
        studentCode: source.studentCode,
        vocational,
        marksheet,
      },
      "Student certificates"
    );
  } catch (err) {
    console.error("GET student certificates", err);
    return errorResponse("Failed to load student certificates", 500);
  }
}
