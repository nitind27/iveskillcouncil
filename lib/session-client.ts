/**
 * Client-only session helpers (no React) — used by AuthContext + SWR fetcher.
 */

export type RefreshResult = "ok" | "unauthorized" | "unavailable" | "error";

let refreshPromise: Promise<RefreshResult> | null = null;

/** Refresh access token using httpOnly refresh cookie. Dedupes parallel calls. */
export async function refreshSessionDetailed(): Promise<RefreshResult> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async (): Promise<RefreshResult> => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) return "ok";
      if (res.status === 503) return "unavailable";
      if (res.status === 401 || res.status === 403) return "unauthorized";
      return "error";
    } catch {
      return "error";
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function refreshSession(): Promise<boolean> {
  return (await refreshSessionDetailed()) === "ok";
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Retry fetch when DB proxy is still starting (503). */
export async function fetchWithDbRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: { retries?: number; baseDelayMs?: number }
): Promise<Response> {
  const retries = options?.retries ?? 5;
  const baseDelayMs = options?.baseDelayMs ?? 500;
  let last: Response | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(input, init);
      last = res;
      if (res.status !== 503 || attempt === retries) return res;
      await sleep(baseDelayMs * Math.pow(2, attempt));
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(baseDelayMs * Math.pow(2, attempt));
    }
  }

  return last!;
}
