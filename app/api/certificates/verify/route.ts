import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import {
  buildStudentOfficialDocuments,
  findStudentForOfficialDocuments,
  loadOfficialLayouts,
} from "@/lib/student-official-documents";
import { findStudentIdByMarksheetNo } from "@/lib/marksheet-numbers";

export const dynamic = "force-dynamic";

/** ms = Statement of Marks, cert = Certificate of Completion, student = barcode / enrollment-only scan */
type DocType = "ms" | "cert" | "student";

const studentSelect = {
  id: true,
  studentCode: true,
  firstName: true,
  surname: true,
  fatherHusbandName: true,
  status: true,
  course: { select: { name: true } },
  franchise: { select: { name: true, slug: true } },
} as const;

type StudentRow = {
  id: bigint;
  studentCode: string;
  firstName: string | null;
  surname: string | null;
  fatherHusbandName: string | null;
  status: string;
  course: { name: string } | null;
  franchise: { name: string; slug: string | null } | null;
};

function normalizeEnr(raw: string): string {
  return String(raw || "").replace(/\D/g, "");
}

function normalizeId(raw: string): string {
  return String(raw || "").trim().toUpperCase();
}

function studentFullName(student: { firstName: string | null; surname: string | null }): string {
  return [student.firstName, student.surname].filter(Boolean).join(" ").trim();
}

function sameEnrollment(studentCode: string, raw: string, digits: string): boolean {
  const code = studentCode.trim();
  if (!raw && !digits) return true;
  if (raw && code.toUpperCase() === raw.toUpperCase()) return true;
  if (digits && normalizeEnr(code) === digits) return true;
  return false;
}

/** Exact student code, or the same code with punctuation removed. Never a partial match. */
async function findStudent(raw: string, digits: string): Promise<StudentRow | null> {
  if (raw) {
    const exact = await prisma.student.findFirst({ where: { studentCode: raw }, select: studentSelect });
    if (exact) return exact;
  }
  if (digits.length < 4) return null;
  const candidates = await prisma.student.findMany({
    where: { studentCode: { contains: digits.slice(-6) } },
    select: studentSelect,
    take: 25,
  });
  return candidates.find((s) => sameEnrollment(s.studentCode, raw, digits)) ?? null;
}

/**
 * Number printed by the website for a student without an issued certificate record:
 * IVESDC/CERT|MS/<year>/<last 6 of enrollment>.
 */
function isGeneratedNumberFor(id: string, studentCode: string): boolean {
  const m = /^IVESDC\/(CERT|MS)\/\d{4}\/(.{6})$/.exec(id);
  if (!m) return false;
  return m[2] === studentCode.trim().slice(-6).padStart(6, "0").toUpperCase();
}

function typeFromNumber(id: string, fallback: DocType): DocType {
  if (/\/CERT\//.test(id)) return "cert";
  if (/\/MS\//.test(id)) return "ms";
  return fallback;
}

/** Public, verification-safe details: identity, course, centre and result — no contact data. */
async function studentDetails(studentId: bigint) {
  const student = await findStudentForOfficialDocuments(studentId);
  if (!student) return null;
  const docs = await buildStudentOfficialDocuments(student, await loadOfficialLayouts(), {
    assignMarksheetNo: false,
  });
  const ms = docs.marksheet;
  const hasPhoto = Boolean(student.profileImageUrl && student.profileImageUrl.trim());
  const subjects = (ms.subjects ?? [])
    .filter((s) => s && s.name)
    .map((s) => ({ code: s.code, name: s.name, max: s.totalMax, obtained: s.totalObtained }));
  const hasMarks = subjects.some((s) => Number(s.obtained) > 0);

  return {
    studentName: ms.studentName || docs.studentName,
    fatherName: ms.fatherName || null,
    motherName: ms.motherName || null,
    photoUrl: hasPhoto ? student.profileImageUrl : null,
    enrollmentNo: student.studentCode,
    studentStatus: student.status,
    courseName: student.course?.name || null,
    courseCode: ms.courseCode || null,
    duration: ms.duration || null,
    session: ms.session || null,
    trainingStart: ms.trainingStart || null,
    trainingEnd: ms.trainingEnd || null,
    centreName: student.franchise.name,
    centreCode: ms.atcCode || null,
    centreLocation: [student.franchise.city, student.franchise.state].filter(Boolean).join(", ") || null,
    result: hasMarks
      ? {
          percent: Number(ms.marksPercent) || 0,
          grade: ms.grade || null,
          gradeLabel: ms.gradeLabel || null,
          division: ms.division || null,
          status: ms.status || null,
        }
      : null,
    subjects: hasMarks ? subjects : [],
  };
}

/**
 * Public certificate / marksheet verification.
 * Query: type=ms|cert|student, enr=<student code>, id=<document number>
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const typeRaw = (searchParams.get("type") || "ms").toLowerCase();
    let type: DocType = typeRaw === "cert" ? "cert" : typeRaw === "student" ? "student" : "ms";
    const enrRaw = (searchParams.get("enr") || "").trim();
    const enrDigits = normalizeEnr(enrRaw);
    const id = normalizeId(searchParams.get("id") || "");
    const query = { type, enr: enrRaw || enrDigits || null, id: id || null };

    if (!enrRaw && !id) {
      return errorResponse("Provide enrollment number (enr) and/or certificate number (id).", 400);
    }
    if (id) type = typeFromNumber(id, type);

    const scannedStudent = enrRaw || enrDigits ? await findStudent(enrRaw, enrDigits) : null;
    const certificate = id
      ? await prisma.certificate.findFirst({
          where: { certificateNumber: id },
          include: { student: { select: studentSelect } },
          orderBy: { createdAt: "desc" },
        })
      : null;

    // 1) Number belongs to an issued certificate record
    if (certificate) {
      const owner = certificate.student;
      if (enrRaw && !sameEnrollment(owner.studentCode, enrRaw, enrDigits)) {
        return successResponse({
          verified: false,
          reason: "MISMATCH",
          message: "The enrollment on this scan does not belong to that document number.",
          query,
          document: scannedStudent ? { type, ...(await studentDetails(scannedStudent.id)) } : undefined,
        });
      }
      const status = String(certificate.status || "").toUpperCase();
      const document = {
        type,
        ...(await studentDetails(owner.id)),
        certificateNumber: certificate.certificateNumber,
        status: certificate.status,
        issueDate: certificate.issueDate ? certificate.issueDate.toISOString() : null,
      };
      if (status !== "ISSUED" && status !== "APPROVED") {
        return successResponse({
          verified: false,
          reason: "NOT_ISSUED",
          message: `Student found. This document is not issued yet (status: ${status || "UNKNOWN"}).`,
          query,
          document,
        });
      }
      return successResponse({
        verified: true,
        reason: "OK",
        message: "This document is authentic and belongs to the student below.",
        query,
        document,
      });
    }

    // 2) Sequential marksheet number (00001…) from the marksheet register
    const marksheetOwnerId = id ? await findStudentIdByMarksheetNo(id) : null;
    let student = scannedStudent;
    if (marksheetOwnerId) {
      type = "ms";
      if ((enrRaw || enrDigits) && scannedStudent?.id.toString() !== marksheetOwnerId) {
        return successResponse({
          verified: false,
          reason: "MISMATCH",
          message: "The enrollment on this scan does not belong to that marksheet number.",
          query,
          document: scannedStudent ? { type, ...(await studentDetails(scannedStudent.id)) } : undefined,
        });
      }
      student ??= await prisma.student.findUnique({
        where: { id: BigInt(marksheetOwnerId) },
        select: studentSelect,
      });
    }

    if (!student) {
      return successResponse({
        verified: false,
        reason: "NOT_FOUND",
        message: "No matching student, certificate, or marksheet was found in the IVESDC registry.",
        query,
      });
    }

    // 3) Student found by enrollment (QR from a website-printed document, or barcode scan)
    const details = await studentDetails(student.id);
    const latestIssued = await prisma.certificate.findFirst({
      where: { studentId: student.id, status: { in: ["ISSUED", "APPROVED"] } },
      orderBy: { createdAt: "desc" },
      select: { certificateNumber: true, issueDate: true },
    });
    const document = {
      type,
      ...details,
      certificateNumber: id || latestIssued?.certificateNumber || null,
      issueDate: latestIssued?.issueDate ? latestIssued.issueDate.toISOString() : null,
    };

    if (id && !marksheetOwnerId && !isGeneratedNumberFor(id, student.studentCode)) {
      return successResponse({
        verified: false,
        reason: "NUMBER_UNKNOWN",
        message: "This student is registered, but the document number on this scan is not in the registry.",
        query,
        document,
      });
    }

    if (student.status === "DROPPED") {
      return successResponse({
        verified: false,
        reason: "STUDENT_DROPPED",
        message: "This enrollment is registered but the student has discontinued the course.",
        query,
        document,
      });
    }

    return successResponse({
      verified: true,
      reason: type === "student" ? "STUDENT_RECORD" : "OK",
      message:
        type === "student"
          ? "This enrollment is a registered IVESDC student."
          : "This document is authentic and belongs to the student below.",
      query,
      document,
    });
  } catch (error) {
    console.error("Certificate verify error:", error);
    return errorResponse("Verification service temporarily unavailable", 503);
  }
}
