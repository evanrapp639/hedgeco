/**
 * Performance Metrics Module
 * Sprint 5: HedgeCo.Net
 *
 * Tracks request durations, database timing, cache hit/miss rates.
 * Exports to stdout in JSON format for log aggregation (e.g., Datadog, Loki).
 */

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export interface RequestMetric {
  type: "request";
  method: string;
  path: string;
  statusCode: number;
  durationMs: number;
  timestamp: string;
}

export interface DatabaseMetric {
  type: "database";
  operation: string;
  model?: string;
  durationMs: number;
  rowCount?: number;
  timestamp: string;
}

export interface CacheMetric {
  type: "cache";
  operation: "get" | "set" | "invalidate";
  key: string;
  hit?: boolean;
  durationMs: number;
  timestamp: string;
}

export interface AggregatedMetrics {
  window: string;
  requests: {
    count: number;
    avgDurationMs: number;
    p50Ms: number;
    p95Ms: number;
    p99Ms: number;
    errorRate: number;
  };
  database: {
    queryCount: number;
    avgDurationMs: number;
    slowQueries: number; // > 100ms
  };
  cache: {
    hitRate: number;
    missRate: number;
    totalOps: number;
  };
}

type MetricEvent = RequestMetric | DatabaseMetric | CacheMetric;

// --------------------------------------------------------------------------
// In-Memory Metrics Buffer
// --------------------------------------------------------------------------

const BUFFER_SIZE = 1000;
const FLUSH_INTERVAL_MS = 10000; // 10 seconds

class MetricsCollector {
  private requestDurations: number[] = [];
  private requestErrors: number = 0;
  private requestCount: number = 0;

  private dbDurations: number[] = [];
  private dbCount: number = 0;
  private dbSlowCount: number = 0;

  private cacheHits: number = 0;
  private cacheMisses: number = 0;
  private cacheOps: number = 0;

  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Auto-flush periodically
    if (typeof setInterval !== "undefined") {
      this.flushTimer = setInterval(() => {
        this.flushAggregated();
      }, FLUSH_INTERVAL_MS);

      // Don't prevent process exit
      this.flushTimer.unref?.();
    }
  }

  /**
   * Record a request metric
   */
  recordRequest(metric: Omit<RequestMetric, "type" | "timestamp">): void {
    this.requestDurations.push(metric.durationMs);
    this.requestCount++;

    if (metric.statusCode >= 400) {
      this.requestErrors++;
    }

    // Emit individual metric
    this.emit({
      type: "request",
      ...metric,
      timestamp: new Date().toISOString(),
    });

    this.maybeFlush();
  }

  /**
   * Record a database query metric
   */
  recordDatabaseQuery(metric: Omit<DatabaseMetric, "type" | "timestamp">): void {
    this.dbDurations.push(metric.durationMs);
    this.dbCount++;

    if (metric.durationMs > 100) {
      this.dbSlowCount++;
    }

    // Only emit slow queries individually to reduce noise
    if (metric.durationMs > 100) {
      this.emit({
        type: "database",
        ...metric,
        timestamp: new Date().toISOString(),
      });
    }

    this.maybeFlush();
  }

  /**
   * Record a cache operation metric
   */
  recordCacheOp(metric: Omit<CacheMetric, "type" | "timestamp">): void {
    this.cacheOps++;

    if (metric.operation === "get") {
      if (metric.hit) {
        this.cacheHits++;
      } else {
        this.cacheMisses++;
      }
    }

    // Only emit cache misses or slow ops
    if (!metric.hit || metric.durationMs > 10) {
      this.emit({
        type: "cache",
        ...metric,
        timestamp: new Date().toISOString(),
      });
    }

    this.maybeFlush();
  }

  /**
   * Emit a metric to stdout
   */
  private emit(metric: MetricEvent): void {
    // JSON line format for log aggregation
    console.log(JSON.stringify(metric));
  }

  /**
   * Check if we should flush aggregated metrics
   */
  private maybeFlush(): void {
    if (this.requestDurations.length >= BUFFER_SIZE) {
      this.flushAggregated();
    }
  }

  /**
   * Flush aggregated metrics and reset counters
   */
  flushAggregated(): void {
    if (this.requestCount === 0 && this.dbCount === 0 && this.cacheOps === 0) {
      return; // Nothing to flush
    }

    const aggregated = this.getAggregated();

    console.log(
      JSON.stringify({
        type: "metrics_aggregated",
        ...aggregated,
        timestamp: new Date().toISOString(),
      })
    );

    this.reset();
  }

  /**
   * Get current aggregated metrics
   */
  getAggregated(): AggregatedMetrics {
    const sortedRequests = [...this.requestDurations].sort((a, b) => a - b);

    return {
      window: `${FLUSH_INTERVAL_MS}ms`,
      requests: {
        count: this.requestCount,
        avgDurationMs: this.requestCount > 0
          ? sortedRequests.reduce((a, b) => a + b, 0) / this.requestCount
          : 0,
        p50Ms: this.percentile(sortedRequests, 50),
        p95Ms: this.percentile(sortedRequests, 95),
        p99Ms: this.percentile(sortedRequests, 99),
        errorRate: this.requestCount > 0
          ? this.requestErrors / this.requestCount
          : 0,
      },
      database: {
        queryCount: this.dbCount,
        avgDurationMs: this.dbCount > 0
          ? this.dbDurations.reduce((a, b) => a + b, 0) / this.dbCount
          : 0,
        slowQueries: this.dbSlowCount,
      },
      cache: {
        hitRate: this.cacheOps > 0
          ? this.cacheHits / this.cacheOps
          : 0,
        missRate: this.cacheOps > 0
          ? this.cacheMisses / this.cacheOps
          : 0,
        totalOps: this.cacheOps,
      },
    };
  }

  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0;

    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Reset all counters
   */
  private reset(): void {
    this.requestDurations = [];
    this.requestErrors = 0;
    this.requestCount = 0;
    this.dbDurations = [];
    this.dbCount = 0;
    this.dbSlowCount = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
    this.cacheOps = 0;
  }

  /**
   * Cleanup (call on shutdown)
   */
  shutdown(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flushAggregated();
  }
}

// --------------------------------------------------------------------------
// Singleton Instance
// --------------------------------------------------------------------------

export const metrics = new MetricsCollector();

// --------------------------------------------------------------------------
// Timing Utilities
// --------------------------------------------------------------------------

/**
 * Time a function execution
 */
export async function timeAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<{ result: T; durationMs: number }> {
  const start = performance.now();
  const result = await fn();
  const durationMs = performance.now() - start;

  return { result, durationMs };
}

/**
 * Create a timer for manual start/stop
 */
export function createTimer(): {
  stop: () => number;
} {
  const start = performance.now();

  return {
    stop: () => performance.now() - start,
  };
}

// --------------------------------------------------------------------------
// Middleware Helpers
// --------------------------------------------------------------------------

/**
 * Wrap a database query with timing
 */
export async function timedQuery<T>(
  operation: string,
  model: string,
  fn: () => Promise<T>
): Promise<T> {
  const timer = createTimer();
  try {
    const result = await fn();
    const durationMs = timer.stop();

    metrics.recordDatabaseQuery({
      operation,
      model,
      durationMs,
    });

    return result;
  } catch (error) {
    const durationMs = timer.stop();

    metrics.recordDatabaseQuery({
      operation,
      model,
      durationMs,
    });

    throw error;
  }
}

/**
 * Wrap cache operations with timing
 */
export async function timedCacheGet<T>(
  key: string,
  fn: () => Promise<T | null>
): Promise<T | null> {
  const timer = createTimer();
  const result = await fn();
  const durationMs = timer.stop();

  metrics.recordCacheOp({
    operation: "get",
    key,
    hit: result !== null,
    durationMs,
  });

  return result;
}

export async function timedCacheSet(
  key: string,
  fn: () => Promise<boolean>
): Promise<boolean> {
  const timer = createTimer();
  const result = await fn();
  const durationMs = timer.stop();

  metrics.recordCacheOp({
    operation: "set",
    key,
    durationMs,
  });

  return result;
}

// --------------------------------------------------------------------------
// Request Tracking Middleware
// --------------------------------------------------------------------------

/**
 * Express-style middleware for tracking request metrics
 * Usage: app.use(requestMetricsMiddleware)
 */
export function requestMetricsMiddleware(
  req: { method: string; path?: string; url?: string },
  res: { statusCode: number; on: (event: string, cb: () => void) => void },
  next: () => void
): void {
  const timer = createTimer();
  const path = req.path || req.url || "unknown";

  res.on("finish", () => {
    metrics.recordRequest({
      method: req.method,
      path,
      statusCode: res.statusCode,
      durationMs: timer.stop(),
    });
  });

  next();
}

/**
 * Next.js API route wrapper
 */
export function withMetrics<T>(
  handler: (req: unknown, res: unknown) => Promise<T>
) {
  return async (
    req: { method?: string; url?: string },
    res: { statusCode: number }
  ): Promise<T> => {
    const timer = createTimer();

    try {
      const result = await handler(req, res);

      metrics.recordRequest({
        method: req.method || "UNKNOWN",
        path: req.url || "unknown",
        statusCode: res.statusCode,
        durationMs: timer.stop(),
      });

      return result;
    } catch (error) {
      metrics.recordRequest({
        method: req.method || "UNKNOWN",
        path: req.url || "unknown",
        statusCode: 500,
        durationMs: timer.stop(),
      });

      throw error;
    }
  };
}

// --------------------------------------------------------------------------
// Health Check
// --------------------------------------------------------------------------

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  metrics: AggregatedMetrics;
  checks: {
    name: string;
    status: "pass" | "fail";
    message?: string;
  }[];
}

/**
 * Get health status based on metrics
 */
export function getHealthStatus(): HealthStatus {
  const aggregated = metrics.getAggregated();
  const checks: HealthStatus["checks"] = [];

  // Check error rate
  if (aggregated.requests.errorRate > 0.1) {
    checks.push({
      name: "error_rate",
      status: "fail",
      message: `Error rate ${(aggregated.requests.errorRate * 100).toFixed(1)}% > 10%`,
    });
  } else {
    checks.push({ name: "error_rate", status: "pass" });
  }

  // Check response time
  if (aggregated.requests.p95Ms > 1000) {
    checks.push({
      name: "response_time",
      status: "fail",
      message: `P95 ${aggregated.requests.p95Ms.toFixed(0)}ms > 1000ms`,
    });
  } else {
    checks.push({ name: "response_time", status: "pass" });
  }

  // Check cache hit rate
  if (aggregated.cache.totalOps > 0 && aggregated.cache.hitRate < 0.5) {
    checks.push({
      name: "cache_hit_rate",
      status: "fail",
      message: `Hit rate ${(aggregated.cache.hitRate * 100).toFixed(1)}% < 50%`,
    });
  } else {
    checks.push({ name: "cache_hit_rate", status: "pass" });
  }

  // Check slow queries
  if (aggregated.database.slowQueries > 10) {
    checks.push({
      name: "slow_queries",
      status: "fail",
      message: `${aggregated.database.slowQueries} slow queries > 10`,
    });
  } else {
    checks.push({ name: "slow_queries", status: "pass" });
  }

  const failedChecks = checks.filter((c) => c.status === "fail").length;
  let status: HealthStatus["status"] = "healthy";

  if (failedChecks > 2) {
    status = "unhealthy";
  } else if (failedChecks > 0) {
    status = "degraded";
  }

  return {
    status,
    metrics: aggregated,
    checks,
  };
}
