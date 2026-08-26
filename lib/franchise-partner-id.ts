/** Partner ID format matching IVESDC cards: IVESDCFP25001 */

export function buildFranchisePartnerId(
  franchiseId: string | number,
  issueDate?: string | Date | null
): string {
  const d = issueDate ? new Date(issueDate) : new Date();
  const yy = Number.isFinite(d.getTime())
    ? String(d.getFullYear()).slice(-2)
    : String(new Date().getFullYear()).slice(-2);
  const n = String(franchiseId).replace(/\D/g, "") || "0";
  const padded = n.padStart(3, "0").slice(-3);
  return `IVESDCFP${yy}${padded}`;
}

export function formatIdCardDate(value?: string | Date | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export function franchiseLocationLine(parts: {
  city?: string | null;
  state?: string | null;
  address?: string | null;
}): string {
  const loc = [parts.city, parts.state].filter(Boolean).join(", ");
  if (loc) return loc;
  return parts.address?.trim() || "—";
}

export function findFranchiseDocUrl(
  documents: Array<{ key?: string; url?: string; label?: string; name?: string }> | null | undefined,
  keys: string[]
): string | null {
  if (!Array.isArray(documents)) return null;
  const lower = keys.map((k) => k.toLowerCase());
  const hit = documents.find((d) => {
    const k = (d.key || d.label || d.name || "").toLowerCase();
    return lower.some((x) => k.includes(x));
  });
  return hit?.url || null;
}
