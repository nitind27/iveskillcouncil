import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { successResponse, unauthorizedResponse, errorResponse } from "@/lib/api-response";
import { getUserFromToken } from "@/lib/auth";
import { PERMISSION_KEYS, PERMISSION_LABELS } from "@/lib/permissions";

export const dynamic = "force-dynamic";

/** Ensure all permissions from lib exist in DB (sync on first load if empty). */
async function ensurePermissionsExist() {
  const count = await prisma.permission.count();
  if (count > 0) return;
  for (const key of PERMISSION_KEYS) {
    const { label, module } = PERMISSION_LABELS[key];
    await prisma.permission.upsert({
      where: { key },
      update: { label, module },
      create: { key, label, module },
    });
  }
}

/** GET /api/permissions - List all permissions. Syncs from lib if DB is empty. */
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get("accessToken")?.value;
    if (!token) return unauthorizedResponse();

    const user = await getUserFromToken(token);
    if (!user) return unauthorizedResponse();

    await ensurePermissionsExist();

    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { key: "asc" }],
    });
    return successResponse(permissions);
  } catch (e) {
    console.error("GET /api/permissions", e);
    return errorResponse("Failed to fetch permissions", 500);
  }
}
