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
      },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: "Student record not found" }, { status: 404 });
    }

    const data = {
      courseName: student.course.name,
      courseDescription: student.course.description,
      durationMonths: student.course.durationMonths,
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
