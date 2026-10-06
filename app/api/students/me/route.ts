import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (user.roleId !== ROLES.STUDENT) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: BigInt(user.id) },
      include: {
        course: true,
        franchise: { select: { name: true } },
        enrollments: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "asc" },
          include: { course: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: "Student record not found" }, { status: 404 });
    }

    const courses =
      student.enrollments.length > 0
        ? student.enrollments.map((row) => ({
            id: row.courseId.toString(),
            courseName: row.course.name,
            courseDescription: row.course.description,
            durationMonths: row.course.durationMonths,
            totalFee: Number(row.totalFee),
          }))
        : student.course
          ? [
              {
                id: student.course.id.toString(),
                courseName: student.course.name,
                courseDescription: student.course.description,
                durationMonths: student.course.durationMonths,
                totalFee: Number(student.totalFee),
              },
            ]
          : [];

    const data = {
      courseName: courses.map((c) => c.courseName).join(", ") || "—",
      courseDescription: courses[0]?.courseDescription ?? null,
      durationMonths: courses[0]?.durationMonths ?? null,
      courses,
      franchiseName: student.franchise.name,
      totalFee: Number(student.totalFee),
      paidFee: Number(student.paidFee),
      pendingFee: Number(student.totalFee) - Number(student.paidFee),
      admissionDate: student.admissionDate.toISOString().split("T")[0],
      status: student.status,
    };

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("GET /api/students/me", e);
    return NextResponse.json({ success: false, error: "Failed to fetch" }, { status: 500 });
  }
}
