// Simple in-memory rate limiter
// For production, use Redis or similar distributed rate limiter

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup expired entries every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  check(identifier: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.limits.get(identifier);

    if (!entry || now > entry.resetAt) {
      // Create new entry
      this.limits.set(identifier, {
        count: 1,
        resetAt: now + windowMs,
      });
      return true;
    }

    if (entry.count >= maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  }

  getRemaining(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry) return 0;
    return Math.max(0, entry.count);
  }

  getResetTime(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry) return Date.now();
    return entry.resetAt;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now > entry.resetAt) {
        this.limits.delete(key);
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.limits.clear();
  }
}

export const rateLimiter = new RateLimiter();

// Rate limit configurations
export const rateLimitConfig = {
  // General API routes
  api: {
    maxRequests: 100,
    windowMs: 15 * 60 * 1000, // 15 minutes
  },
  // Password login — per IP (generous for legitimate retries)
  login: {
    maxRequests: 25,
    windowMs: 15 * 60 * 1000,
  },
  // OTP / forgot-password / reset — stricter but separate bucket
  auth: {
    maxRequests: 12,
    windowMs: 15 * 60 * 1000,
  },
  // Session refresh — must stay generous so keep-alive never logs users out
  authRefresh: {
    maxRequests: 60,
    windowMs: 15 * 60 * 1000,
  },
  // Search/query routes
  search: {
    maxRequests: 30,
    windowMs: 1 * 60 * 1000, // 1 minute
  },
};

/** Scoped key so login, OTP, forgot-password do not share one 5-request bucket */
export function rateLimitKey(scope: string, request: Request): string {
  return `${scope}:${getClientIdentifier(request)}`;
}

// Helper function to get client identifier (works behind Nginx / Cloudflare)
export function getClientIdentifier(request: Request): string {
  const headers = request.headers;
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const ip = forwarded.split(",")[0]?.trim();
    if (ip) return ip;
  }
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const cfIp = headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;
  return "unknown";
}

