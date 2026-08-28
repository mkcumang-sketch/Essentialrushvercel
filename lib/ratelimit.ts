type RateLimitStore = Map<string, { count: number; expiresAt: number }>;

const rateLimitStore: RateLimitStore = new Map();

interface RateLimitOptions {
  interval: number; // In milliseconds (e.g. 60000 = 1 min)
  limit: number;    // Max requests allowed in window
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { interval: 60 * 1000, limit: 5 }
): { success: boolean; remaining: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  // Clean expired entry
  if (!record || record.expiresAt < now) {
    rateLimitStore.set(identifier, {
      count: 1,
      expiresAt: now + options.interval,
    });
    return { success: true, remaining: options.limit - 1 };
  }

  // If within limit
  if (record.count < options.limit) {
    record.count += 1;
    return { success: true, remaining: options.limit - record.count };
  }

  // Rate limit exceeded
  return { success: false, remaining: 0 };
}