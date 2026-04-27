import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminOrAdmin } from "@/lib/api-auth";
import { successResponse, errorResponse, forbiddenResponse, notFoundResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/** GET panel config for a franchise */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return forbiddenResponse();
    const { id } = await params;
    const f = await prisma.franchise.findUnique({
      where: { id: BigInt(id) },
      select: { id: true, name: true, slug: true, panelConfig: true },
    });
    if (!f) return notFoundResponse();
    return successResponse({ id: f.id.toString(), name: f.name, slug: f.slug, panelConfig: f.panelConfig });
  } catch (err) {
    console.error("panel-config GET:", err);
    return errorResponse("Failed", 500);
  }
}

/** PATCH — update slug + panelConfig */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return forbiddenResponse();

    const { id } = await params;
    const body = await request.json();
    const { slug, panelConfig } = body;

    const f = await prisma.franchise.findUnique({ where: { id: BigInt(id) } });
    if (!f) return notFoundResponse();

    // Validate slug uniqueness
    if (slug) {
      const safeSlug = String(slug).trim().toLowerCase().replace(/[^a-z0-9-]/g, "").slice(0, 80);
      const conflict = await prisma.franchise.findFirst({
        where: { slug: safeSlug, id: { not: BigInt(id) } },
      });
      if (conflict) return errorResponse("This URL slug is already taken by another franchise.", 409);

      const updated = await prisma.franchise.update({
        where: { id: BigInt(id) },
        data: {
          slug: safeSlug,
          ...(panelConfig !== undefined && { panelConfig: panelConfig as object }),
        },
      });
      return successResponse({ id: updated.id.toString(), slug: updated.slug, panelConfig: updated.panelConfig }, "Panel config saved");
    }

    if (panelConfig !== undefined) {
      const updated = await prisma.franchise.update({
        where: { id: BigInt(id) },
        data: { panelConfig: panelConfig as object },
      });
      return successResponse({ id: updated.id.toString(), slug: updated.slug, panelConfig: updated.panelConfig }, "Panel config saved");
    }

    return errorResponse("Nothing to update", 400);
  } catch (err) {
    console.error("panel-config PATCH:", err);
    return errorResponse("Failed to save", 500);
  }
}
