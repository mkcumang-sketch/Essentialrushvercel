import { NextRequest, NextResponse } from 'next/server';

// 🚀 ENTERPRISE Caching & PERFORMANCE UTILITIES 🚀

// 🛡️ CACHE CONTROL HEADERS
export const setCacheHeaders = (response: NextResponse, maxAge: number = 3600) => {
  response.headers.set('Cache-Control', `public, s-maxage=${maxAge}, stale-while-revalidate=86400`);
  response.headers.set('CDN-Cache-Control', `public, s-maxage=${maxAge}, stale-while-revalidate=86400`);
  return response;
};

// 🛡️ NO-CACHE FOR SENSITIVE ROUTES
export const setNoCacheHeaders = (response: NextResponse) => {
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  return response;
};

// 🛡️ ETAG GENERATION
export const generateETag = (data: any): string => {
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
  return `"${hash}"`;
};

// 🛡️ CONDITIONAL REQUEST HANDLING
export const handleConditionalRequest = (
  request: NextRequest,
  data: any,
  etag?: string
): NextResponse | null => {
  const ifNoneMatch = request.headers.get('if-none-match');
  
  if (etag && ifNoneMatch === etag) {
    return new NextResponse(null, { status: 304 });
  }
  
  return null;
};

// 🛡️ IN-MEMORY CACHE (SERVER-SIDE)
class MemoryCache {
  private cache = new Map<string, { data: any; expiry: number }>();
  
  set(key: string, data: any, ttl: number = 300): void {
    const expiry = Date.now() + (ttl * 1000);
    this.cache.set(key, { data, expiry });
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  // 🧹 CLEANUP EXPIRED ENTRIES
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

export const memoryCache = new MemoryCache();

// 🛡️ CLEANUP INTERVAL
if (typeof window === 'undefined') {
  setInterval(() => {
    memoryCache.cleanup();
  }, 60000); // Cleanup every minute
}

// 🚀 PERFORMANCE MONITORING
export class PerformanceMonitor {
  private static metrics = new Map<string, number[]>();
  
  static startTimer(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      
      if (!this.metrics.has(label)) {
        this.metrics.set(label, []);
      }
      
      const durations = this.metrics.get(label)!;
      durations.push(duration);
      
      // Keep only last 100 measurements
      if (durations.length > 100) {
        durations.shift();
      }
    };
  }
  
  static getMetrics(label: string): { avg: number; min: number; max: number; count: number } | null {
    const durations = this.metrics.get(label);
    if (!durations || durations.length === 0) return null;
    
    const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
    const min = Math.min(...durations);
    const max = Math.max(...durations);
    
    return { avg, min, max, count: durations.length };
  }
  
  static getAllMetrics(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const result: Record<string, any> = {};
    
    for (const [label] of this.metrics.entries()) {
      result[label] = this.getMetrics(label);
    }
    
    return result;
  }
}

// 🚀 DATABASE QUERY OPTIMIZATION
export const createOptimizedQuery = (
  baseQuery: any,
  options: {
    limit?: number;
    skip?: number;
    sort?: Record<string, 1 | -1>;
    select?: string;
  } = {}
) => {
  let query = baseQuery;
  
  if (options.select) {
    query = query.select(options.select);
  }
  
  if (options.sort) {
    query = query.sort(options.sort);
  }
  
  if (options.skip) {
    query = query.skip(options.skip);
  }
  
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  return query;
};

// 🚀 API RATE LIMITING
export class RateLimiter {
  private requests = new Map<string, number[]>();
  
  constructor(
    private windowMs: number = 60000, // 1 minute
    private maxRequests: number = 100
  ) {}
  
  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }
    
    const timestamps = this.requests.get(identifier)!;
    
    // Remove old requests outside the window
    const validTimestamps = timestamps.filter(time => time > windowStart);
    this.requests.set(identifier, validTimestamps);
    
    if (validTimestamps.length >= this.maxRequests) {
      return false;
    }
    
    validTimestamps.push(now);
    return true;
  }
  
  getRemainingRequests(identifier: string): number {
    const timestamps = this.requests.get(identifier) || [];
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    const validTimestamps = timestamps.filter(time => time > windowStart);
    return Math.max(0, this.maxRequests - validTimestamps.length);
  }
  
  getResetTime(identifier: string): number {
    const timestamps = this.requests.get(identifier) || [];
    if (timestamps.length === 0) return 0;
    
    const oldestTimestamp = Math.min(...timestamps);
    return oldestTimestamp + this.windowMs;
  }
}

export const apiRateLimiter = new RateLimiter(60000, 100); // 100 requests per minute
export const authRateLimiter = new RateLimiter(900000, 5); // 5 auth requests per 15 minutes
