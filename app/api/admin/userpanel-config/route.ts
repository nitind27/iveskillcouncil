import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getUserFromToken } from "@/lib/auth";
import { defaultConfig } from "@/config/userpanel.config";
import { ROLES } from "@/lib/permissions";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
} from "@/lib/api-response";
import type { UserPanelConfig } from "@/config/userpanel.config";
import path from "path";
import { promises as fs } from "fs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WELCOME_PUBLIC_PREFIX = "/uploads/userpanel/welcome/";
const HERO_PUBLIC_PREFIX = "/uploads/userpanel/hero/";

function isLocalWelcomeUrl(url: unknown): url is string {
  return typeof url === "string" && url.startsWith(WELCOME_PUBLIC_PREFIX);
}

function isLocalHeroUrl(url: unknown): url is string {
  return typeof url === "string" && url.startsWith(HERO_PUBLIC_PREFIX);
}

async function safeUnlink(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch {
    // ignore
  }
}

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  if (!token) return null;
  return getUserFromToken(token);
}

export async function GET(request: NextRequest) {
  try {
    const row = await prisma.userPanelSetting.findUnique({
      where: { id: 1 },
    });
    const config: UserPanelConfig = row?.config
      ? (row.config as unknown as UserPanelConfig)
      : defaultConfig;
    return successResponse(config, "User panel config");
  } catch (err) {
    console.error("admin userpanel-config GET:", err);
    return successResponse(defaultConfig, "User panel config (default)");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user || (Number(user.roleId) !== ROLES.SUPER_ADMIN && Number(user.roleId) !== ROLES.ADMIN)) {
      return unauthorizedResponse();
    }

    const body = await request.json();
    const config = body as UserPanelConfig;

    if (!config || typeof config !== "object") {
      return errorResponse("Invalid config", 400);
    }

    // Cleanup: if welcome popup image changed, delete old local upload.
    const existing = await prisma.userPanelSetting.findUnique({
      where: { id: 1 },
    });
    const prevConfig = (existing?.config ?? null) as any;
    const prevWelcomeUrl = prevConfig?.welcomePopup?.imageUrl as unknown;
    const nextWelcomeUrl = (config as any)?.welcomePopup?.imageUrl as unknown;

    if (isLocalWelcomeUrl(prevWelcomeUrl) && prevWelcomeUrl !== nextWelcomeUrl) {
      const oldAbs = path.join(process.cwd(), "public", prevWelcomeUrl.replace(/^\//, ""));
      await safeUnlink(oldAbs);
    }

    // Cleanup: if hero images changed, delete old local uploads that are no longer referenced.
    const prevHeroImagesRaw = Array.isArray(prevConfig?.hero?.backgroundImages)
      ? (prevConfig.hero.backgroundImages as unknown[])
      : prevConfig?.hero?.backgroundImage
        ? [prevConfig.hero.backgroundImage]
        : [];
    const nextHeroImagesRaw = Array.isArray((config as any)?.hero?.backgroundImages)
      ? ((config as any).hero.backgroundImages as unknown[])
      : (config as any)?.hero?.backgroundImage
        ? [(config as any).hero.backgroundImage]
        : [];

    const prevHeroLocal = prevHeroImagesRaw.filter(isLocalHeroUrl);
    const nextHeroUrlsSet = new Set(nextHeroImagesRaw.filter(isLocalHeroUrl) as string[]);

    for (const oldUrl of prevHeroLocal) {
      if (nextHeroUrlsSet.has(oldUrl)) continue;
      const oldAbs = path.join(process.cwd(), "public", oldUrl.replace(/^\//, ""));
      await safeUnlink(oldAbs);
    }

    await prisma.userPanelSetting.upsert({
      where: { id: 1 },
      create: { id: 1, config: config as object },
      update: { config: config as object },
    });

    return successResponse(config, "User panel config saved");
  } catch (err) {
    console.error("admin userpanel-config PUT:", err);
    return errorResponse("Failed to save config", 500);
  }
}
