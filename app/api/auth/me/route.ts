import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

async function getAuthUser() {
  const cookieStore = cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return null;
  return getUserFromToken(token);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorizedResponse();
    return successResponse(user, "User retrieved successfully");
  } catch (err: unknown) {
    console.error("Get user error:", err);
    return unauthorizedResponse();
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return unauthorizedResponse();

    const body = await request.json();
    const { fullName, email, phone } = body;

    const updates: { fullName?: string; email?: string; phone?: string | null } = {};
    if (typeof fullName === "string" && fullName.trim()) updates.fullName = fullName.trim();
    if (typeof email === "string" && email.trim()) {
      const existing = await prisma.user.findFirst({
        where: { email: email.trim(), id: { not: BigInt(user.id) } },
      });
      if (existing) return errorResponse("Email already in use", 400);
      updates.email = email.trim();
    }
    if (phone !== undefined) updates.phone = typeof phone === "string" ? (phone.trim() || null) : null;

    if (Object.keys(updates).length === 0) {
      return successResponse(user, "No changes");
    }

    await prisma.user.update({
      where: { id: BigInt(user.id) },
      data: updates,
    });

    const cookieStore = cookies();
    const token = cookieStore.get("accessToken")?.value;
    const updated = token ? await getUserFromToken(token) : null;
    return successResponse(updated ?? { ...user, ...updates }, "Profile updated");
  } catch (err: unknown) {
    console.error("Patch profile error:", err);
    return errorResponse("Failed to update profile", 500);
  }
}

