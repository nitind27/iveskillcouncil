import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 60;

const COURSE_SELECT = {
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
} as const;

function mapCourse(
  c: {
    id: bigint;
    name: string;
    slug: string | null;
    description: string | null;
    shortDescription: string | null;
    imageUrl: string | null;
    type: string;
    category: string | null;
    level: string;
    mode: string;
    durationMonths: number;
    lectures: number;
    videos: number;
    notes: string | null;
    highlights: string | null;
  },
  catMap: Record<string, unknown>
) {
  return {
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
  };
}

/**
 * GET /api/courses/public
 * Public — no auth. Returns ACTIVE courses. Optional ?franchiseSlug= filters to that franchise.
 */
export async function GET(request: NextRequest) {
  try {
    const franchiseSlug = (request.nextUrl.searchParams.get("franchiseSlug") || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    const categories = await prisma.courseCategory.findMany({
      where: { status: "ACTIVE" },
      orderBy: { sortOrder: "asc" },
    });
    const catMap = Object.fromEntries(categories.map((c) => [c.slug, c]));

    if (franchiseSlug) {
      const franchise = await prisma.franchise.findFirst({
        where: { slug: franchiseSlug, status: { in: ["ACTIVE", "PENDING"] } },
        include: {
          courses: { include: { course: true } },
        },
      });
      if (!franchise) {
        return NextResponse.json({ success: false, error: "Franchise not found" }, { status: 404 });
      }
      const data = franchise.courses
        .filter((fc) => fc.course.status === "ACTIVE")
        .map((fc) => mapCourse(fc.course, catMap));
      return NextResponse.json(
        { success: true, data, categories },
        { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
      );
    }

    const courses = await prisma.course.findMany({
      where: { status: "ACTIVE", franchiseId: null },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      select: COURSE_SELECT,
    });

    const data = courses.map((c) => mapCourse(c, catMap));

    return NextResponse.json(
      { success: true, data, categories },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
    );
  } catch (e) {
    console.error("GET /api/courses/public", e);
    return NextResponse.json({ success: false, error: "Failed to fetch courses" }, { status: 500 });
  }
}
