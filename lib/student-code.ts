import { prisma } from "@/lib/prisma";

/**
 * Generate unique student code: STU-YYYY-######
 * Uses year + padded autoincrement-style sequence from max existing code.
 */
export async function generateStudentCode(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `STU-${year}-`;

  const latest = await prisma.student.findFirst({
    where: { studentCode: { startsWith: prefix } },
    orderBy: { studentCode: "desc" },
    select: { studentCode: true },
  });

  let next = 1;
  if (latest?.studentCode) {
    const part = latest.studentCode.slice(prefix.length);
    const n = parseInt(part, 10);
    if (Number.isFinite(n)) next = n + 1;
  }

  return `${prefix}${String(next).padStart(6, "0")}`;
}
