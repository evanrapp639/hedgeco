/**
 * Web Vitals tracking - temporarily simplified
 * TODO: Re-enable full functionality once web-vitals package is properly installed
 */

export type WebVitalsMetric = {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
};

export function reportWebVitals(onReport?: (metric: WebVitalsMetric) => void): void {
  // Temporarily disabled - log to console in dev
  if (process.env.NODE_ENV === 'development') {
    console.log('Web Vitals reporting disabled - package not installed');
  }
  
  // If callback provided, we'd normally call it with metrics
  // For now, this is a no-op
  if (onReport) {
    // Would report metrics here
  }
}

export function sendToAnalytics(metric: WebVitalsMetric): void {
  // Temporarily disabled
  if (process.env.NODE_ENV === 'development') {
    console.log('Would send metric to analytics:', metric.name, metric.value);
  }
}
