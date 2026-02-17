/**
 * API Rate Limiting
 * Sprint 7: HedgeCo.Net
 *
 * Provides rate limiting middleware using Redis for distributed
 * rate limiting across multiple server instances.
 * Supports both token bucket and sliding window algorithms.
 */

import { getRedisClient, isRedisAvailable } from './cache';
import { NextRequest, NextResponse } from 'next/server';

// ============================================================
// TYPES
// ============================================================

export interface RateLimitConfig {
  /** Maximum requests per window */
  limit: number;
  /** Window duration in seconds */
  windowSeconds: number;
  /** Optional identifier prefix for namespacing */
  prefix?: string;
  /** Algorithm to use */
  algorithm?: 'sliding-window' | 'token-bucket';
  /** Whether to skip in development */
  skipInDev?: boolean;
}

export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;
  /** Current request count in window */
  current: number;
  /** Maximum allowed requests */
  limit: number;
  /** Remaining requests in window */
  remaining: number;
  /** Unix timestamp when the window resets */
  resetAt: number;
  /** Milliseconds until window resets */
  retryAfter?: number;
}

export interface RateLimitInfo {
  /** Rate limit headers for response */
  headers: {
    'X-RateLimit-Limit': string;
    'X-RateLimit-Remaining': string;
    'X-RateLimit-Reset': string;
    'Retry-After'?: string;
  };
  /** Result details */
  result: RateLimitResult;
}

// ============================================================
// DEFAULT CONFIGURATIONS
// ============================================================

export const RateLimitPresets = {
  /** Unauthenticated API requests: 60/min */
  unauthenticated: {
    limit: 60,
    windowSeconds: 60,
    prefix: 'rl:unauth',
  } satisfies RateLimitConfig,
  
  /** Authenticated user requests: 300/min */
  authenticated: {
    limit: 300,
    windowSeconds: 60,
    prefix: 'rl:auth',
  } satisfies RateLimitConfig,
  
  /** Premium/paid users: 1000/min */
  premium: {
    limit: 1000,
    windowSeconds: 60,
    prefix: 'rl:premium',
  } satisfies RateLimitConfig,
  
  /** Login attempts: 5 per 15 minutes */
  login: {
    limit: 5,
    windowSeconds: 900,
    prefix: 'rl:login',
  } satisfies RateLimitConfig,
  
  /** Password reset: 3 per hour */
  passwordReset: {
    limit: 3,
    windowSeconds: 3600,
    prefix: 'rl:pwreset',
  } satisfies RateLimitConfig,
  
  /** AI/expensive operations: 10/min */
  expensive: {
    limit: 10,
    windowSeconds: 60,
    prefix: 'rl:expensive',
  } satisfies RateLimitConfig,
  
  /** Export/download: 20/hour */
  export: {
    limit: 20,
    windowSeconds: 3600,
    prefix: 'rl:export',
  } satisfies RateLimitConfig,
} as const;

// ============================================================
// CORE RATE LIMITING FUNCTIONS
// ============================================================

/**
 * Check rate limit using sliding window algorithm
 * More accurate but slightly more expensive
 */
async function checkSlidingWindow(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  const now = Date.now();
  const windowStart = now - (config.windowSeconds * 1000);
  const windowKey = `${config.prefix}:${key}`;
  
  // Use Redis transaction for atomicity
  const multi = redis.multi();
  
  // Remove old entries outside the window
  multi.zremrangebyscore(windowKey, 0, windowStart);
  
  // Count current requests in window
  multi.zcard(windowKey);
  
  // Add current request with timestamp as score
  const requestId = `${now}:${Math.random().toString(36).slice(2)}`;
  multi.zadd(windowKey, now, requestId);
  
  // Set expiry on the key
  multi.expire(windowKey, config.windowSeconds);
  
  const results = await multi.exec();
  
  // Results: [remresult, count, addresult, expireresult]
  const currentCount = (results?.[1]?.[1] as number) ?? 0;
  
  const resetAt = Math.ceil((now + config.windowSeconds * 1000) / 1000);
  const allowed = currentCount < config.limit;
  const remaining = Math.max(0, config.limit - currentCount - 1);
  
  // If not allowed, remove the request we just added
  if (!allowed) {
    await redis.zrem(windowKey, requestId);
  }
  
  return {
    allowed,
    current: currentCount,
    limit: config.limit,
    remaining: allowed ? remaining : 0,
    resetAt,
    retryAfter: allowed ? undefined : config.windowSeconds * 1000,
  };
}

/**
 * Check rate limit using token bucket algorithm
 * Simpler and allows for burst traffic
 */
async function checkTokenBucket(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const redis = getRedisClient();
  const now = Date.now();
  const bucketKey = `${config.prefix}:bucket:${key}`;
  const lastRefillKey = `${config.prefix}:refill:${key}`;
  
  // Get current bucket state
  const [tokensStr, lastRefillStr] = await redis.mget(bucketKey, lastRefillKey);
  
  let tokens = tokensStr ? parseInt(tokensStr, 10) : config.limit;
  const lastRefill = lastRefillStr ? parseInt(lastRefillStr, 10) : now;
  
  // Calculate tokens to add based on time passed
  const timePassed = now - lastRefill;
  const refillRate = config.limit / config.windowSeconds; // tokens per second
  const tokensToAdd = Math.floor((timePassed / 1000) * refillRate);
  
  // Add tokens (cap at max)
  tokens = Math.min(config.limit, tokens + tokensToAdd);
  
  // Try to consume a token
  const allowed = tokens > 0;
  if (allowed) {
    tokens--;
  }
  
  // Update Redis
  const pipeline = redis.pipeline();
  pipeline.set(bucketKey, tokens, 'EX', config.windowSeconds * 2);
  pipeline.set(lastRefillKey, now, 'EX', config.windowSeconds * 2);
  await pipeline.exec();
  
  const resetAt = Math.ceil((now + config.windowSeconds * 1000) / 1000);
  
  return {
    allowed,
    current: config.limit - tokens,
    limit: config.limit,
    remaining: tokens,
    resetAt,
    retryAfter: allowed ? undefined : Math.ceil(1000 / refillRate),
  };
}

/**
 * In-memory fallback when Redis is unavailable
 */
const memoryStore = new Map<string, { count: number; resetAt: number }>();

async function checkMemoryFallback(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const fullKey = `${config.prefix}:${key}`;
  
  let entry = memoryStore.get(fullKey);
  
  // Reset if window has passed
  if (!entry || now > entry.resetAt) {
    entry = {
      count: 0,
      resetAt: now + config.windowSeconds * 1000,
    };
  }
  
  entry.count++;
  memoryStore.set(fullKey, entry);
  
  const allowed = entry.count <= config.limit;
  
  return {
    allowed,
    current: entry.count,
    limit: config.limit,
    remaining: Math.max(0, config.limit - entry.count),
    resetAt: Math.ceil(entry.resetAt / 1000),
    retryAfter: allowed ? undefined : entry.resetAt - now,
  };
}

// Clean up expired memory entries periodically
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of Array.from(memoryStore.entries())) {
      if (now > entry.resetAt + 60000) { // Keep for 1 min after expiry
        memoryStore.delete(key);
      }
    }
  }, 60000); // Run every minute
}

// ============================================================
// MAIN RATE LIMIT FUNCTION
// ============================================================

/**
 * Check rate limit for a given identifier
 * 
 * @param identifier - Unique identifier (e.g., IP, user ID)
 * @param config - Rate limit configuration
 * @returns Rate limit result and headers
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitInfo> {
  const fullConfig: Required<RateLimitConfig> = {
    limit: config.limit,
    windowSeconds: config.windowSeconds,
    prefix: config.prefix ?? 'rl',
    algorithm: config.algorithm ?? 'sliding-window',
    skipInDev: config.skipInDev ?? false,
  };
  
  // Skip in development if configured
  if (fullConfig.skipInDev && process.env.NODE_ENV === 'development') {
    return {
      headers: {
        'X-RateLimit-Limit': String(fullConfig.limit),
        'X-RateLimit-Remaining': String(fullConfig.limit),
        'X-RateLimit-Reset': String(Math.ceil(Date.now() / 1000) + fullConfig.windowSeconds),
      },
      result: {
        allowed: true,
        current: 0,
        limit: fullConfig.limit,
        remaining: fullConfig.limit,
        resetAt: Math.ceil(Date.now() / 1000) + fullConfig.windowSeconds,
      },
    };
  }
  
  let result: RateLimitResult;
  
  // Try Redis first, fall back to memory
  if (await isRedisAvailable()) {
    if (fullConfig.algorithm === 'token-bucket') {
      result = await checkTokenBucket(identifier, fullConfig);
    } else {
      result = await checkSlidingWindow(identifier, fullConfig);
    }
  } else {
    console.warn('[rate-limit] Redis unavailable, using memory fallback');
    result = await checkMemoryFallback(identifier, fullConfig);
  }
  
  // Build headers
  const headers: RateLimitInfo['headers'] = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetAt),
  };
  
  if (!result.allowed && result.retryAfter) {
    headers['Retry-After'] = String(Math.ceil(result.retryAfter / 1000));
  }
  
  return { headers, result };
}

// ============================================================
// NEXT.JS MIDDLEWARE HELPERS
// ============================================================

/**
 * Extract identifier from request (IP or user ID)
 */
export function getIdentifier(request: NextRequest, userId?: string): string {
  if (userId) {
    return `user:${userId}`;
  }
  
  // Try to get real IP from headers (for proxied requests)
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ip = forwarded?.split(',')[0].trim() || realIp || 'unknown';
  
  return `ip:${ip}`;
}

/**
 * Create rate limit middleware for Next.js API routes
 * 
 * @param config - Rate limit configuration
 * @returns Middleware function
 */
export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async function rateLimitMiddleware(
    request: NextRequest,
    userId?: string
  ): Promise<{ response?: NextResponse; headers: Record<string, string> }> {
    const identifier = getIdentifier(request, userId);
    const { headers, result } = await checkRateLimit(identifier, config);
    
    if (!result.allowed) {
      const response = NextResponse.json(
        {
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Please try again in ${Math.ceil((result.retryAfter ?? 0) / 1000)} seconds.`,
          retryAfter: result.retryAfter,
        },
        { status: 429 }
      );
      
      // Add rate limit headers to error response
      Object.entries(headers).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return { response, headers };
    }
    
    return { headers };
  };
}

/**
 * Rate limit decorator for tRPC procedures
 * Use in combination with middleware to add rate limiting to specific procedures
 */
export async function withRateLimit<T>(
  identifier: string,
  config: RateLimitConfig,
  fn: () => Promise<T>
): Promise<T> {
  const { result } = await checkRateLimit(identifier, config);
  
  if (!result.allowed) {
    throw new Error(
      `Rate limit exceeded. Try again in ${Math.ceil((result.retryAfter ?? 0) / 1000)} seconds.`
    );
  }
  
  return fn();
}

// ============================================================
// COMBINED RATE LIMITERS
// ============================================================

/**
 * Rate limiter that applies multiple limits (e.g., per-second AND per-minute)
 */
export async function checkMultipleRateLimits(
  identifier: string,
  configs: RateLimitConfig[]
): Promise<RateLimitInfo> {
  let mostRestrictive: RateLimitInfo | null = null;
  
  for (const config of configs) {
    const info = await checkRateLimit(identifier, config);
    
    // If any limit is exceeded, return that
    if (!info.result.allowed) {
      return info;
    }
    
    // Track the most restrictive (lowest remaining)
    if (!mostRestrictive || info.result.remaining < mostRestrictive.result.remaining) {
      mostRestrictive = info;
    }
  }
  
  return mostRestrictive!;
}

/**
 * Apply different rate limits based on user tier
 */
export async function checkTieredRateLimit(
  identifier: string,
  userTier: 'anonymous' | 'free' | 'premium' | 'enterprise'
): Promise<RateLimitInfo> {
  const configs: Record<typeof userTier, RateLimitConfig> = {
    anonymous: RateLimitPresets.unauthenticated,
    free: RateLimitPresets.authenticated,
    premium: RateLimitPresets.premium,
    enterprise: {
      limit: 5000,
      windowSeconds: 60,
      prefix: 'rl:enterprise',
    },
  };
  
  return checkRateLimit(identifier, configs[userTier]);
}
