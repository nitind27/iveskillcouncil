import { NextRequest } from "next/server";
import { cache } from "@/lib/cache";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";
import { getCurrentUser } from "@/lib/api-auth";
import { ROLES } from "@/lib/permissions";
import { getCourseFeeSummary } from "@/lib/course-fee-summary";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const isAdmin = user.roleId === ROLES.SUPER_ADMIN || user.roleId === ROLES.ADMIN;
    if (!isAdmin && user.roleId !== ROLES.SUB_ADMIN) {
      return errorResponse("You do not have access to course fee details.", 403);
    }

    let franchiseId = request.nextUrl.searchParams.get("franchiseId") || null;
    if (!isAdmin) {
      if (!user.franchiseId) return errorResponse("No franchise linked to this account.", 403);
      franchiseId = user.franchiseId;
    }
    if (franchiseId && !/^\d+$/.test(franchiseId)) return errorResponse("Invalid franchise.", 400);

    const cacheKey = `dashboard:course-fees:${franchiseId || "all"}`;
    const cached = cache.get(cacheKey);
    if (cached) return successResponse(cached);

    const summary = await getCourseFeeSummary(franchiseId);
    cache.set(cacheKey, summary, 2 * 60 * 1000);
    return successResponse(summary);
  } catch (error) {
    console.error("Course fee summary error:", error);
    return errorResponse("Failed to load course fees", 500);
  }
}
