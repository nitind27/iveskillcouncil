import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

function getFranchiseFilter(user: { roleId: number; franchiseId?: string | null }) {
  if (user.roleId === ROLES.SUB_ADMIN && user.franchiseId) {
    return { franchiseId: BigInt(user.franchiseId) };
  }
  return {};
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const searchParams = request.nextUrl.searchParams;
    const dateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];
    const date = new Date(dateStr);
    const franchiseIdParam = searchParams.get("franchiseId");

    let filter = getFranchiseFilter(user);
    // Super Admin / Admin: allow franchise filter for cross-franchise attendance view
    const roleId = Number(user.roleId);
    if ((roleId === 1 || roleId === 2) && franchiseIdParam) {
      filter = { ...filter, franchiseId: BigInt(franchiseIdParam) };
    }

    if (user.roleId === ROLES.STUDENT) {
      const attendance = await prisma.attendance.findFirst({
        where: { userId: BigInt(user.id), attendanceDate: date },
      });
      return successResponse({
        date: dateStr,
        status: attendance?.status ?? null,
        method: attendance?.method ?? null,
      });
    }

    const [attendanceList, students, stats] = await Promise.all([
      prisma.attendance.findMany({
        where: { ...filter, attendanceDate: date },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
      }),
      prisma.student.findMany({
        where: filter,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
      }),
      prisma.attendance.groupBy({
        by: ["status"],
        where: { ...filter, attendanceDate: date },
        _count: true,
      }),
    ]);

    const byUser = Object.fromEntries(attendanceList.map((a) => [a.userId.toString(), a.status]));
    const studentList = students.map((s) => ({
      id: s.userId.toString(),
      fullName: s.user.fullName,
      email: s.user.email,
      status: byUser[s.userId.toString()] ?? null,
    }));

    const statMap = stats.reduce((acc, s) => {
      acc[s.status] = s._count;
      return acc;
    }, {} as Record<string, number>);

    return successResponse({
      date: dateStr,
      students: studentList,
      stats: statMap,
      totalPresent: statMap.PRESENT ?? 0,
      totalAbsent: statMap.ABSENT ?? 0,
      totalLate: statMap.LATE ?? 0,
    });
  } catch (err) {
    console.error("Attendance GET:", err);
    return errorResponse("Failed to fetch attendance", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const roleId = Number(user.roleId);
    if (roleId !== ROLES.SUPER_ADMIN && roleId !== ROLES.ADMIN && roleId !== ROLES.SUB_ADMIN) {
      return errorResponse("Forbidden", 403);
    }

    const body = await request.json();
    const { date, entries } = body as { date: string; entries: { userId: string; status: "PRESENT" | "ABSENT" | "LATE" }[] };

    if (!date || !Array.isArray(entries)) {
      return errorResponse("Missing date or entries", 400);
    }

    const attendanceDate = new Date(date);
    const filter = getFranchiseFilter(user);

    for (const e of entries) {
      if (!["PRESENT", "ABSENT", "LATE"].includes(e.status)) continue;
      const uid = BigInt(e.userId);

      const student = await prisma.student.findFirst({
        where: { userId: uid, ...filter },
      });
      if (!student) continue;

      await prisma.attendance.upsert({
        where: {
          userId_attendanceDate: { userId: uid, attendanceDate },
        },
        create: {
          userId: uid,
          franchiseId: student.franchiseId,
          attendanceDate,
          status: e.status,
          method: "MANUAL",
        },
        update: { status: e.status },
      });
    }

    return successResponse(null, "Attendance updated");
  } catch (err) {
    console.error("Attendance POST:", err);
    return errorResponse("Failed to update attendance", 500);
  }
}
