import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const revalidate = 60;

const DEFAULT_IMAGES: Record<string, string> = {
  SILVER: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=240&fit=crop",
  GOLD: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=240&fit=crop",
  DIAMOND: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=240&fit=crop",
};

function toCourseSlug(name: string, id: bigint) {
  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return slug || id.toString();
}

function stripHtml(html: string | null | undefined) {
  if (!html) return null;
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
  return text || null;
}

/** GET /api/franchise-panel/[slug] — public, returns franchise portal + courses */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const safeSlug = String(slug || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const f = await prisma.franchise.findFirst({
      where: {
        status: { in: ["ACTIVE", "PENDING"] },
        OR: [{ slug: safeSlug }, { slug: String(slug || "").trim().toLowerCase() }],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        panelConfig: true,
        city: true,
        state: true,
        address: true,
        email: true,
        phone: true,
        status: true,
        plan: { select: { name: true } },
        courses: {
          include: { course: true },
        },
      },
    });
    if (!f) return notFoundResponse();

    const courses = f.courses
      .filter((fc) => fc.course.status === "ACTIVE")
      .map((fc) => {
        const c = fc.course;
        return {
          id: c.id.toString(),
          title: c.name,
          slug: toCourseSlug(c.name, c.id),
          description: stripHtml(c.description),
          duration: `${c.durationMonths} Month${c.durationMonths > 1 ? "s" : ""}`,
          durationMonths: c.durationMonths,
          image: (c as { imageUrl?: string | null }).imageUrl ?? DEFAULT_IMAGES[c.type] ?? DEFAULT_IMAGES.SILVER,
          type: c.type,
        };
      });

    return successResponse({
      id: f.id.toString(),
      name: f.name,
      slug: f.slug,
      city: f.city,
      state: f.state,
      address: f.address,
      email: f.email,
      phone: f.phone,
      status: f.status,
      planName: f.plan.name,
      panelConfig: f.panelConfig ?? {},
      courses,
    });
  } catch (err) {
    console.error("franchise-panel GET:", err);
    return errorResponse("Failed", 500);
  }
}
