"use client";

import { useEffect } from "react";

/**
 * Client component that reports Core Web Vitals
 * Loads the web-vitals library asynchronously to avoid impacting bundle size
 */
export function WebVitalsReporter() {
  useEffect(() => {
    // Dynamically import and initialize web vitals reporting
    import("@/lib/web-vitals").then(({ reportWebVitals }) => {
      reportWebVitals();
    });
  }, []);

  // This component renders nothing
  return null;
}

export default WebVitalsReporter;
