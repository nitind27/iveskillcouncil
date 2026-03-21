import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/api-auth";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { successResponse, errorResponse, unauthorizedResponse } from "@/lib/api-response";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return unauthorizedResponse();

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return errorResponse("Current password and new password are required", 400);
    }

    if (newPassword.length < 8) {
      return errorResponse("New password must be at least 8 characters", 400);
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: BigInt(user.id) },
    });

    if (!dbUser) return errorResponse("User not found", 404);

    const isValid = await verifyPassword(currentPassword, dbUser.password);
    if (!isValid) {
      return errorResponse("Current password is incorrect", 400);
    }

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({
      where: { id: BigInt(user.id) },
      data: { password: hashed },
    });

    return successResponse(null, "Password changed successfully");
  } catch (err: unknown) {
    console.error("Change password error:", err);
    return errorResponse("Failed to change password", 500);
  }
}
