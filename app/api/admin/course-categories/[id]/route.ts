import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminOrAdmin } from "@/lib/api-auth";
import { successResponse, errorResponse, forbiddenResponse, notFoundResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/** PATCH — update category */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return forbiddenResponse();

    const { id } = await params;
    const body = await request.json();
    const { name, description, icon, colorClass, sortOrder, status } = body;

    const existing = await prisma.courseCategory.findUnique({ where: { id: Number(id) } });
    if (!existing) return notFoundResponse();

    const updated = await prisma.courseCategory.update({
      where: { id: Number(id) },
      data: {
        ...(name && { name: String(name).trim() }),
        ...(description !== undefined && { description: description ? String(description).trim() : null }),
        ...(icon !== undefined && { icon: icon ? String(icon).trim() : null }),
        ...(colorClass && { colorClass: String(colorClass).trim() }),
        ...(typeof sortOrder === "number" && { sortOrder }),
        ...(status && { status: String(status) }),
      },
    });
    return successResponse(updated, "Category updated");
  } catch (e) {
    console.error("PATCH /api/admin/course-categories/[id]", e);
    return errorResponse("Failed to update category", 500);
  }
}

/** DELETE — delete category (only if no courses use it) */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return forbiddenResponse();

    const { id } = await params;
    const cat = await prisma.courseCategory.findUnique({ where: { id: Number(id) } });
    if (!cat) return notFoundResponse();

    // Check if any courses use this category slug
    const courseCount = await prisma.course.count({ where: { category: cat.slug } });
    if (courseCount > 0) {
      return errorResponse(`Cannot delete — ${courseCount} course(s) use this category. Reassign them first.`, 409);
    }

    await prisma.courseCategory.delete({ where: { id: Number(id) } });
    return successResponse(null, "Category deleted");
  } catch (e) {
    console.error("DELETE /api/admin/course-categories/[id]", e);
    return errorResponse("Failed to delete category", 500);
  }
}
