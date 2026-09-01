import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// 🛡️ ZERO-TRUST RATE LIMITING CONFIGURATION

const hasRedisEnv =
  Boolean(process.env.UPSTASH_REDIS_REST_URL) &&
  Boolean(process.env.UPSTASH_REDIS_REST_TOKEN);

let redis: Redis | null = null;

if (hasRedisEnv) {
  try {
    redis = Redis.fromEnv();
  } catch (error) {
    console.warn("⚠️ Redis initialization failed:", error);
  }
}

// In-memory fallback if Redis credentials are not present
const inMemoryFallback = new Map<string, { count: number; reset: number }>();

const dummyLimiter = {
  limit: async (identifier: string, limitCount = 60) => {
    const now = Date.now();
    const windowMs = 60 * 1000;
    const current = inMemoryFallback.get(identifier);

    if (!current || now > current.reset) {
      inMemoryFallback.set(identifier, { count: 1, reset: now + windowMs });
      return { success: true, limit: limitCount, remaining: limitCount - 1, reset: Math.ceil((now + windowMs) / 1000) };
    }

    if (current.count >= limitCount) {
      return { success: false, limit: limitCount, remaining: 0, reset: Math.ceil(current.reset / 1000) };
    }

    current.count += 1;
    return { success: true, limit: limitCount, remaining: limitCount - current.count, reset: Math.ceil(current.reset / 1000) };
  },
};

export const userRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      analytics: true,
      prefix: "ratelimit:user",
    })
  : null;

export const authRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
      prefix: "ratelimit:auth",
    })
  : null;

export const adminRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      analytics: true,
      prefix: "ratelimit:admin",
    })
  : null;

export async function checkRateLimit(
  identifier: string,
  type: "user" | "auth" | "admin" = "user"
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  try {
    if (!redis) {
      // Fallback if Redis is not configured - use in-memory limiter
      const limits = { auth: 10, user: 60, admin: 100 };
      return await dummyLimiter.limit(`${type}:${identifier}`, limits[type] || 60);
    }

    // If Redis is configured, use it
    const limiter = type === "auth" ? authRateLimit : type === "admin" ? adminRateLimit : userRateLimit;
    if (limiter) {
      const result = await limiter.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    }

    // Fallback if limiter is null
    const limits = { auth: 10, user: 60, admin: 100 };
    return await dummyLimiter.limit(`${type}:${identifier}`, limits[type] || 60);
  } catch (error) {
    console.error("❌ Rate limit check failed:", error);
    // 🛡️ CRITICAL FIX: On error, return FAILURE to be safe
    return {
      success: false,
      limit: 100,
      remaining: 0,
      reset: Math.ceil((Date.now() + 60000) / 1000),
    };
  }
}

export function getRateLimitHeaders(result: { success: boolean; limit: number; remaining: number; reset: number }): HeadersInit {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
  };
}