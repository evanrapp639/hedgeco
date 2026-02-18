/**
 * Redis Client Configuration
 * 
 * Provides a singleton Redis client for caching and rate limiting.
 * Falls back gracefully when Redis is not available.
 */

import Redis from 'ioredis';

// Redis client singleton
let redisClient: Redis | null = null;

/**
 * Get or create Redis client
 */
function getRedisClient(): Redis | null {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Redis] No REDIS_URL configured, Redis features disabled');
    }
    return null;
  }
  
  if (redisClient) {
    return redisClient;
  }
  
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) {
          console.error('[Redis] Max retries reached, giving up');
          return null;
        }
        return Math.min(times * 100, 3000);
      },
      reconnectOnError: (err) => {
        const targetErrors = ['READONLY', 'ECONNREFUSED'];
        return targetErrors.some(e => err.message.includes(e));
      },
      lazyConnect: true,
      enableOfflineQueue: false,
    });
    
    redisClient.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
    });
    
    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });
    
    redisClient.on('ready', () => {
      console.log('[Redis] Ready to receive commands');
    });
    
    redisClient.on('close', () => {
      console.log('[Redis] Connection closed');
    });
    
    // Attempt connection
    redisClient.connect().catch((err) => {
      console.error('[Redis] Initial connection failed:', err.message);
      redisClient = null;
    });
    
    return redisClient;
  } catch (error) {
    console.error('[Redis] Failed to create client:', error);
    return null;
  }
}

/**
 * Exported Redis client - may be null if Redis is not configured
 */
export const redis = getRedisClient();

/**
 * Check if Redis is available and connected
 */
export async function isRedisAvailable(): Promise<boolean> {
  if (!redis) return false;
  
  try {
    const pong = await redis.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

/**
 * Cache helper functions
 */
export const cache = {
  /**
   * Get a cached value
   */
  async get<T>(key: string): Promise<T | null> {
    if (!redis) return null;
    
    try {
      const value = await redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  },
  
  /**
   * Set a cached value with optional TTL
   */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<boolean> {
    if (!redis) return false;
    
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await redis.set(key, serialized, 'EX', ttlSeconds);
      } else {
        await redis.set(key, serialized);
      }
      return true;
    } catch {
      return false;
    }
  },
  
  /**
   * Delete a cached value
   */
  async del(key: string): Promise<boolean> {
    if (!redis) return false;
    
    try {
      await redis.del(key);
      return true;
    } catch {
      return false;
    }
  },
  
  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!redis) return false;
    
    try {
      const count = await redis.exists(key);
      return count > 0;
    } catch {
      return false;
    }
  },
  
  /**
   * Get remaining TTL for a key
   */
  async ttl(key: string): Promise<number> {
    if (!redis) return -2;
    
    try {
      return await redis.ttl(key);
    } catch {
      return -2;
    }
  },
};

export default redis;
