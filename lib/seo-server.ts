import { cache, PUBLIC_SEO_CACHE_KEY } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import { normalizeSeo, type SeoConfig } from "@/lib/seo";

const CACHE_TTL_MS = 45_000;

export async function loadSeoConfig(): Promise<SeoConfig> {
  const hit = cache.get<SeoConfig>(PUBLIC_SEO_CACHE_KEY);
  if (hit) return hit;

  try {
    const row = await prisma.userPanelSetting.findUnique({
      where: { id: 1 },
      select: { config: true },
    });
    const stored = row?.config;
    const raw =
      stored && typeof stored === "object" && !Array.isArray(stored)
        ? (stored as { seo?: unknown }).seo
        : null;
    const seo = normalizeSeo(raw);
    cache.set(PUBLIC_SEO_CACHE_KEY, seo, CACHE_TTL_MS);
    return seo;
  } catch (err) {
    console.error("loadSeoConfig:", err);
    return normalizeSeo(null);
  }
}
