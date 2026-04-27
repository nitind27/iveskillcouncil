import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/**
 * GET /api/courses/public
 * Public — no auth. Returns all ACTIVE global courses with their category data.
 */
export async function GET() {
  try {
    const [courses, categories] = await Promise.all([
      prisma.course.findMany({
        where: { status: "ACTIVE", franchiseId: null },
        orderBy: [{ category: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          category: true,
          baseFee: true,
          durationMonths: true,
        },
      }),
      prisma.courseCategory.findMany({
        where: { status: "ACTIVE" },
        orderBy: { sortOrder: "asc" },
      }),
    ]);

    // Build slug → category map
    const catMap = Object.fromEntries(categories.map((c) => [c.slug, c]));

    const data = courses.map((c) => ({
      id: c.id.toString(),
      name: c.name,
      description: c.description,
      type: c.type,
      category: c.category || "other",
      categoryData: catMap[c.category || "other"] ?? null,
      baseFee: Number(c.baseFee),
      durationMonths: c.durationMonths,
    }));

    return NextResponse.json({ success: true, data, categories });
  } catch (e) {
    console.error("GET /api/courses/public", e);
    return NextResponse.json({ success: false, error: "Failed to fetch courses" }, { status: 500 });
  }
}
