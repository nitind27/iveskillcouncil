import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, notFoundResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const revalidate = 60;

/** GET /api/franchise-panel/[slug] — public, returns franchise panel config */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const f = await prisma.franchise.findFirst({
      where: { slug: String(slug).toLowerCase(), status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        slug: true,
        panelConfig: true,
        city: true,
        state: true,
        email: true,
        phone: true,
        plan: { select: { name: true } },
      },
    });
    if (!f) return notFoundResponse();

    return successResponse({
      id:          f.id.toString(),
      name:        f.name,
      slug:        f.slug,
      city:        f.city,
      state:       f.state,
      email:       f.email,
      phone:       f.phone,
      planName:    f.plan.name,
      panelConfig: f.panelConfig ?? {},
    });
  } catch (err) {
    console.error("franchise-panel GET:", err);
    return errorResponse("Failed", 500);
  }
}
