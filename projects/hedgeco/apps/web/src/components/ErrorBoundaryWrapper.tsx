"use client";

import { ErrorBoundary, ErrorFallback } from "@/components/error-boundary";

interface ErrorBoundaryWrapperProps {
  children: React.ReactNode;
}

export function ErrorBoundaryWrapper({ children }: ErrorBoundaryWrapperProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log to external error tracking service (e.g., Sentry, LogRocket)
    console.error("Application error:", {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: typeof window !== "undefined" ? window.location.href : undefined,
    });
  };

  const handleReset = () => {
    // Clear any error state and try to recover
    window.location.reload();
  };

  return (
    <ErrorBoundary 
      onError={handleError}
      onReset={handleReset}
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <ErrorFallback
            error={new Error("An unexpected error occurred")}
            onRetry={() => window.location.reload()}
            onGoHome={() => window.location.href = "/"}
          />
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundaryWrapper;
