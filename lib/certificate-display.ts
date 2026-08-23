import { prisma } from "@/lib/prisma";
import { mergeCertificateData, type CertificateOverrides } from "@/lib/certificate-overrides";

export interface CertificateDisplayData {
  id: string;
  serialNumber: string;
  certificateNumber: string;
  atcCode: string;
  atcName: string;
  studentName: string;
  parentName: string;
  registrationNumber: string;
  courseName: string;
  grade: string;
  gradeLabel: string;
  marksPercent: number | null;
  trainingStart: string;
  trainingEnd: string;
  issueDate: string;
  trainingCentre: string;
  trainingCentreName: string;
  franchiseAddress: string;
  status: string;
  isDraft?: boolean;
  displayOverrides?: CertificateOverrides | null;
}

export function gradeFromPercent(percent: number) {
  if (percent >= 85) return { grade: "A+", label: "Excellent", marks: percent };
  if (percent >= 70) return { grade: "A", label: "Very Good", marks: percent };
  if (percent >= 55) return { grade: "B", label: "Good", marks: percent };
  if (percent >= 40) return { grade: "C", label: "Average", marks: percent };
  return { grade: "—", label: "—", marks: percent };
}

function formatDate(d: Date | null | undefined) {
  if (!d) return "";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

async function getAttendancePercent(userId: bigint, franchiseId: bigint) {
  const records = await prisma.attendance.findMany({
    where: { userId, franchiseId },
    select: { status: true },
  });
  if (records.length === 0) return null;
  const present = records.filter((r) => r.status === "PRESENT" || r.status === "LATE").length;
  return Math.round((present / records.length) * 100);
}

export async function getCertificateDisplayData(
  certificateId: bigint
): Promise<CertificateDisplayData | null> {
  const certificate = await prisma.certificate.findUnique({
    where: { id: certificateId },
    include: {
      student: {
        include: {
          user: { select: { fullName: true, id: true } },
          course: { select: { name: true, durationMonths: true } },
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
        },
      },
    },
  });

  if (!certificate) return null;

  const { student } = certificate;
  const franchise = student.franchise;
  const attendancePercent = await getAttendancePercent(student.userId, student.franchiseId);
  const gradeInfo = attendancePercent != null ? gradeFromPercent(attendancePercent) : null;

  const trainingStart = student.admissionDate;
  const trainingEnd =
    certificate.issueDate ??
    addMonths(student.admissionDate, student.course.durationMonths || 0);

  const franchiseAddress = [franchise.address, franchise.city, franchise.state, franchise.pincode]
    .filter(Boolean)
    .join(", ");

  const atcCode = franchise.slug
    ? franchise.slug.toUpperCase().replace(/-/g, "")
    : `ATC${String(franchise.id).padStart(5, "0")}`;

  const base: CertificateDisplayData = {
    id: certificate.id.toString(),
    serialNumber: String(certificate.id).padStart(6, "0"),
    certificateNumber: certificate.certificateNumber,
    atcCode,
    atcName: franchise.name,
    studentName: student.user.fullName,
    parentName: "",
    registrationNumber: `REG-${String(student.id).padStart(6, "0")}`,
    courseName: student.course.name,
    grade: gradeInfo?.grade ?? "A",
    gradeLabel: gradeInfo?.label ?? "Very Good",
    marksPercent: gradeInfo?.marks ?? (certificate.status === "ISSUED" ? 90 : null),
    trainingStart: formatDate(trainingStart),
    trainingEnd: formatDate(trainingEnd),
    issueDate: formatDate(certificate.issueDate ?? new Date()),
    trainingCentre: [franchise.city, franchise.state].filter(Boolean).join(", "),
    trainingCentreName: franchise.name,
    franchiseAddress,
    status: certificate.status,
  };

  const overrides = certificate.displayOverrides as CertificateOverrides | null;
  return mergeCertificateData(base, overrides);
}

export async function getLatestStudentCertificateDisplayData(
  userId: bigint
): Promise<CertificateDisplayData | null> {
  const student = await prisma.student.findUnique({
    where: { userId },
    select: { id: true },
  });
  if (!student) return null;

  const certificate = await prisma.certificate.findFirst({
    where: { studentId: student.id, status: "ISSUED" },
    orderBy: { issueDate: "desc" },
  });

  if (!certificate) return null;
  return getCertificateDisplayData(certificate.id);
}
