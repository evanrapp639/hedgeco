"use client";

import { useState, useEffect, useCallback } from "react";

export interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean;
  lastOnlineAt: Date | null;
  connectionType: string | null;
}

/**
 * Hook to detect online/offline status with additional connection info
 */
export function useOnlineStatus(): OnlineStatus {
  const [status, setStatus] = useState<OnlineStatus>({
    isOnline: typeof navigator !== "undefined" ? navigator.onLine : true,
    wasOffline: false,
    lastOnlineAt: null,
    connectionType: null,
  });

  useEffect(() => {
    // Get connection type if available
    const getConnectionType = (): string | null => {
      if (typeof navigator !== "undefined" && "connection" in navigator) {
        const conn = (navigator as Navigator & { connection?: { effectiveType?: string } }).connection;
        return conn?.effectiveType || null;
      }
      return null;
    };

    const handleOnline = () => {
      setStatus((prev) => ({
        ...prev,
        isOnline: true,
        wasOffline: true,
        lastOnlineAt: new Date(),
        connectionType: getConnectionType(),
      }));
    };

    const handleOffline = () => {
      setStatus((prev) => ({
        ...prev,
        isOnline: false,
        connectionType: null,
      }));
    };

    // Set initial connection type
    setStatus((prev) => ({
      ...prev,
      connectionType: getConnectionType(),
    }));

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return status;
}

/**
 * Simple cache utilities for offline data
 */
const CACHE_PREFIX = "hedgeco_offline_";
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export function cacheData<T>(key: string, data: T, ttl = CACHE_EXPIRY): void {
  if (typeof window === "undefined") return;
  
  const cacheItem: CacheItem<T> = {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttl,
  };
  
  try {
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(cacheItem));
  } catch (e) {
    // localStorage might be full or disabled
    console.warn("Failed to cache data:", e);
  }
}

export function getCachedData<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  
  try {
    const item = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!item) return null;
    
    const cacheItem: CacheItem<T> = JSON.parse(item);
    
    // Check if expired
    if (Date.now() > cacheItem.expiresAt) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }
    
    return cacheItem.data;
  } catch (e) {
    console.warn("Failed to read cached data:", e);
    return null;
  }
}

export function clearCachedData(key?: string): void {
  if (typeof window === "undefined") return;
  
  if (key) {
    localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } else {
    // Clear all cached data
    Object.keys(localStorage)
      .filter((k) => k.startsWith(CACHE_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  }
}

export function getCacheAge(key: string): number | null {
  if (typeof window === "undefined") return null;
  
  try {
    const item = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!item) return null;
    
    const cacheItem: CacheItem<unknown> = JSON.parse(item);
    return Date.now() - cacheItem.timestamp;
  } catch {
    return null;
  }
}

/**
 * Hook for cached data with automatic fallback to cache when offline
 */
export function useCachedData<T>(
  key: string,
  fetchFn: () => Promise<T>,
  options?: {
    ttl?: number;
    enabled?: boolean;
    staleWhileRevalidate?: boolean;
  }
): {
  data: T | null;
  isLoading: boolean;
  isFromCache: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const { isOnline } = useOnlineStatus();
  const [data, setData] = useState<T | null>(() => getCachedData<T>(key));
  const [isLoading, setIsLoading] = useState(false);
  const [isFromCache, setIsFromCache] = useState(!!getCachedData<T>(key));
  const [error, setError] = useState<Error | null>(null);
  
  const { ttl = CACHE_EXPIRY, enabled = true, staleWhileRevalidate = true } = options || {};

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    setIsLoading(true);
    setError(null);
    
    // If offline, try to use cached data
    if (!isOnline) {
      const cached = getCachedData<T>(key);
      if (cached) {
        setData(cached);
        setIsFromCache(true);
        setIsLoading(false);
        return;
      }
      setError(new Error("You are offline and no cached data is available"));
      setIsLoading(false);
      return;
    }
    
    // If online and staleWhileRevalidate, show cached data first
    if (staleWhileRevalidate) {
      const cached = getCachedData<T>(key);
      if (cached) {
        setData(cached);
        setIsFromCache(true);
      }
    }
    
    try {
      const freshData = await fetchFn();
      setData(freshData);
      setIsFromCache(false);
      cacheData(key, freshData, ttl);
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
      
      // Fall back to cached data on error
      const cached = getCachedData<T>(key);
      if (cached) {
        setData(cached);
        setIsFromCache(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [key, fetchFn, enabled, isOnline, ttl, staleWhileRevalidate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    isFromCache,
    error,
    refetch: fetchData,
  };
}

export default useOnlineStatus;
