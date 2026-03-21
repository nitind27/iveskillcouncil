import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { StudentStatus, FranchiseStatus } from "@prisma/client";
import { defaultConfig } from "@/config/userpanel.config";
import { successResponse } from "@/lib/api-response";
import type { UserPanelConfig, StatItem } from "@/config/userpanel.config";

export const dynamic = "force-dynamic";

/** Fetch live counts from database for stats. */
async function getDynamicStats(): Promise<Record<string, number>> {
  const [coursesCount, enrollmentsCount, branchesCount] = await Promise.all([
    prisma.course.count(), // Total courses (all statuses)
    prisma.student.count({ where: { status: StudentStatus.ACTIVE } }),
    prisma.franchise.count({ where: { status: FranchiseStatus.ACTIVE } }),
  ]);
  return {
    courses: coursesCount,
    enrollments: enrollmentsCount,
    branches: branchesCount,
    events: 0, // No Event model yet
    offers: 0, // Will use config.offers.items.length below
  };
}

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

    // Use default stats structure if DB config has empty/missing stats
    const statsBase: StatItem[] =
      Array.isArray(rawConfig.stats) && rawConfig.stats.length > 0
        ? rawConfig.stats
        : defaultConfig.stats;

    // Fetch dynamic counts from database
    const dbStats = await getDynamicStats();
    const offersCount = rawConfig.offers?.items?.length ?? 0;

    // Override stat values with database counts (keep label, iconKey, colorClass from config)
    const statsWithDynamicValues: StatItem[] = statsBase.map((stat) => {
      const dbValue = dbStats[stat.iconKey];
      const value =
        stat.iconKey === "offers"
          ? offersCount
          : typeof dbValue === "number"
            ? dbValue
            : stat.value;
      return { ...stat, value };
    });

    // User-side visibility: hide courses where enabled === false; ensure testimonials
    const config: UserPanelConfig = {
      ...rawConfig,
      stats: statsWithDynamicValues,
      courses: {
        ...rawConfig.courses,
        items: (rawConfig.courses?.items || []).filter((c: { enabled?: boolean }) => c?.enabled !== false),
      },
      testimonials: rawConfig.testimonials ?? defaultConfig.testimonials,
    };

    return successResponse(config, "User panel config");
  } catch (err) {
    console.error("userpanel-config GET:", err);
    return successResponse(defaultConfig, "User panel config (default)");
  }
}
