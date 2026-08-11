/**
 * SWR global config: cache + revalidate on focus for fast UX.
 * - dedupingInterval: same key won't refetch within 2s
 * - revalidateOnFocus: refetch when tab gets focus (can set false for less traffic)
 * - revalidateIfStale: show cache first, revalidate if stale
 */
import type { SWRConfiguration } from "swr";

export const swrConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateIfStale: true,
  dedupingInterval: 10000,
  errorRetryCount: 2,
  keepPreviousData: true,
};
