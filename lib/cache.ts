// In-memory cache implementation (for development)
// For production, use Redis or similar distributed cache

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class Cache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private defaultTTL: number = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    const expiresAt = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expiresAt });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean expired entries periodically
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const cache = new Cache();

// Cleanup expired entries every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanup();
  }, 10 * 60 * 1000);
}

// Cache key generators
export const cacheKeys = {
  dashboard: (franchiseId?: number) => `dashboard:${franchiseId || 'all'}`,
  franchises: (page: number, limit: number) => `franchises:${page}:${limit}`,
  franchise: (id: number) => `franchise:${id}`,
  students: (franchiseId: number, page: number, limit: number) => 
    `students:${franchiseId}:${page}:${limit}`,
  courses: () => 'courses:all',
  course: (id: number) => `course:${id}`,
  attendance: (franchiseId: number, date: string) => 
    `attendance:${franchiseId}:${date}`,
  payments: (franchiseId: number, page: number, limit: number) => 
    `payments:${franchiseId}:${page}:${limit}`,
  certificates: (franchiseId: number, status: string) => 
    `certificates:${franchiseId}:${status}`,
  stats: (franchiseId?: number) => `stats:${franchiseId || 'all'}`,
};

