import path from "path";
import { promises as fs } from "fs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  SAMPLE_CERTIFICATE_PRESETS,
  type CertificateDemoData,
  type CertificateTypeId,
} from "@/components/certificates/demo/types";
import {
  buildMarksheetSubjects,
  fillCertificateFromStudent,
  percentFromSubjects,
  type StudentCertificateSource,
} from "@/lib/student-certificate-fill";
import { ensureCourseSubjectsFromLegacy } from "@/lib/course-subjects";
import { getFranchiseSignatures } from "@/lib/franchise-document-signatures";

const CONFIG_FILE_PATH = path.join(process.cwd(), "data", "certificate-templates-config.json");

export type OfficialLayouts = Record<CertificateTypeId, CertificateDemoData>;

export type StudentOfficialDocuments = {
  studentId: string;
  studentName: string;
  studentCode: string;
  franchiseName: string;
  courseName: string | null;
  /** Certificate of Completion */
  vocational: CertificateDemoData;
  /** Statement of Marks (Result) - 3 */
  marksheet: CertificateDemoData;
};

export async function loadOfficialLayouts(): Promise<OfficialLayouts> {
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

const studentInclude = Prisma.validator<Prisma.StudentInclude>()({
  user: { select: { fullName: true } },
  franchise: {
    select: { id: true, name: true, slug: true, address: true, city: true, state: true, pincode: true },
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
});

type StudentWithRelations = Prisma.StudentGetPayload<{ include: typeof studentInclude }>;

export async function findStudentsForOfficialDocuments(where: Prisma.StudentWhereInput, take: number) {
  return prisma.student.findMany({
    where,
    take,
    orderBy: [{ franchiseId: "asc" }, { studentCode: "asc" }],
    include: studentInclude,
  });
}

export async function findStudentForOfficialDocuments(id: bigint) {
  return prisma.student.findUnique({ where: { id }, include: studentInclude });
}

async function buildSource(student: StudentWithRelations): Promise<StudentCertificateSource> {
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

    subjects = buildMarksheetSubjects({ courseSubjects, marks: subjectMarks });
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
        const present = attendance.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
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

  return {
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
    enrollmentNumber: student.studentCode || attempt?.enrollmentNumber || student.id.toString(),
    marksPercent,
    subjects,
  };
}

/** Certificate of Completion + Statement of Marks (Result) - 3, filled with this student's live data. */
export async function buildStudentOfficialDocuments(
  student: StudentWithRelations,
  layouts: OfficialLayouts
): Promise<StudentOfficialDocuments> {
  const source = await buildSource(student);

  const vocational = fillCertificateFromStudent(layouts.vocational, source, "vocational");
  const marksheet = fillCertificateFromStudent(
    layouts.marksheet3 || SAMPLE_CERTIFICATE_PRESETS.marksheet3,
    source,
    "marksheet3"
  );

  const franchiseSlug = student.franchise.slug?.trim() || "";
  const atcCode = franchiseSlug
    ? `IVESDC/ATC/${franchiseSlug.replace(/-/g, "/").toUpperCase()}`
    : `IVESDC/ATC/${String(student.franchise.id).padStart(5, "0")}`;
  vocational.atcCode = atcCode;
  marksheet.atcCode = atcCode;

  const signs = await getFranchiseSignatures(student.franchise.id);
  for (const doc of [vocational, marksheet]) {
    doc.atcStampUrl = signs.atcStampUrl || "";
    doc.atcSignatureUrl = signs.atcSignatureUrl || "";
    doc.atcSignatoryName = signs.atcSignatoryName || "";
    doc.examCoordinatorSignatureUrl = signs.coordinatorSignatureUrl || "";
    doc.examCoordinatorName = signs.coordinatorName || "";
  }

  return {
    studentId: source.id,
    studentName: source.fullName,
    studentCode: source.studentCode,
    franchiseName: source.franchiseName,
    courseName: source.courseName ?? null,
    vocational,
    marksheet,
  };
}
