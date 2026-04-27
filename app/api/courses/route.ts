import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/** GET: List courses. For sub-admin: global + own franchise. assignable=1: only global not yet in franchise. */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const roleId = Number(user.roleId);
    const franchiseId = user.franchiseId ? BigInt(user.franchiseId) : null;
    const assignable = request.nextUrl.searchParams.get("assignable") === "1";
    const targetFranchiseIdParam = request.nextUrl.searchParams.get("franchiseId");
    const targetFranchiseId = targetFranchiseIdParam ? BigInt(targetFranchiseIdParam) : null;

    let courses: { id: bigint; name: string; baseFee: unknown; durationMonths: number; type: string; franchiseId: bigint | null }[];

    const effectiveFranchiseId = (roleId === ROLES.SUB_ADMIN && franchiseId) ? franchiseId : (roleId === ROLES.SUPER_ADMIN && targetFranchiseId) ? targetFranchiseId : null;

    if (assignable && effectiveFranchiseId) {
      const assigned = await prisma.franchiseCourseFee.findMany({
        where: { franchiseId: effectiveFranchiseId },
        select: { courseId: true },
      });
      const assignedIds = assigned.map((a) => a.courseId);
      courses = await prisma.course.findMany({
        where: {
          status: "ACTIVE",
          franchiseId: null,
          id: { notIn: assignedIds },
        },
        orderBy: { name: "asc" },
      });
    } else {
      const where: { status: "ACTIVE"; OR?: { franchiseId: bigint | null }[] } = {
        status: "ACTIVE",
      };
      if (roleId === ROLES.SUB_ADMIN && franchiseId) {
        where.OR = [{ franchiseId: null }, { franchiseId }];
      }
      courses = await prisma.course.findMany({
        where,
        orderBy: { name: "asc" },
      });
    }

    const data = courses.map((c) => ({
      id: c.id.toString(),
      name: c.name,
      baseFee: Number(c.baseFee),
      durationMonths: c.durationMonths,
      type: c.type,
      franchiseId: c.franchiseId?.toString() ?? null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("GET /api/courses", e);
    return NextResponse.json({ success: false, error: "Failed to fetch courses" }, { status: 500 });
  }
}

/** POST: Create course. Super admin: global. Sub-admin: for own franchise. */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, type, category, baseFee, durationMonths } = body;

    if (!name?.trim() || !type || baseFee == null || durationMonths == null) {
      return NextResponse.json(
        { success: false, error: "name, type, baseFee, durationMonths required" },
        { status: 400 }
      );
    }

    const roleId = Number(user.roleId);
    const franchiseId = roleId === ROLES.SUB_ADMIN && user.franchiseId ? BigInt(user.franchiseId) : null;

    const course = await prisma.course.create({
      data: {
        franchiseId,
        name: String(name).trim(),
        description: description ? String(description).trim() : null,
        type,
        category: category ? String(category).trim() : null,
        baseFee: Number(baseFee),
        durationMonths: Number(durationMonths),
        status: "ACTIVE",
      },
    });

    if (franchiseId) {
      await prisma.franchiseCourseFee.create({
        data: {
          franchiseId,
          courseId: course.id,
          customFee: course.baseFee,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: course.id.toString(),
        name: course.name,
        baseFee: Number(course.baseFee),
        durationMonths: course.durationMonths,
      },
    });
  } catch (e) {
    console.error("POST /api/courses", e);
    return NextResponse.json({ success: false, error: "Failed to create course" }, { status: 500 });
  }
}
