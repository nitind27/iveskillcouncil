import { PaginationParams, PaginatedResponse } from "./types";

/**
 * Server-side pagination utility
 * Optimized for large datasets (100,000+ records)
 */
export function paginateData<T>(
  data: T[],
  params: PaginationParams
): PaginatedResponse<T> {
  const { page, pageSize, sortBy, sortOrder = "asc", search } = params;

  // Filter data if search is provided
  let filteredData = data;
  if (search && search.trim()) {
    const searchLower = search.toLowerCase();
    filteredData = data.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(searchLower)
    );
  }

  // Sort data if sortBy is provided
  if (sortBy) {
    filteredData = [...filteredData].sort((a, b) => {
      const aValue = (a as any)[sortBy];
      const bValue = (b as any)[sortBy];

      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      const comparison = String(aValue).localeCompare(String(bValue));
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }

  // Calculate pagination
  const total = filteredData.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  // Get paginated data
  const paginatedData = filteredData.slice(start, end);

  return {
    data: paginatedData,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

/**
 * Generate cache key for API requests
 */
export function generateCacheKey(endpoint: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return `${endpoint}?${sortedParams}`;
}

/**
 * Validate pagination parameters
 */
export function validatePaginationParams(params: {
  page?: number;
  pageSize?: number;
}): PaginationParams {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 10));

  return {
    page,
    pageSize,
  };
}

