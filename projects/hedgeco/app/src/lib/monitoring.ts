/**
 * Monitoring and Observability Utilities
 * 
 * Provides error tracking, performance monitoring, and custom metrics.
 * Designed to be pluggable with various monitoring providers.
 */

// =============================================================================
// Types
// =============================================================================

export interface ErrorContext {
  userId?: string;
  action?: string;
  metadata?: Record<string, unknown>;
  tags?: string[];
}

export interface PerformanceSpan {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

export interface Metric {
  name: string;
  value: number;
  unit: 'ms' | 'count' | 'bytes' | 'percent';
  tags?: Record<string, string>;
  timestamp: number;
}

// =============================================================================
// Error Tracking
// =============================================================================

/**
 * Initialize error tracking (call in app initialization)
 */
export function initErrorTracking(): void {
  if (typeof window !== 'undefined') {
    // Client-side initialization
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // Sentry is configured - would initialize here
      console.log('[Monitoring] Sentry client-side ready');
    }
  } else {
    // Server-side initialization
    if (process.env.SENTRY_DSN) {
      console.log('[Monitoring] Sentry server-side ready');
    }
  }
}

/**
 * Capture and report an error
 */
export function captureError(
  error: Error | unknown,
  context?: ErrorContext
): string {
  const errorId = generateErrorId();
  
  // Extract error details
  const errorDetails = {
    id: errorId,
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    name: error instanceof Error ? error.name : 'UnknownError',
    ...context,
    timestamp: new Date().toISOString(),
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('[Monitoring] Error captured:', errorDetails);
  }
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Sentry integration would go here:
    // Sentry.captureException(error, { extra: context });
    
    // For now, log structured error
    console.error(JSON.stringify({
      level: 'error',
      ...errorDetails,
    }));
  }
  
  return errorId;
}

/**
 * Capture a message/warning (non-error)
 */
export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: ErrorContext
): void {
  const logEntry = {
    level,
    message,
    ...context,
    timestamp: new Date().toISOString(),
  };
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Monitoring] ${level}:`, message, context);
  } else {
    console.log(JSON.stringify(logEntry));
  }
}

/**
 * Set user context for error tracking
 */
export function setUser(user: {
  id: string;
  email?: string;
  role?: string;
}): void {
  // Sentry.setUser(user);
  if (process.env.NODE_ENV === 'development') {
    console.log('[Monitoring] User context set:', user.id);
  }
}

/**
 * Clear user context
 */
export function clearUser(): void {
  // Sentry.setUser(null);
}

// =============================================================================
// Performance Tracking
// =============================================================================

const activeSpans = new Map<string, PerformanceSpan>();

/**
 * Start a performance span
 */
export function startSpan(
  name: string,
  metadata?: Record<string, unknown>
): string {
  const spanId = `${name}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  
  activeSpans.set(spanId, {
    name,
    startTime: performance.now(),
    metadata,
  });
  
  return spanId;
}

/**
 * End a performance span and record the duration
 */
export function endSpan(spanId: string): PerformanceSpan | null {
  const span = activeSpans.get(spanId);
  
  if (!span) {
    console.warn(`[Monitoring] Span not found: ${spanId}`);
    return null;
  }
  
  span.endTime = performance.now();
  span.duration = span.endTime - span.startTime;
  
  activeSpans.delete(spanId);
  
  // Record the metric
  recordMetric({
    name: `span.${span.name}`,
    value: span.duration,
    unit: 'ms',
    tags: span.metadata as Record<string, string>,
    timestamp: Date.now(),
  });
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Monitoring] Span "${span.name}": ${span.duration.toFixed(2)}ms`);
  }
  
  return span;
}

/**
 * Measure async function execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, unknown>
): Promise<T> {
  const spanId = startSpan(name, metadata);
  
  try {
    return await fn();
  } finally {
    endSpan(spanId);
  }
}

/**
 * Measure sync function execution time
 */
export function measureSync<T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, unknown>
): T {
  const spanId = startSpan(name, metadata);
  
  try {
    return fn();
  } finally {
    endSpan(spanId);
  }
}

// =============================================================================
// Custom Metrics
// =============================================================================

const metricsBuffer: Metric[] = [];
const METRICS_FLUSH_INTERVAL = 60000; // 1 minute
const MAX_BUFFER_SIZE = 100;

/**
 * Record a custom metric
 */
export function recordMetric(metric: Metric): void {
  metricsBuffer.push(metric);
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Monitoring] Metric: ${metric.name} = ${metric.value}${metric.unit}`);
  }
  
  // Flush if buffer is full
  if (metricsBuffer.length >= MAX_BUFFER_SIZE) {
    flushMetrics();
  }
}

/**
 * Record a counter metric (increment)
 */
export function incrementCounter(
  name: string,
  value: number = 1,
  tags?: Record<string, string>
): void {
  recordMetric({
    name,
    value,
    unit: 'count',
    tags,
    timestamp: Date.now(),
  });
}

/**
 * Record a timing metric
 */
export function recordTiming(
  name: string,
  durationMs: number,
  tags?: Record<string, string>
): void {
  recordMetric({
    name,
    value: durationMs,
    unit: 'ms',
    tags,
    timestamp: Date.now(),
  });
}

/**
 * Flush metrics to external service
 */
export function flushMetrics(): void {
  if (metricsBuffer.length === 0) return;
  
  const metrics = [...metricsBuffer];
  metricsBuffer.length = 0;
  
  // In production, send to metrics service
  if (process.env.NODE_ENV === 'production') {
    // Could send to DataDog, Prometheus, etc.
    console.log(JSON.stringify({
      type: 'metrics_batch',
      count: metrics.length,
      metrics: metrics.slice(0, 10), // Log sample
    }));
  }
}

// Auto-flush metrics periodically
if (typeof setInterval !== 'undefined') {
  setInterval(flushMetrics, METRICS_FLUSH_INTERVAL);
}

// =============================================================================
// Request Tracking
// =============================================================================

export interface RequestLog {
  method: string;
  path: string;
  statusCode: number;
  duration: number;
  userId?: string;
  userAgent?: string;
  ip?: string;
  timestamp: string;
}

/**
 * Log an HTTP request
 */
export function logRequest(log: RequestLog): void {
  // Record as metric
  recordTiming('http.request.duration', log.duration, {
    method: log.method,
    path: log.path,
    status: String(log.statusCode),
  });
  
  incrementCounter('http.request.count', 1, {
    method: log.method,
    status: String(log.statusCode),
  });
  
  // Log in production
  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify({
      type: 'request',
      ...log,
    }));
  } else if (log.duration > 1000) {
    // Log slow requests in development
    console.warn(`[Monitoring] Slow request: ${log.method} ${log.path} (${log.duration}ms)`);
  }
}

// =============================================================================
// Helpers
// =============================================================================

function generateErrorId(): string {
  return `err_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

// =============================================================================
// Web Vitals (Client-side)
// =============================================================================

export interface WebVitalsMetric {
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

/**
 * Report Web Vitals metric
 */
export function reportWebVital(metric: WebVitalsMetric): void {
  recordMetric({
    name: `webvitals.${metric.name.toLowerCase()}`,
    value: metric.value,
    unit: metric.name === 'CLS' ? 'count' : 'ms',
    tags: { rating: metric.rating },
    timestamp: Date.now(),
  });
  
  if (process.env.NODE_ENV === 'development') {
    console.log(`[WebVitals] ${metric.name}: ${metric.value} (${metric.rating})`);
  }
}
