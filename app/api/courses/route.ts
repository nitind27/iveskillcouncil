import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";
import { parseHighlights, serializeCourse, slugifyCourseName } from "@/lib/course-utils";

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
    const includeInactive = request.nextUrl.searchParams.get("all") === "1";

    const effectiveFranchiseId =
      roleId === ROLES.SUB_ADMIN && franchiseId
        ? franchiseId
        : roleId === ROLES.SUPER_ADMIN && targetFranchiseId
          ? targetFranchiseId
          : null;

    let courses;

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
      const where: {
        status?: "ACTIVE" | "INACTIVE";
        OR?: { franchiseId: bigint | null }[];
      } = {};
      if (!includeInactive) where.status = "ACTIVE";
      if (roleId === ROLES.SUB_ADMIN && franchiseId) {
        where.OR = [{ franchiseId: null }, { franchiseId }];
      }
      courses = await prisma.course.findMany({
        where,
        orderBy: { name: "asc" },
      });
    }

    return NextResponse.json({
      success: true,
      data: courses.map(serializeCourse),
    });
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
    const {
      name,
      slug,
      description,
      shortDescription,
      imageUrl,
      type,
      category,
      level,
      mode,
      baseFee,
      durationMonths,
      lectures,
      videos,
      notes,
      highlights,
      status,
    } = body;

    if (!name?.trim() || !type || baseFee == null || durationMonths == null) {
      return NextResponse.json(
        { success: false, error: "name, type, baseFee, durationMonths required" },
        { status: 400 }
      );
    }

    const roleId = Number(user.roleId);
    const franchiseId =
      roleId === ROLES.SUB_ADMIN && user.franchiseId ? BigInt(user.franchiseId) : null;

    let finalSlug = slug ? slugifyCourseName(String(slug)) : slugifyCourseName(String(name));
    if (finalSlug) {
      const taken = await prisma.course.findUnique({ where: { slug: finalSlug } });
      if (taken) finalSlug = `${finalSlug}-${Date.now().toString(36)}`;
    }

    const course = await prisma.course.create({
      data: {
        franchiseId,
        name: String(name).trim(),
        slug: finalSlug || null,
        description: description ? String(description).trim() : null,
        shortDescription: shortDescription ? String(shortDescription).trim() : null,
        imageUrl: imageUrl ? String(imageUrl).trim() : null,
        type,
        category: category ? String(category).trim() : null,
        level: level || "BEGINNER",
        mode: mode || "OFFLINE",
        baseFee: Number(baseFee),
        durationMonths: Number(durationMonths),
        lectures: Number(lectures) || 0,
        videos: Number(videos) || 0,
        notes: notes ? String(notes).trim() : null,
        highlights: parseHighlights(highlights),
        status: status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
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

    return NextResponse.json({ success: true, data: serializeCourse(course) });
  } catch (e) {
    console.error("POST /api/courses", e);
    return NextResponse.json({ success: false, error: "Failed to create course" }, { status: 500 });
  }
}
