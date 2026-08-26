import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";
import {
  coursePayloadFromBody,
  serializeCourse,
  slugifyCourseName,
} from "@/lib/course-utils";

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
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
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
        orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
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
    const name = body.name;
    const type = body.type;
    const baseFee = body.baseFee;
    const hasDuration =
      body.durationMonths != null ||
      (body.durationValue != null && body.durationUnit);

    if (!name?.trim() || !type || baseFee == null || !hasDuration) {
      return NextResponse.json(
        {
          success: false,
          error: "Course title, type, price and duration are required",
        },
        { status: 400 }
      );
    }
    if (!body.description?.toString().trim()) {
      return NextResponse.json(
        { success: false, error: "Description is required" },
        { status: 400 }
      );
    }
    if (!body.syllabus?.toString().trim()) {
      return NextResponse.json(
        { success: false, error: "Syllabus is required" },
        { status: 400 }
      );
    }
    if (body.lectures == null || Number(body.lectures) < 1) {
      return NextResponse.json(
        { success: false, error: "Total number of lectures is required" },
        { status: 400 }
      );
    }
    if (!body.certificateType) {
      return NextResponse.json(
        { success: false, error: "Certificate type is required" },
        { status: 400 }
      );
    }

    const roleId = Number(user.roleId);
    const franchiseId =
      roleId === ROLES.SUB_ADMIN && user.franchiseId ? BigInt(user.franchiseId) : null;

    let finalSlug = body.slug
      ? slugifyCourseName(String(body.slug))
      : slugifyCourseName(String(name));
    if (finalSlug) {
      const taken = await prisma.course.findUnique({ where: { slug: finalSlug } });
      if (taken) finalSlug = `${finalSlug}-${Date.now().toString(36)}`;
    }

    const payload = coursePayloadFromBody(body);
    const tags = Array.isArray(payload.tags) ? payload.tags : [];
    if (tags.length === 0) {
      return NextResponse.json(
        { success: false, error: "At least one tag is required" },
        { status: 400 }
      );
    }

    const course = await prisma.course.create({
      data: {
        franchiseId,
        name: String(name).trim(),
        slug: finalSlug || null,
        description: payload.description as string | null,
        shortDescription: (payload.shortDescription as string | null) ?? null,
        imageUrl: (payload.imageUrl as string | null) ?? null,
        type,
        category: (payload.category as string | null) ?? null,
        level: ((payload.level as string) || "BEGINNER") as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
        mode: ((payload.mode as string) || "OFFLINE") as "OFFLINE" | "ONLINE" | "HYBRID",
        baseFee: Number(baseFee),
        durationMonths: Number(payload.durationMonths) || 1,
        lectures: Number(payload.lectures) || 0,
        videos: Number(payload.videos) || 0,
        notes: (payload.notes as string | null) ?? null,
        highlights: (payload.highlights as string | null) ?? null,
        status: payload.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
        awardCategory: (payload.awardCategory as string | null) ?? null,
        certificateType: (payload.certificateType as string | null) ?? "CERTIFICATE",
        coursePreposition: (payload.coursePreposition as string | null) ?? "In",
        mrp: payload.mrp as number | null | undefined,
        displayOrder: Number(payload.displayOrder) || 0,
        durationValue: payload.durationValue as number | undefined,
        durationUnit: (payload.durationUnit as string | undefined) ?? "Months",
        previewVideoUrl: (payload.previewVideoUrl as string | null) ?? null,
        practicalMarks: payload.practicalMarks as number | null | undefined,
        objectiveMarks: payload.objectiveMarks as number | null | undefined,
        examFeesByPlan: payload.examFeesByPlan ?? [],
        syllabus: (payload.syllabus as string | null) ?? null,
        eligibility: (payload.eligibility as string | null) ?? null,
        certificateSubject: (payload.certificateSubject as string | null) ?? null,
        tags,
        isPopular: Boolean(payload.isPopular),
        isRecommended: Boolean(payload.isRecommended),
        isMrpVisible: payload.isMrpVisible !== false,
        hideExamResult: Boolean(payload.hideExamResult),
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
