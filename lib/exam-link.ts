import { randomBytes } from "crypto";

export function generateExamLinkToken(): string {
  return randomBytes(24).toString("hex");
}

export function generateAttemptAccessKey(): string {
  return randomBytes(32).toString("hex");
}

export function normalizeEnrollment(raw: string): string {
  return raw.trim().replace(/\s+/g, " ").toUpperCase();
}

export function examLinkPath(token: string): string {
  return `/exam-link/${token}`;
}

export function examLinkAbsoluteUrl(token: string, origin?: string): string {
  const base =
    origin ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base.replace(/\/$/, "")}${examLinkPath(token)}`;
}
