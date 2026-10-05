import { headers } from "next/headers";

/** Public site origin from env. Used when there is no incoming request host. */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  return "https://ivesdc.org";
}

/**
 * Origin of the request Google (or a visitor) actually used.
 * A live domain wins over a localhost value in NEXT_PUBLIC_APP_URL.
 */
export function getRequestSiteUrl(): string {
  try {
    const h = headers();
    const host = (h.get("x-forwarded-host") || h.get("host") || "").split(",")[0].trim();
    if (host && !/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host)) {
      const proto = (h.get("x-forwarded-proto") || "https").split(",")[0].trim();
      return `${proto}://${host}`;
    }
  } catch {
    // headers() is only available during a request
  }
  return getSiteUrl();
}
