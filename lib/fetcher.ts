/**
 * Default fetcher for SWR: GET with credentials.
 * On 401, silently refreshes session once and retries — avoids accidental logout on page data loads.
 * On 503 (DB proxy down), retries with backoff instead of failing immediately.
 */
import { fetchWithDbRetry, refreshSession } from "@/lib/session-client";

async function fetchJson(url: string) {
  const res = await fetchWithDbRetry(url, { credentials: "include" }, { retries: 3, baseDelayMs: 500 });
  let json: Record<string, unknown>;
  try {
    json = await res.json();
  } catch {
    if (!res.ok) throw Object.assign(new Error(`Request failed (${res.status})`), { status: res.status });
    throw new Error("Invalid response from server");
  }
  return { res, json };
}

export async function fetcher<T = unknown>(url: string): Promise<T> {
  let { res, json } = await fetchJson(url);

  if (res.status === 401) {
    const ok = await refreshSession();
    if (ok) {
      ({ res, json } = await fetchJson(url));
    }
  }

  if (!res.ok) {
    const err = new Error(String(json?.error ?? json?.message ?? "Request failed")) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return (json?.data ?? json) as T;
}

/**
 * Fetcher for list APIs that return { data, pagination }.
 */
export async function fetcherWithPagination<T = unknown>(
  url: string
): Promise<{ data: T; pagination?: { page: number; limit: number; total: number; totalPages: number } }> {
  let { res, json } = await fetchJson(url);

  if (res.status === 401) {
    const ok = await refreshSession();
    if (ok) {
      ({ res, json } = await fetchJson(url));
    }
  }

  if (!res.ok) {
    const err = new Error(String(json?.error ?? json?.message ?? "Request failed")) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }

  return {
    data: (json?.data ?? json) as T,
    pagination: json?.pagination as { page: number; limit: number; total: number; totalPages: number } | undefined,
  };
}
