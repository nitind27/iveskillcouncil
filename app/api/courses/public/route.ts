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
          slug: true,
          description: true,
          shortDescription: true,
          imageUrl: true,
          type: true,
          category: true,
          level: true,
          mode: true,
          durationMonths: true,
          lectures: true,
          videos: true,
          notes: true,
          highlights: true,
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
      slug: c.slug,
      description: c.description,
      shortDescription: c.shortDescription,
      imageUrl: c.imageUrl,
      type: c.type,
      category: c.category || "other",
      categoryData: catMap[c.category || "other"] ?? null,
      level: c.level,
      mode: c.mode,
      durationMonths: c.durationMonths,
      lectures: c.lectures,
      videos: c.videos,
      notes: c.notes,
      highlights: c.highlights
        ? c.highlights.split("\n").map((l) => l.trim()).filter(Boolean)
        : [],
    }));

    return NextResponse.json(
      { success: true, data, categories },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (e) {
    console.error("GET /api/courses/public", e);
    return NextResponse.json({ success: false, error: "Failed to fetch courses" }, { status: 500 });
  }
}
