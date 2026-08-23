import { resolveIndianStateName } from "@/lib/i18n/resolve-state";

export type StateDetectSource = "franchise" | "ip" | "geolocation" | "stored" | "manual";

interface DetectResult {
  state: string;
  source: StateDetectSource;
}

async function detectFromIp(): Promise<string | null> {
  try {
    const res = await fetch("/api/geo/state", { credentials: "same-origin" });
    if (!res.ok) return null;
    const json = await res.json();
    const raw = json?.data?.state as string | null | undefined;
    return resolveIndianStateName(raw);
  } catch {
    return null;
  }
}

async function detectFromGeolocation(): Promise<string | null> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) return null;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const url = new URL("https://nominatim.openstreetmap.org/reverse");
          url.searchParams.set("lat", String(latitude));
          url.searchParams.set("lon", String(longitude));
          url.searchParams.set("format", "json");
          url.searchParams.set("addressdetails", "1");

          const res = await fetch(url.toString(), {
            headers: { Accept: "application/json" },
          });
          if (!res.ok) {
            resolve(null);
            return;
          }
          const data = (await res.json()) as {
            address?: { state?: string; state_district?: string; region?: string };
          };
          const raw = data.address?.state ?? data.address?.state_district ?? data.address?.region;
          resolve(resolveIndianStateName(raw));
        } catch {
          resolve(null);
        }
      },
      () => resolve(null),
      { timeout: 8000, maximumAge: 300_000, enableHighAccuracy: false }
    );
  });
}

/** Auto-detect state: IP first, then optional browser geolocation */
export async function autoDetectIndianState(options?: {
  tryGeolocation?: boolean;
}): Promise<DetectResult | null> {
  const fromIp = await detectFromIp();
  if (fromIp) return { state: fromIp, source: "ip" };

  if (options?.tryGeolocation) {
    const fromGeo = await detectFromGeolocation();
    if (fromGeo) return { state: fromGeo, source: "geolocation" };
  }

  return null;
}
