import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminOrAdmin } from "@/lib/api-auth";
import { successResponse, errorResponse, forbiddenResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

function toSlug(name: string) {
  return name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

/** GET — list all categories (admin) */
export async function GET() {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return forbiddenResponse();
    const cats = await prisma.courseCategory.findMany({ orderBy: { sortOrder: "asc" } });
    return successResponse(cats);
  } catch (e) {
    console.error("GET /api/admin/course-categories", e);
    return errorResponse("Failed to fetch categories", 500);
  }
}

/** POST — create category */
export async function POST(request: NextRequest) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return forbiddenResponse();

    const body = await request.json();
    const { name, description, icon, colorClass, sortOrder } = body;
    if (!name?.trim()) return errorResponse("name is required", 400);

    const slug = toSlug(name);
    const existing = await prisma.courseCategory.findUnique({ where: { slug } });
    if (existing) return errorResponse("Category with this name already exists", 409);

    const cat = await prisma.courseCategory.create({
      data: {
        name: String(name).trim(),
        slug,
        description: description ? String(description).trim() : null,
        icon: icon ? String(icon).trim() : null,
        colorClass: colorClass ? String(colorClass).trim() : "blue",
        sortOrder: typeof sortOrder === "number" ? sortOrder : 99,
        status: "ACTIVE",
      },
    });
    return successResponse(cat, "Category created");
  } catch (e) {
    console.error("POST /api/admin/course-categories", e);
    return errorResponse("Failed to create category", 500);
  }
}
