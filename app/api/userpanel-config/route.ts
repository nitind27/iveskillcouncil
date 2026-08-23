import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StudentStatus, FranchiseStatus } from "@prisma/client";
import { defaultConfig } from "@/config/userpanel.config";
import { cache, USERPANEL_CONFIG_CACHE_KEY } from "@/lib/cache";
import type { UserPanelConfig, StatItem } from "@/config/userpanel.config";

export const dynamic = "force-dynamic";

const CACHE_TTL_MS = 45_000;

/** Fetch live counts from database for stats. */
async function getDynamicStats(): Promise<Record<string, number>> {
  const [coursesCount, enrollmentsCount, branchesCount] = await Promise.all([
    prisma.course.count(),
    prisma.student.count({ where: { status: StudentStatus.ACTIVE } }),
    prisma.franchise.count({ where: { status: FranchiseStatus.ACTIVE } }),
  ]);
  return {
    courses: coursesCount,
    enrollments: enrollmentsCount,
    branches: branchesCount,
    events: 0,
    offers: 0,
  };
}

function jsonConfig(config: UserPanelConfig, message: string) {
  return NextResponse.json(
    { success: true, data: config, message },
    {
      status: 200,
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    }
  );
}

export async function GET(_request: NextRequest) {
  try {
    const cached = cache.get<UserPanelConfig>(USERPANEL_CONFIG_CACHE_KEY);
    if (cached) {
      return jsonConfig(cached, "User panel config");
    }

    let row = await prisma.userPanelSetting.findUnique({
      where: { id: 1 },
    });

    if (!row) {
      row = await prisma.userPanelSetting.create({
        data: { id: 1, config: defaultConfig as unknown as object },
      });
    }

    const rawConfig: UserPanelConfig = row?.config
      ? (row.config as unknown as UserPanelConfig)
      : defaultConfig;

    const statsBase: StatItem[] =
      Array.isArray(rawConfig.stats) && rawConfig.stats.length > 0
        ? rawConfig.stats
        : defaultConfig.stats;

    const dbStats = await getDynamicStats();
    const offersCount = rawConfig.offers?.items?.length ?? 0;

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

    const config: UserPanelConfig = {
      ...rawConfig,
      hero: {
        ...rawConfig.hero,
        backgroundImage: defaultConfig.hero.backgroundImage,
        backgroundImages: defaultConfig.hero.backgroundImages,
      },
      stats: statsWithDynamicValues,
      courses: {
        ...rawConfig.courses,
        items: (rawConfig.courses?.items || []).filter(
          (c: { enabled?: boolean }) => c?.enabled !== false
        ),
      },
      testimonials: rawConfig.testimonials ?? defaultConfig.testimonials,
    };

    cache.set(USERPANEL_CONFIG_CACHE_KEY, config, CACHE_TTL_MS);
    return jsonConfig(config, "User panel config");
  } catch (err) {
    console.error("userpanel-config GET:", err);
    return jsonConfig(defaultConfig, "User panel config (default)");
  }
}
