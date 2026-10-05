import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { StudentStatus, FranchiseStatus } from "@prisma/client";
import { defaultConfig, resolveGalleryImages } from "@/config/userpanel.config";
import { normalizeSeo } from "@/lib/seo";
import { cache, USERPANEL_CONFIG_CACHE_KEY } from "@/lib/cache";
import type { UserPanelConfig, StatItem, PublicNotice } from "@/config/userpanel.config";

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

function publicNotices(raw: unknown): PublicNotice[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is PublicNotice => {
      if (!item || typeof item !== "object") return false;
      const notice = item as PublicNotice;
      return notice.active !== false && typeof notice.title === "string" && notice.title.trim().length > 0 && typeof notice.message === "string";
    })
    .map((notice) => ({
      id: String(notice.id || notice.createdAt || notice.title),
      title: notice.title.trim(),
      message: notice.message.trim(),
      pdfUrl: typeof notice.pdfUrl === "string" && notice.pdfUrl.startsWith("/uploads/userpanel/notices/") ? notice.pdfUrl : null,
      active: true,
      createdAt: typeof notice.createdAt === "string" ? notice.createdAt : new Date().toISOString(),
    }))
    .slice(0, 20);
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

    const savedHeroImages = (
      Array.isArray(rawConfig.hero?.backgroundImages) && rawConfig.hero.backgroundImages.length > 0
        ? rawConfig.hero.backgroundImages
        : rawConfig.hero?.backgroundImage
          ? [rawConfig.hero.backgroundImage]
          : []
    ).filter((src): src is string => typeof src === "string" && src.trim().length > 0);
    const heroImages = savedHeroImages.length > 0 ? savedHeroImages : defaultConfig.hero.backgroundImages ?? [];

    const config: UserPanelConfig = {
      ...rawConfig,
      hero: {
        ...defaultConfig.hero,
        ...rawConfig.hero,
        backgroundImage: heroImages[0] ?? defaultConfig.hero.backgroundImage,
        backgroundImages: heroImages,
      },
      stats: statsWithDynamicValues,
      courses: {
        ...rawConfig.courses,
        items: (rawConfig.courses?.items || []).filter(
          (c: { enabled?: boolean }) => c?.enabled !== false
        ),
      },
      gallery: {
        ...defaultConfig.gallery,
        ...rawConfig.gallery,
        images: resolveGalleryImages(rawConfig.gallery?.images),
      },
      testimonials: rawConfig.testimonials ?? defaultConfig.testimonials,
      notices: publicNotices(rawConfig.notices),
      seo: normalizeSeo(rawConfig.seo),
    };

    cache.set(USERPANEL_CONFIG_CACHE_KEY, config, CACHE_TTL_MS);
    return jsonConfig(config, "User panel config");
  } catch (err) {
    console.error("userpanel-config GET:", err);
    return jsonConfig(defaultConfig, "User panel config (default)");
  }
}
