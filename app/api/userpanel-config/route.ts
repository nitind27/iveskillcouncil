import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { defaultConfig } from "@/config/userpanel.config";
import { successResponse, errorResponse } from "@/lib/api-response";
import type { UserPanelConfig } from "@/config/userpanel.config";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Ensure config exists in DB (dynamic source of truth)
    const row = await prisma.userPanelSetting.upsert({
      where: { id: 1 },
      create: { id: 1, config: defaultConfig as unknown as object },
      update: {},
    });

    const rawConfig: UserPanelConfig = row?.config
      ? (row.config as unknown as UserPanelConfig)
      : defaultConfig;

    // User-side visibility: hide courses where enabled === false
    const config: UserPanelConfig = {
      ...rawConfig,
      courses: {
        ...rawConfig.courses,
        items: (rawConfig.courses?.items || []).filter((c: any) => c?.enabled !== false),
      },
    };

    return successResponse(config, "User panel config");
  } catch (err) {
    console.error("userpanel-config GET:", err);
    return successResponse(defaultConfig, "User panel config (default)");
  }
}
