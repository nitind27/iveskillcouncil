import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { requireSuperAdminOrAdmin } from "@/lib/api-auth";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

/** GET: List offer applications. Super admin only. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return unauthorizedResponse();

    // Safety: model may be undefined if prisma generate wasn't run after adding OfferApplication
    const model = (prisma as { offerApplication?: { findMany: (opts: object) => Promise<unknown[]> } }).offerApplication;
    if (!model) {
      return successResponse({ applications: [] }, "Run 'npx prisma generate' and create offer_applications table.");
    }

    const list = (await model.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    })) as { id: bigint; fullName: string; email: string; phone: string; offerId: string; offerTitle: string; message: string | null; createdAt: Date }[];

    const data = list.map((r) => ({
      id: String(r.id),
      fullName: r.fullName,
      email: r.email,
      phone: r.phone,
      offerId: r.offerId,
      offerTitle: r.offerTitle,
      message: r.message,
      createdAt: r.createdAt.toISOString(),
    }));

    return successResponse({ applications: data }, "Offer applications retrieved");
  } catch (error: unknown) {
    console.error("Offer applications API error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return errorResponse(
        "Database table `offer_applications` is missing. Run migrations.",
        503
      );
    }
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch offer applications",
      500
    );
  }
}
