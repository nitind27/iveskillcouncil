import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/** GET: Check if email needs first-time setup. Query: ?email=xxx */
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email")?.trim()?.toLowerCase();
    if (!email) return errorResponse("Email is required", 400);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { mustChangePassword: true },
    });

    if (!user) return successResponse({ found: false, mustChangePassword: false });
    return successResponse({
      found: true,
      mustChangePassword: user.mustChangePassword ?? false,
    });
  } catch (err) {
    console.error("Check first time error:", err);
    return errorResponse("Failed to check", 500);
  }
}
