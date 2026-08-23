/** Shared course helpers */

export function slugifyCourseName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 150);
}

export function serializeCourse(c: {
  id: bigint;
  name: string;
  slug?: string | null;
  description?: string | null;
  shortDescription?: string | null;
  imageUrl?: string | null;
  type: string;
  category?: string | null;
  level?: string | null;
  mode?: string | null;
  baseFee: unknown;
  durationMonths: number;
  lectures?: number | null;
  videos?: number | null;
  notes?: string | null;
  highlights?: string | null;
  status?: string;
  franchiseId?: bigint | null;
}) {
  return {
    id: c.id.toString(),
    name: c.name,
    slug: c.slug ?? null,
    description: c.description ?? null,
    shortDescription: c.shortDescription ?? null,
    imageUrl: c.imageUrl ?? null,
    type: c.type,
    category: c.category ?? null,
    level: c.level ?? "BEGINNER",
    mode: c.mode ?? "OFFLINE",
    baseFee: Number(c.baseFee),
    durationMonths: c.durationMonths,
    lectures: c.lectures ?? 0,
    videos: c.videos ?? 0,
    notes: c.notes ?? null,
    highlights: c.highlights ?? null,
    status: c.status ?? "ACTIVE",
    franchiseId: c.franchiseId?.toString() ?? null,
  };
}

export function parseHighlights(raw: unknown): string | null {
  if (raw == null) return null;
  if (Array.isArray(raw)) {
    const lines = raw.map((x) => String(x).trim()).filter(Boolean);
    return lines.length ? lines.join("\n") : null;
  }
  const s = String(raw).trim();
  return s || null;
}
