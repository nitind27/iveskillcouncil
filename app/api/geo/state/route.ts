import { NextRequest } from "next/server";
import { successResponse, errorResponse } from "@/lib/api-response";
import { resolveIndianStateName } from "@/lib/i18n/resolve-state";

export const dynamic = "force-dynamic";

function getClientIp(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;
  return null;
}

/** GET /api/geo/state — detect Indian state from client IP (production) */
export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    if (!ip || ip === "127.0.0.1" || ip === "::1" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
      return successResponse({ state: null, source: "local" }, "Local network — use browser location or manual selection");
    }

    const res = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,regionName,region`,
      { next: { revalidate: 3600 } }
    );

    if (!res.ok) {
      return errorResponse("Location service unavailable", 502);
    }

    const data = (await res.json()) as {
      status?: string;
      country?: string;
      countryCode?: string;
      regionName?: string;
      region?: string;
    };

    if (data.status !== "success" || data.countryCode !== "IN") {
      return successResponse({ state: null, source: "ip", country: data.country ?? null }, "Outside India or unknown");
    }

    const resolved =
      resolveIndianStateName(data.regionName) ?? resolveIndianStateName(data.region);

    return successResponse(
      { state: resolved, source: "ip", regionName: data.regionName ?? data.region ?? null },
      resolved ? "State detected" : "Could not map region to state"
    );
  } catch (e) {
    console.error("Geo state detection error:", e);
    return errorResponse("Failed to detect state", 500);
  }
}
