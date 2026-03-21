import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { requireSuperAdminOrAdmin } from "@/lib/api-auth";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

/** GET: List franchise inquiries. Super admin only. */
export async function GET(request: NextRequest) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return unauthorizedResponse();

    const list = await prisma.franchiseInquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const data = list.map((r) => ({
      id: String(r.id),
      fullName: r.fullName,
      email: r.email,
      phone: r.phone,
      city: r.city,
      state: r.state,
      investmentRange: r.investmentRange,
      message: r.message,
      franchiseId: r.franchiseId,
      franchiseName: r.franchiseName,
      createdAt: r.createdAt.toISOString(),
    }));

    return successResponse({ enquiries: data }, "Franchise enquiries retrieved");
  } catch (error: unknown) {
    console.error("Franchise enquiries API error:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
      return errorResponse(
        "Database table `franchise_inquiries` is missing.",
        503
      );
    }
    return errorResponse(
      error instanceof Error ? error.message : "Failed to fetch franchise enquiries",
      500
    );
  }
}
