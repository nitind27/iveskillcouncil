import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";
import { parseHighlights, serializeCourse, slugifyCourseName } from "@/lib/course-utils";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function canManageCourse(
  user: { roleId: number | string; franchiseId?: string | null },
  course: { franchiseId: bigint | null }
) {
  const roleId = Number(user.roleId);
  if (roleId === ROLES.SUPER_ADMIN || roleId === ROLES.ADMIN) return true;
  if (roleId === ROLES.SUB_ADMIN && user.franchiseId && course.franchiseId) {
    return course.franchiseId.toString() === String(user.franchiseId);
  }
  return false;
}

/** PATCH /api/courses/[id] */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const courseId = BigInt(id);
    const existing = await prisma.course.findUnique({ where: { id: courseId } });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }
    if (!(await canManageCourse(user, existing))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.name != null) data.name = String(body.name).trim();
    if (body.slug !== undefined) {
      const s = body.slug ? slugifyCourseName(String(body.slug)) : null;
      if (s && s !== existing.slug) {
        const taken = await prisma.course.findUnique({ where: { slug: s } });
        if (taken && taken.id !== courseId) {
          return NextResponse.json({ success: false, error: "Slug already in use" }, { status: 400 });
        }
      }
      data.slug = s;
    }
    if (body.description !== undefined) {
      data.description = body.description ? String(body.description).trim() : null;
    }
    if (body.shortDescription !== undefined) {
      data.shortDescription = body.shortDescription
        ? String(body.shortDescription).trim()
        : null;
    }
    if (body.imageUrl !== undefined) {
      data.imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;
    }
    if (body.type != null) data.type = body.type;
    if (body.category !== undefined) {
      data.category = body.category ? String(body.category).trim() : null;
    }
    if (body.level != null) data.level = body.level;
    if (body.mode != null) data.mode = body.mode;
    if (body.baseFee != null) data.baseFee = Number(body.baseFee);
    if (body.durationMonths != null) data.durationMonths = Number(body.durationMonths);
    if (body.lectures != null) data.lectures = Number(body.lectures) || 0;
    if (body.videos != null) data.videos = Number(body.videos) || 0;
    if (body.notes !== undefined) {
      data.notes = body.notes ? String(body.notes).trim() : null;
    }
    if (body.highlights !== undefined) data.highlights = parseHighlights(body.highlights);
    if (body.status != null) data.status = body.status;

    const course = await prisma.course.update({
      where: { id: courseId },
      data,
    });

    return NextResponse.json({ success: true, data: serializeCourse(course) });
  } catch (e) {
    console.error("PATCH /api/courses/[id]", e);
    return NextResponse.json({ success: false, error: "Failed to update course" }, { status: 500 });
  }
}

/** DELETE /api/courses/[id] */
export async function DELETE(_request: NextRequest, { params }: Ctx) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const courseId = BigInt(id);
    const existing = await prisma.course.findUnique({
      where: { id: courseId },
      include: { _count: { select: { students: true, franchiseFees: true } } },
    });
    if (!existing) {
      return NextResponse.json({ success: false, error: "Course not found" }, { status: 404 });
    }
    if (!(await canManageCourse(user, existing))) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    if (existing._count.students > 0 || existing._count.franchiseFees > 0) {
      await prisma.course.update({
        where: { id: courseId },
        data: { status: "INACTIVE" },
      });
      return NextResponse.json({
        success: true,
        message: "Course deactivated (linked students/franchises exist)",
      });
    }

    await prisma.course.delete({ where: { id: courseId } });
    return NextResponse.json({ success: true, message: "Course deleted" });
  } catch (e) {
    console.error("DELETE /api/courses/[id]", e);
    return NextResponse.json({ success: false, error: "Failed to delete course" }, { status: 500 });
  }
}
