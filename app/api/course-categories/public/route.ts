import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/** GET /api/course-categories/public — no auth, returns active categories ordered by sortOrder */
export async function GET() {
  try {
    const cats = await prisma.courseCategory.findMany({
      where: { status: "ACTIVE" },
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json({ success: true, data: cats });
  } catch (e) {
    console.error("GET /api/course-categories/public", e);
    return NextResponse.json({ success: false, error: "Failed to fetch categories" }, { status: 500 });
  }
}
