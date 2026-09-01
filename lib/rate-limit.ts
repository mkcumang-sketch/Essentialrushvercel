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

// In-memory fallback map with memory leak protection
const inMemoryFallback = new Map<string, { count: number; reset: number }>();

// Auto-cleanup stale memory records every 60s
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of inMemoryFallback.entries()) {
      if (now > record.reset) {
        inMemoryFallback.delete(key);
      }
    }
  }, 60000);
}

const dummyLimiter = {
  limit: async (identifier: string, limitCount = 60) => {
    const now = Date.now();
    const windowMs = 60 * 1000;
    const current = inMemoryFallback.get(identifier);

    if (!current || now > current.reset) {
      inMemoryFallback.set(identifier, { count: 1, reset: now + windowMs });
      return {
        success: true,
        limit: limitCount,
        remaining: limitCount - 1,
        reset: Math.ceil((now + windowMs) / 1000),
      };
    }

    if (current.count >= limitCount) {
      return {
        success: false,
        limit: limitCount,
        remaining: 0,
        reset: Math.ceil(current.reset / 1000),
      };
    }

    current.count += 1;
    return {
      success: true,
      limit: limitCount,
      remaining: limitCount - current.count,
      reset: Math.ceil(current.reset / 1000),
    };
  },
};

export type RateLimitType = "user" | "auth" | "admin" | "ai" | "sensitive";

const TIER_LIMITS: Record<RateLimitType, number> = {
  auth: 5,        // 5 req / min (Login, OTP, Register)
  ai: 15,         // 15 req / min (MYRIO Chat, Groq)
  sensitive: 5,   // 5 req / min (Withdrawals, Pass Reset)
  user: 60,       // 60 req / min (Standard User Actions)
  admin: 120,     // 120 req / min (Godmode Operations)
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
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
      prefix: "ratelimit:auth",
    })
  : null;

export const aiRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(15, "1 m"),
      analytics: true,
      prefix: "ratelimit:ai",
    })
  : null;

export const adminRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(120, "1 m"),
      analytics: true,
      prefix: "ratelimit:admin",
    })
  : null;

export async function checkRateLimit(
  identifier: string,
  type: RateLimitType = "user"
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  try {
    const limitCount = TIER_LIMITS[type] || 60;

    if (!redis) {
      return await dummyLimiter.limit(`${type}:${identifier}`, limitCount);
    }

    const limiter =
      type === "auth"
        ? authRateLimit
        : type === "ai"
        ? aiRateLimit
        : type === "admin"
        ? adminRateLimit
        : userRateLimit;

    if (limiter) {
      const result = await limiter.limit(identifier);
      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
      };
    }

    return await dummyLimiter.limit(`${type}:${identifier}`, limitCount);
  } catch (error) {
    console.error("❌ Rate limit check failed:", error);
    // Fail-safe: In-memory fallback on Redis drop
    return await dummyLimiter.limit(`${type}:${identifier}`, TIER_LIMITS[type] || 60);
  }
}

export function getRateLimitHeaders(result: {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}): HeadersInit {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(result.reset),
  };
}