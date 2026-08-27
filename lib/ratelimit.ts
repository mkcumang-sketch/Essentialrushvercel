import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// 🛡️ ZERO-TRUST RATE LIMITING CONFIGURATION

// Check if Redis environment variables are set
const hasRedisEnv = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

// Initialize Redis client only if env vars are available
let redis: Redis | null = null;

if (hasRedisEnv) {
  try {
    redis = Redis.fromEnv();
  } catch (error) {
    console.warn("⚠️ Redis initialization failed:", error);
  }
}

// Create dummy rate limiter that always allows if Redis is not available
const dummyLimiter = {
  limit: async () => ({ success: true, limit: 100, remaining: 99, reset: Date.now() + 60000 }),
} as any; // 🚀 FIX: Prevent typing mismatch with strict Ratelimit object

// 🚀 STANDARD USER LIMIT: 60 requests per minute
export const userRateLimit = redis 
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(60, "1 m"),
      analytics: true,
      prefix: "ratelimit:user",
    })
  : dummyLimiter;

// 🔐 AUTH ROUTE LIMIT: 5 requests per minute (stricter for login/register)
export const authRateLimit = redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(5, "1 m"),
      analytics: true,
      prefix: "ratelimit:auth",
    })
  : dummyLimiter;

// ⚡ ADMIN LIMIT: 100 requests per minute (higher for admin operations)
export const adminRateLimit = redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(100, "1 m"),
      analytics: true,
      prefix: "ratelimit:admin",
    })
  : dummyLimiter;

// 🎯 API RATE LIMIT HELPER
export async function checkRateLimit(
  identifier: string,
  type: "user" | "auth" | "admin" = "user"
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  // If Redis is not available, allow all requests (graceful degradation)
  if (!redis) {
    console.warn("⚠️ Rate limiting disabled - Redis not configured");
    return {
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000,
    };
  }

  try {
    const limiter = type === "auth" ? authRateLimit : type === "admin" ? adminRateLimit : userRateLimit;
    const result = await limiter.limit(identifier);
    
    return {
      success: result.success,
      limit: result.limit,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch (error) {
    console.error("❌ Rate limit check failed:", error);
    // Graceful degradation - allow request if rate limiter fails
    return {
      success: true,
      limit: 100,
      remaining: 99,
      reset: Date.now() + 60000,
    };
  }
}

// 🛡️ RATE LIMIT MIDDLEWARE HELPER
export function getRateLimitHeaders(result: { success: boolean; limit: number; remaining: number; reset: number }) {
  return {
    "X-RateLimit-Limit": result.limit.toString(),
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": result.reset.toString(),
  };
}