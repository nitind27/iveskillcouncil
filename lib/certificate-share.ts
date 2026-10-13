import jwt from "jsonwebtoken";

export const SHARE_COOKIE = "certShare";
export const MAX_SHARE_STUDENTS = 100;
export const SHARE_KINDS = ["both", "certificate", "result"] as const;
export type ShareKind = (typeof SHARE_KINDS)[number];

const SECRET = process.env.JWT_ACCESS_SECRET || "";

export function parseShareKind(value: unknown): ShareKind | null {
  return value === "both" || value === "certificate" || value === "result" ? value : null;
}

export function parseShareStudentIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const item of value) {
    const id = String(item ?? "").trim();
    if (!/^\d+$/.test(id) || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= MAX_SHARE_STUDENTS) break;
  }
  return ids;
}

export function normalizeShareUsername(value: unknown): string | null {
  const username = String(value ?? "").trim().toLowerCase();
  if (!/^[a-z0-9._-]{3,40}$/.test(username)) return null;
  return username;
}

export function shareTokenOk(token: string) {
  return /^[A-Za-z0-9_-]{16,64}$/.test(token);
}

export function signShareAccess(token: string) {
  if (!SECRET || SECRET === "your-access-token-secret-change-in-production") {
    throw new Error("JWT_ACCESS_SECRET is not configured");
  }
  return jwt.sign({ purpose: "cert-share", token }, SECRET, { expiresIn: "12h" });
}

export function readShareAccess(cookie: string | undefined, token: string) {
  if (!cookie || !SECRET) return false;
  try {
    const payload = jwt.verify(cookie, SECRET) as { purpose?: string; token?: string };
    return payload.purpose === "cert-share" && payload.token === token;
  } catch {
    return false;
  }
}
