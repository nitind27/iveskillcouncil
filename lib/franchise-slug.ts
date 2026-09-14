import { prisma } from "@/lib/prisma";
import { isReservedPathSegment, sanitizeFranchiseSlug, validateFranchiseSlugInput } from "@/lib/franchise-path";

export async function allocateFranchiseSlug(source: string, excludeId?: bigint): Promise<string> {
  let base = sanitizeFranchiseSlug(source);
  if (!base) base = "franchise";
  if (isReservedPathSegment(base)) base = `fr${base}`.slice(0, 80);

  let candidate = base;
  let n = 2;
  while (n < 200) {
    const existing = await prisma.franchise.findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return candidate;
    candidate = `${base}${n}`.slice(0, 80);
    n += 1;
  }
  return `${base}${Date.now().toString(36)}`.slice(0, 80);
}

/** Explicit slug from admin, or auto from franchise name. */
export async function resolveFranchiseCreateSlug(
  requested: unknown,
  name: string,
  excludeId?: bigint
): Promise<{ slug: string } | { error: string }> {
  const raw = typeof requested === "string" ? requested.trim() : "";
  if (raw) {
    const checked = validateFranchiseSlugInput(raw);
    if (!checked.valid) return { error: checked.error };
    const conflict = await prisma.franchise.findFirst({
      where: {
        slug: checked.slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (conflict) return { error: "This portal URL is already taken by another franchise." };
    return { slug: checked.slug };
  }
  return { slug: await allocateFranchiseSlug(name, excludeId) };
}
