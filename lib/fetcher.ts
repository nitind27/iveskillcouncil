/**
 * Default fetcher for SWR: GET with credentials.
 * Returns data from API response (response.data); throws on !res.ok.
 */
export async function fetcher<T = unknown>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: "include" });
  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json?.error || json?.message || "Request failed") as Error & { status?: number };
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
  const res = await fetch(url, { credentials: "include" });
  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json?.error || json?.message || "Request failed") as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return {
    data: (json?.data ?? json) as T,
    pagination: json?.pagination,
  };
}
