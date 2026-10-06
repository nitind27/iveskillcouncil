import { prisma } from "@/lib/prisma";

/** Keep students.total_fee as the sum of active course fees, and students.course_id as a real enrollment. */
export async function refreshStudentCourseTotals(studentId: bigint) {
  const [rows, student] = await Promise.all([
    prisma.studentEnrollment.findMany({
      where: { studentId, status: "ACTIVE" },
      orderBy: { createdAt: "asc" },
      select: { courseId: true, totalFee: true },
    }),
    prisma.student.findUnique({
      where: { id: studentId },
      select: { courseId: true },
    }),
  ]);

  const totalFee = rows.reduce((sum, row) => sum + Number(row.totalFee), 0);
  const ids = new Set(rows.map((row) => row.courseId.toString()));
  const current = student?.courseId?.toString();
  const courseId =
    current && ids.has(current) ? student!.courseId : rows[0]?.courseId ?? null;

  await prisma.student.update({
    where: { id: studentId },
    data: { totalFee, courseId },
  });
}
