import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/api-response";
import { FranchiseStatus } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 60;

const DEFAULT_IMAGES: Record<string, string> = {
  SILVER: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=240&fit=crop",
  GOLD: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=240&fit=crop",
  DIAMOND: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=240&fit=crop",
};

/** Public API - course detail for a specific franchise. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; slug: string }> }
) {
  try {
    const { id, slug } = await params;
    const franchiseId = BigInt(id);

    const franchise = await prisma.franchise.findFirst({
      where: { id: franchiseId, status: FranchiseStatus.ACTIVE },
      include: {
        courses: {
          include: { course: true },
        },
      },
    });

    if (!franchise) return notFoundResponse();

    const fc = franchise.courses.find((f) => {
      const c = f.course;
      if (c.status !== "ACTIVE") return false;
      const s = c.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
      return s === slug || c.id.toString() === slug;
    });

    if (!fc) return notFoundResponse();

    const c = fc.course;
    const courseSlug = c.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

    const data = {
      id: c.id.toString(),
      title: c.name,
      slug: courseSlug,
      description: c.description,
      duration: `${c.durationMonths} Month${c.durationMonths > 1 ? "s" : ""}`,
      durationMonths: c.durationMonths,
      image: (c as { imageUrl?: string | null }).imageUrl ?? DEFAULT_IMAGES[c.type] ?? DEFAULT_IMAGES.SILVER,
      fee: Number(fc.customFee),
      type: c.type,
      franchise: {
        id: franchise.id.toString(),
        name: franchise.name,
      },
    };

    return successResponse(data, "Course detail");
  } catch (err) {
    console.error("Franchise course detail API error:", err);
    return errorResponse("Failed to fetch course", 500);
  }
}
