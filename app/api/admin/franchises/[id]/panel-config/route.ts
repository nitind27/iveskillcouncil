import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminOrAdmin } from "@/lib/api-auth";
import { successResponse, errorResponse, forbiddenResponse, notFoundResponse } from "@/lib/api-response";
import { resolveFranchiseCreateSlug } from "@/lib/franchise-slug";
import { validateFranchiseSlugInput } from "@/lib/franchise-path";

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

    // Validate slug uniqueness and reserved names
    if (slug) {
      const checked = validateFranchiseSlugInput(String(slug));
      if (!checked.valid) return errorResponse(checked.error, 400);
      const resolved = await resolveFranchiseCreateSlug(checked.slug, f.name, BigInt(id));
      if ("error" in resolved) return errorResponse(resolved.error, 409);

      const updated = await prisma.franchise.update({
        where: { id: BigInt(id) },
        data: {
          slug: resolved.slug,
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
