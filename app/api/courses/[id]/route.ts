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
    const payload = coursePayloadFromBody(body);
    const data: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(payload)) {
      if (value !== undefined) data[key] = value;
    }

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

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
    }

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
        message: "Course has linked records — marked inactive instead of deleted.",
      });
    }

    await prisma.course.delete({ where: { id: courseId } });
    return NextResponse.json({ success: true, message: "Course deleted." });
  } catch (e) {
    console.error("DELETE /api/courses/[id]", e);
    return NextResponse.json({ success: false, error: "Failed to delete course" }, { status: 500 });
  }
}
