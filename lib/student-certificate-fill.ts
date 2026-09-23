import type { CertificateDemoData, MarksheetSubject } from "@/components/certificates/demo/types";
import { sanitizeFranchiseSlug } from "@/lib/franchise-path";

function gradeFromPercent(percent: number) {
  if (percent >= 85) return { grade: "A+", label: "Excellent", marks: percent };
  if (percent >= 70) return { grade: "A", label: "Very Good", marks: percent };
  if (percent >= 55) return { grade: "B", label: "Good", marks: percent };
  if (percent >= 40) return { grade: "C", label: "Average", marks: percent };
  return { grade: "—", label: "—", marks: percent };
}

const DIGIT_WORDS = ["ZERO", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"];

export function digitsToWords(value: string): string {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits
    .split("")
    .map((d) => DIGIT_WORDS[Number(d)] || "")
    .filter(Boolean)
    .join("  ");
}

export function formatCertDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function courseEndDate(start: Date, student: StudentCertificateSource): Date {
  const unit = (student.durationUnit || "Months").toLowerCase();
  const value = Number(student.durationValue ?? student.durationMonths) || 0;
  if (value <= 0) return start;
  const next = new Date(start);
  if (unit.startsWith("day")) next.setDate(next.getDate() + value);
  else if (unit.startsWith("year")) next.setFullYear(next.getFullYear() + value);
  else next.setMonth(next.getMonth() + value);
  return next;
}

function scaleSubjectsByPercent(
  rows: MarksheetSubject[] | undefined,
  percent: number | null
): MarksheetSubject[] | undefined {
  if (!rows?.length) return rows;
  if (percent == null || !Number.isFinite(percent)) {
    return rows.map((row) => ({
      ...row,
      marksTheory: 0,
      marksPractical: 0,
      totalObtained: 0,
      grade: "—",
    }));
  }
  const p = Math.max(0, Math.min(100, percent)) / 100;
  const pctLabel = `${Math.round(p * 100)}%`;
  return rows.map((row) => {
    const maxTheory = Number(row.maxTheory) || 0;
    const maxPractical = Number(row.maxPractical) || 0;
    const totalMax = Number(row.totalMax) || maxTheory + maxPractical;
    const marksTheory = Math.round(maxTheory * p);
    const marksPractical = Math.round(maxPractical * p);
    const totalObtained = Math.round(totalMax * p);
    return {
      ...row,
      marksTheory,
      marksPractical,
      totalObtained,
      grade: pctLabel,
    };
  });
}

/** Build marksheet rows from CourseSubject + StudentSubjectMark (fully dynamic). */
export function buildMarksheetSubjects(input: {
  courseSubjects: { name: string; maxMarks: number; sortOrder?: number }[];
  marks: { subjectName: string; maxMarks: number; obtainedMarks: number }[];
}): MarksheetSubject[] {
  const marksMap = new Map(
    input.marks.map((m) => [m.subjectName.trim().toLowerCase(), m])
  );

  const fromCourse = [...input.courseSubjects]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name))
    .map((s, i) => {
      const hit = marksMap.get(s.name.trim().toLowerCase());
      const totalMax = hit?.maxMarks ?? s.maxMarks ?? 100;
      const totalObtained = hit?.obtainedMarks ?? 0;
      const pct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
      return {
        code: `SUB-${String(i + 1).padStart(2, "0")}`,
        name: s.name,
        maxTheory: totalMax,
        marksTheory: totalObtained,
        maxPractical: 0,
        marksPractical: 0,
        totalMax,
        totalObtained,
        grade: totalObtained > 0 || hit ? `${pct}%` : "",
      } satisfies MarksheetSubject;
    });

  if (fromCourse.length > 0) return fromCourse;

  // Fallback: marks rows without course subject catalog
  return input.marks.map((m, i) => {
    const totalMax = m.maxMarks || 100;
    const totalObtained = m.obtainedMarks || 0;
    const pct = totalMax > 0 ? Math.round((totalObtained / totalMax) * 100) : 0;
    return {
      code: `SUB-${String(i + 1).padStart(2, "0")}`,
      name: m.subjectName,
      maxTheory: totalMax,
      marksTheory: totalObtained,
      maxPractical: 0,
      marksPractical: 0,
      totalMax,
      totalObtained,
      grade: totalObtained > 0 ? `${pct}%` : "",
    } satisfies MarksheetSubject;
  });
}

export function percentFromSubjects(subjects: MarksheetSubject[] | null | undefined): number | null {
  if (!subjects?.length) return null;
  const totalMax = subjects.reduce((a, r) => a + (Number(r.totalMax) || 0), 0);
  const totalGot = subjects.reduce((a, r) => a + (Number(r.totalObtained) || 0), 0);
  if (totalMax <= 0) return null;
  if (totalGot <= 0) return 0;
  return Math.round((totalGot / totalMax) * 10000) / 100;
}

export type StudentCertificateSource = {
  id: string;
  studentCode: string;
  fullName: string;
  firstName?: string | null;
  surname?: string | null;
  showFatherOnCertificate?: boolean;
  showSurnameOnCertificate?: boolean;
  fatherHusbandName?: string | null;
  motherName?: string | null;
  gender?: string | null;
  profileImageUrl?: string | null;
  signatureUrl?: string | null;
  city?: string | null;
  state?: string | null;
  address?: string | null;
  area?: string | null;
  pincode?: string | null;
  admissionDate: string;
  status: string;
  franchiseName: string;
  franchiseSlug?: string | null;
  franchiseAddress?: string | null;
  franchiseCity?: string | null;
  franchiseState?: string | null;
  franchisePincode?: string | null;
  franchiseId?: string;
  courseName?: string | null;
  courseCode?: string | null;
  durationMonths?: number | null;
  durationValue?: number | null;
  durationUnit?: string | null;
  certificateNumber?: string | null;
  enrollmentNumber?: string | null;
  marksPercent?: number | null;
  subjects?: MarksheetSubject[] | null;
};

function studentDisplayName(s: StudentCertificateSource): string {
  const first = (s.firstName || "").trim();
  const last = (s.surname || "").trim();
  if (s.showSurnameOnCertificate === false) {
    return first || s.fullName;
  }
  if (first || last) return [first, last].filter(Boolean).join(" ");
  return s.fullName;
}

function parentLine(s: StudentCertificateSource): { father: string; mother: string; parentName: string } {
  const father = (s.fatherHusbandName || "").trim();
  const mother = (s.motherName || "").trim();
  if (s.showFatherOnCertificate === false) {
    return { father: "", mother: "", parentName: "" };
  }
  const parentName = [father, mother].filter(Boolean).join(" and ");
  return { father, mother, parentName };
}

function enrollmentDigits(s: StudentCertificateSource): string {
  const fromEnroll = (s.enrollmentNumber || "").replace(/\D/g, "");
  if (fromEnroll) return fromEnroll;
  const fromCode = (s.studentCode || "").replace(/\D/g, "");
  if (fromCode) return fromCode;
  return s.id.replace(/\D/g, "").padStart(7, "0").slice(-7);
}

/**
 * Overlay this student's live data onto a saved official template layout
 * (logos, padding, borders stay as designed).
 */
export function fillCertificateFromStudent(
  layout: CertificateDemoData,
  student: StudentCertificateSource,
  kind: "vocational" | "marksheet" | "marksheet2"
): CertificateDemoData {
  const name = studentDisplayName(student);
  const { father, mother, parentName } = parentLine(student);
  const enroll = enrollmentDigits(student);
  const year = new Date().getFullYear();
  const padded = String(enroll || student.id).slice(-6).padStart(6, "0");
  const prefix = kind === "vocational" ? "CERT" : "MS";
  const certNo =
    student.certificateNumber || `IVESDC/${prefix}/${year}/${padded}`;

  const admission = new Date(student.admissionDate);
  const durationValue = Number(student.durationValue ?? student.durationMonths) || 0;
  const durationUnitRaw = (student.durationUnit || "Months").trim() || "Months";
  const end = durationValue > 0 ? courseEndDate(admission, student) : admission;
  const startStr = formatCertDate(admission);
  const endStr = formatCertDate(end);
  const durationLabel =
    durationValue > 0
      ? `${String(durationValue).padStart(2, "0")} ${durationUnitRaw} (${startStr} to ${endStr})`
      : startStr && endStr
        ? `${startStr} to ${endStr}`
        : layout.duration || "";

  const atcSlug = student.franchiseSlug
    ? `IVESDC/ATC/${sanitizeFranchiseSlug(student.franchiseSlug).toUpperCase()}`
    : student.franchiseId
      ? `IVESDC/ATC/${String(student.franchiseId).padStart(5, "0")}`
      : layout.atcCode;

  const franchiseAddress = [
    student.franchiseAddress,
    student.franchiseCity,
    student.franchiseState,
    student.franchisePincode,
  ]
    .filter(Boolean)
    .join(", ") || layout.franchiseAddress;

  const place = [student.city, student.state].filter(Boolean).join(", ") || layout.place || "";
  const percent = student.marksPercent;

  const subjects: MarksheetSubject[] | undefined = student.subjects?.length
    ? student.subjects
    : scaleSubjectsByPercent(layout.subjects, percent ?? null);

  const totalMax = subjects?.reduce((a, r) => a + (Number(r.totalMax) || 0), 0) || 0;
  const totalGot = subjects?.reduce((a, r) => a + (Number(r.totalObtained) || 0), 0) || 0;
  const computedPercent =
    totalMax > 0
      ? Math.round((totalGot / Math.max(totalMax, 1)) * 10000) / 100
      : percent ?? 0;
  const finalGrade =
    computedPercent > 0 || (percent != null && percent > 0)
      ? gradeFromPercent(computedPercent > 0 ? computedPercent : Number(percent) || 0)
      : { grade: "—", label: "—", marks: 0 };

  const photo =
    (student.profileImageUrl && String(student.profileImageUrl).trim()) ||
    "/nophoto.jpeg";

  return {
    ...layout,
    id: `${kind}-${student.id}`,
    serialNumber: certNo,
    certificateNumber: certNo,
    registrationNumber: enroll || student.studentCode,
    rollNumber: enroll || student.studentCode,
    barcodeNumber: enroll || student.studentCode,
    barcodeTextWords: digitsToWords(enroll || student.studentCode),
    showEnrollmentBarcode: true,
    studentName: name,
    parentName,
    fatherName: father,
    motherName: mother,
    place,
    photoUrl: photo,
    studentSignatureUrl: student.signatureUrl || "",
    courseName: student.courseName || "—",
    courseCode: student.courseCode || "",
    duration: durationLabel,
    atcCode: atcSlug || layout.atcCode,
    atcName: student.franchiseName || layout.atcName,
    trainingCentre:
      [student.franchiseCity, student.franchiseState].filter(Boolean).join(", ") ||
      student.franchiseName ||
      layout.trainingCentre,
    trainingCentreName: student.franchiseName || layout.trainingCentreName,
    franchiseAddress,
    trainingStart: startStr,
    trainingEnd: endStr,
    issueDate: formatCertDate(new Date()),
    grade: finalGrade.grade,
    gradeLabel: finalGrade.label,
    marksPercent: finalGrade.marks || computedPercent,
    division:
      computedPercent >= 75
        ? "First Class with Distinction"
        : computedPercent >= 60
          ? "First Class"
          : computedPercent >= 40
            ? "Second Class"
            : computedPercent > 0
              ? "Fail"
              : "",
    session: Number.isNaN(admission.getTime())
      ? layout.session
      : `${admission.getFullYear()} – ${end.getFullYear()}`,
    status:
      kind === "vocational"
        ? "ISSUED"
        : computedPercent >= 40
          ? "PASS"
          : computedPercent > 0
            ? "FAIL"
            : "—",
    subjects: kind === "vocational" ? layout.subjects : subjects,
  };
}
