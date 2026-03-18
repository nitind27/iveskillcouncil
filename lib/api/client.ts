"use client";

import { PaginationParams, PaginatedResponse, ApiResponse } from "./types";

const API_BASE_URL = "/api";

/**
 * Client-side API client for data fetching
 * Optimized with caching and request deduplication
 */
class ApiClient {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_TTL = 60000; // 1 minute

  private async fetchWithCache<T>(
    url: string,
    options?: RequestInit
  ): Promise<T> {
    const cacheKey = `${url}-${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });

    return data;
  }

  async getData<T>(
    endpoint: string,
    params?: PaginationParams
  ): Promise<PaginatedResponse<T>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      searchParams.set("page", params.page.toString());
      searchParams.set("pageSize", params.pageSize.toString());
      if (params.sortBy) searchParams.set("sortBy", params.sortBy);
      if (params.sortOrder) searchParams.set("sortOrder", params.sortOrder);
      if (params.search) searchParams.set("search", params.search);
    }

    const url = `${API_BASE_URL}${endpoint}?${searchParams.toString()}`;
    const response = await this.fetchWithCache<ApiResponse<PaginatedResponse<T>>>(url);

    if (!response.success || !response.data) {
      throw new Error(response.error || "Failed to fetch data");
    }

    return response.data;
  }

  clearCache() {
    this.cache.clear();
  }
}

export const apiClient = new ApiClient();

