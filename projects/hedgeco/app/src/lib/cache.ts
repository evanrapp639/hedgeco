/**
 * Redis Caching Layer
 * Sprint 5: HedgeCo.Net
 *
 * Cache keys convention:
 * - `fund:{id}` — fund details (TTL: 5min)
 * - `fund:{id}:stats` — fund statistics (TTL: 1min)
 * - `search:{hash}` — search results (TTL: 30s)
 * - `trending:funds` — trending list (TTL: 5min)
 * - `user:{id}:recommendations` — user recs (TTL: 15min)
 */

import Redis from "ioredis";

// --------------------------------------------------------------------------
// Redis Client Setup
// --------------------------------------------------------------------------

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let redis: Redis | null = null;

/**
 * Get or create Redis client (singleton)
 */
export function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 100, 3000),
    });

    redis.on("error", (err) => {
      console.error("[cache] Redis connection error:", err.message);
    });

    redis.on("connect", () => {
      console.log("[cache] Redis connected");
    });
  }

  return redis;
}

/**
 * Check if Redis is available
 */
export async function isRedisAvailable(): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

// --------------------------------------------------------------------------
// Cache Operations
// --------------------------------------------------------------------------

/**
 * Get a cached value by key
 * Returns null if not found or on error
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient();
    const value = await client.get(key);

    if (value === null) {
      return null;
    }

    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`[cache] Error getting key "${key}":`, error);
    return null;
  }
}

/**
 * Set a cached value with TTL
 * @param key - Cache key
 * @param value - Value to cache (will be JSON serialized)
 * @param ttlSeconds - Time to live in seconds
 */
export async function cacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<boolean> {
  try {
    const client = getRedisClient();
    const serialized = JSON.stringify(value);

    await client.setex(key, ttlSeconds, serialized);
    return true;
  } catch (error) {
    console.error(`[cache] Error setting key "${key}":`, error);
    return false;
  }
}

/**
 * Invalidate cache keys by pattern
 * Uses SCAN to avoid blocking on large keyspaces
 * @param pattern - Redis key pattern (e.g., "fund:*" or "user:123:*")
 */
export async function cacheInvalidate(pattern: string): Promise<number> {
  try {
    const client = getRedisClient();
    let cursor = "0";
    let totalDeleted = 0;

    do {
      const [nextCursor, keys] = await client.scan(
        cursor,
        "MATCH",
        pattern,
        "COUNT",
        100
      );
      cursor = nextCursor;

      if (keys.length > 0) {
        const deleted = await client.del(...keys);
        totalDeleted += deleted;
      }
    } while (cursor !== "0");

    return totalDeleted;
  } catch (error) {
    console.error(`[cache] Error invalidating pattern "${pattern}":`, error);
    return 0;
  }
}

/**
 * Delete a specific cache key
 */
export async function cacheDelete(key: string): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.del(key);
    return true;
  } catch (error) {
    console.error(`[cache] Error deleting key "${key}":`, error);
    return false;
  }
}

/**
 * Memoize a function with caching
 * Returns cached value if available, otherwise executes fn and caches result
 *
 * @param key - Cache key
 * @param fn - Function to execute if cache miss
 * @param ttlSeconds - TTL for cached value
 */
export async function cacheMemoize<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  // Try to get from cache first
  const cached = await cacheGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - execute function
  const result = await fn();

  // Cache the result (fire-and-forget, don't block on cache write)
  cacheSet(key, result, ttlSeconds).catch(() => {
    // Silently ignore cache write errors
  });

  return result;
}

// --------------------------------------------------------------------------
// Cache Key Builders
// --------------------------------------------------------------------------

export const CacheKeys = {
  /** Fund details - TTL: 5min (300s) */
  fund: (fundId: string) => `fund:${fundId}`,

  /** Fund statistics - TTL: 1min (60s) */
  fundStats: (fundId: string) => `fund:${fundId}:stats`,

  /** Search results - TTL: 30s */
  search: (queryHash: string) => `search:${queryHash}`,

  /** Trending funds list - TTL: 5min (300s) */
  trendingFunds: () => `trending:funds`,

  /** User recommendations - TTL: 15min (900s) */
  userRecommendations: (userId: string) => `user:${userId}:recommendations`,

  /** Fund views count (for trending) - TTL: 1hr */
  fundViewsCount: (fundId: string) => `fund:${fundId}:views:count`,
} as const;

export const CacheTTL = {
  FUND: 300, // 5 minutes
  FUND_STATS: 60, // 1 minute
  SEARCH: 30, // 30 seconds
  TRENDING: 300, // 5 minutes
  RECOMMENDATIONS: 900, // 15 minutes
  VIEWS_COUNT: 3600, // 1 hour
} as const;

// --------------------------------------------------------------------------
// Utility Functions
// --------------------------------------------------------------------------

/**
 * Generate a hash for search queries (for cache key)
 */
export function hashSearchQuery(query: string, filters?: object): string {
  const data = JSON.stringify({ query: query.toLowerCase().trim(), filters });
  // Simple hash function for demo - in production use crypto
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Increment a counter in Redis (for metrics/views)
 */
export async function cacheIncrement(key: string): Promise<number> {
  try {
    const client = getRedisClient();
    return await client.incr(key);
  } catch (error) {
    console.error(`[cache] Error incrementing key "${key}":`, error);
    return 0;
  }
}

/**
 * Get multiple keys at once
 */
export async function cacheGetMany<T>(keys: string[]): Promise<(T | null)[]> {
  if (keys.length === 0) return [];

  try {
    const client = getRedisClient();
    const values = await client.mget(...keys);

    return values.map((v) => {
      if (v === null) return null;
      try {
        return JSON.parse(v) as T;
      } catch {
        return null;
      }
    });
  } catch (error) {
    console.error(`[cache] Error getting multiple keys:`, error);
    return keys.map(() => null);
  }
}

/**
 * Set multiple key-value pairs at once
 */
export async function cacheSetMany(
  entries: Array<{ key: string; value: unknown; ttl: number }>
): Promise<boolean> {
  if (entries.length === 0) return true;

  try {
    const client = getRedisClient();
    const pipeline = client.pipeline();

    for (const { key, value, ttl } of entries) {
      pipeline.setex(key, ttl, JSON.stringify(value));
    }

    await pipeline.exec();
    return true;
  } catch (error) {
    console.error(`[cache] Error setting multiple keys:`, error);
    return false;
  }
}
