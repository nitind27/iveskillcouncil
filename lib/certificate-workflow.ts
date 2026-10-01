import { prisma } from "@/lib/prisma";

export type WorkflowStatus = "APPROVED" | "ISSUED" | "REJECTED";

export const WORKFLOW_STATUSES: WorkflowStatus[] = ["APPROVED", "ISSUED", "REJECTED"];

/** Which current statuses may move to the target status. */
const ALLOWED_FROM: Record<WorkflowStatus, string[]> = {
  APPROVED: ["REQUESTED", "REJECTED"],
  REJECTED: ["REQUESTED", "APPROVED"],
  ISSUED: ["APPROVED", "REQUESTED"],
};

/** Same number the website prints for this student: IVESDC/CERT/<year>/<last 6 of enrollment>. */
export function officialCertificateNumber(studentCode: string, studentId: bigint, date = new Date()): string {
  const tail = String(studentCode || studentId).trim().slice(-6).padStart(6, "0").toUpperCase();
  return `IVESDC/CERT/${date.getFullYear()}/${tail}`;
}

function isOfficialNumber(n: string): boolean {
  return /^IVESDC\/CERT\/\d{4}\/[A-Z0-9]{6,}$/.test(n);
}

/** Gives the certificate its official number, moving any old rejected record off that number first. */
async function ensureOfficialNumber(cert: { id: bigint; certificateNumber: string; studentId: bigint }, studentCode: string) {
  if (isOfficialNumber(cert.certificateNumber)) return cert.certificateNumber;
  let number = officialCertificateNumber(studentCode, cert.studentId);
  const holder = await prisma.certificate.findUnique({ where: { certificateNumber: number } });
  if (holder && holder.id !== cert.id) {
    if (holder.studentId !== cert.studentId) {
      // Another student shares the last 6 characters — use the full enrollment instead.
      const full = String(studentCode || cert.studentId).trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
      number = `IVESDC/CERT/${new Date().getFullYear()}/${full}`;
      if (await prisma.certificate.findUnique({ where: { certificateNumber: number } })) return cert.certificateNumber;
    } else if (holder.status === "REJECTED") {
      await prisma.certificate.update({
        where: { id: holder.id },
        data: { certificateNumber: `${number}-R${holder.id}` },
      });
    } else {
      return cert.certificateNumber;
    }
  }
  await prisma.certificate.update({ where: { id: cert.id }, data: { certificateNumber: number } });
  return number;
}

export type WorkflowResult = { updated: number; skipped: number };

export async function applyCertificateStatus(
  ids: bigint[],
  status: WorkflowStatus,
  userId: string
): Promise<WorkflowResult> {
  const certs = await prisma.certificate.findMany({
    where: { id: { in: ids } },
    include: { student: { select: { studentCode: true } } },
  });

  let updated = 0;
  for (const cert of certs) {
    if (!ALLOWED_FROM[status].includes(cert.status)) continue;
    if (status === "APPROVED" || status === "ISSUED") {
      await ensureOfficialNumber(cert, cert.student.studentCode);
    }
    await prisma.certificate.update({
      where: { id: cert.id },
      data:
        status === "ISSUED"
          ? { status, issueDate: new Date(), issuer: { connect: { id: BigInt(userId) } } }
          : { status },
    });
    updated += 1;
  }
  return { updated, skipped: ids.length - updated };
}
