import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdminOrAdmin } from "@/lib/api-auth";
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
} from "@/lib/api-response";
import type { GlobalSettingsConfig } from "@/lib/global-settings-types";
import { DEFAULT_GLOBAL_CONFIG } from "@/lib/global-settings-types";

export const dynamic = "force-dynamic";

/** Deep merge: target keys overwrite; nested objects merged. */
function deepMerge(
  target: GlobalSettingsConfig,
  source: Partial<GlobalSettingsConfig>
): GlobalSettingsConfig {
  const out = { ...target };
  for (const key of Object.keys(source) as (keyof GlobalSettingsConfig)[]) {
    const val = source[key];
    if (val == null) continue;
    if (typeof val === "object" && !Array.isArray(val) && val !== null) {
      (out as any)[key] = deepMerge(
        (out as any)[key] || {},
        val as Record<string, unknown>
      );
    } else {
      (out as any)[key] = val;
    }
  }
  return out;
}

/** GET /api/settings/global - Get global settings (SUPER_ADMIN only). */
export async function GET() {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return unauthorizedResponse();

    const row = await prisma.globalSetting.findUnique({
      where: { id: 1 },
    });

    const config: GlobalSettingsConfig = row?.config
      ? deepMerge(DEFAULT_GLOBAL_CONFIG, row.config as GlobalSettingsConfig)
      : DEFAULT_GLOBAL_CONFIG;

    return successResponse(config, "Global settings");
  } catch (err) {
    console.error("GET /api/settings/global", err);
    return errorResponse("Failed to fetch global settings", 500);
  }
}

/** PUT /api/settings/global - Update global settings (SUPER_ADMIN only). */
export async function PUT(request: NextRequest) {
  try {
    const user = await requireSuperAdminOrAdmin();
    if (!user) return forbiddenResponse();

    const body = await request.json();
    if (!body || typeof body !== "object") {
      return errorResponse("Invalid body", 400);
    }

    const existing = await prisma.globalSetting.findUnique({
      where: { id: 1 },
    });

    const current = (existing?.config as GlobalSettingsConfig) || {};
    const merged = deepMerge(
      { ...DEFAULT_GLOBAL_CONFIG, ...current },
      body as Partial<GlobalSettingsConfig>
    );

    await prisma.globalSetting.upsert({
      where: { id: 1 },
      create: { id: 1, config: merged as object },
      update: { config: merged as object },
    });

    return successResponse(merged, "Global settings saved");
  } catch (err) {
    console.error("PUT /api/settings/global", err);
    return errorResponse("Failed to save global settings", 500);
  }
}
