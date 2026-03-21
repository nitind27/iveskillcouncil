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

    if (user.roleId !== ROLES.STAFF) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const staff = await prisma.staff.findUnique({
      where: { userId: BigInt(user.id) },
    });

    if (!staff) {
      return NextResponse.json({ success: true, data: { items: [] } });
    }

    // For now: show all students in the same franchise as the staff
    // (No explicit assignment table exists in schema)
    const students = await prisma.student.findMany({
      where: { franchiseId: staff.franchiseId, status: "ACTIVE" },
      include: {
        user: { select: { fullName: true, email: true } },
        course: { select: { name: true } },
      },
    });

    const items = students.map((s) => ({
      id: s.id.toString(),
      fullName: s.user.fullName,
      email: s.user.email,
      courseName: s.course.name,
    }));

    return NextResponse.json({ success: true, data: { items } });
  } catch (e) {
    console.error("GET /api/staff/assigned-students", e);
    return NextResponse.json({ success: false, error: "Failed to fetch" }, { status: 500 });
  }
}
