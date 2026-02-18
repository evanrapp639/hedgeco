"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, RefreshCw, Home, Bug, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    
    // Log error to external service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // Call optional error handler
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo?: React.ErrorInfo | null;
  onRetry?: () => void;
  onGoHome?: () => void;
  showDetails?: boolean;
  className?: string;
}

export function ErrorFallback({
  error,
  errorInfo,
  onRetry,
  onGoHome,
  showDetails = true,
  className,
}: ErrorFallbackProps) {
  const [expanded, setExpanded] = React.useState(false);
  const [reported, setReported] = React.useState(false);

  const handleReport = async () => {
    // In real app, send to error tracking service
    console.log("Reporting error:", {
      message: error?.message,
      stack: error?.stack,
      componentStack: errorInfo?.componentStack,
    });
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));
    setReported(true);
  };

  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = "/";
    }
  };

  return (
    <div className={cn(
      "min-h-[400px] flex items-center justify-center p-4",
      className
    )}>
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-red-500" />
          </div>
          <CardTitle className="text-xl">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-slate-600">
            We're sorry, but something unexpected happened. Please try again or return to the homepage.
          </p>
          
          {showDetails && error && (
            <div className="text-left">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ChevronDown className={cn(
                  "h-4 w-4 transition-transform",
                  expanded && "rotate-180"
                )} />
                {expanded ? "Hide" : "Show"} error details
              </button>
              
              {expanded && (
                <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs font-mono overflow-auto max-h-48">
                  <div className="text-red-600 font-semibold mb-2">
                    {error.name}: {error.message}
                  </div>
                  {error.stack && (
                    <pre className="text-slate-600 whitespace-pre-wrap break-words">
                      {error.stack.split("\n").slice(1, 6).join("\n")}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-2">
          {onRetry && (
            <Button onClick={onRetry} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          <Button variant="outline" onClick={handleGoHome} className="flex-1">
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
          <Button 
            variant="ghost" 
            onClick={handleReport} 
            disabled={reported}
            className="flex-1"
          >
            <Bug className="h-4 w-4 mr-2" />
            {reported ? "Reported!" : "Report Issue"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

// Hook for programmatic error throwing (useful for async errors)
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);
  
  if (error) {
    throw error;
  }
  
  const throwError = React.useCallback((error: Error) => {
    setError(error);
  }, []);
  
  return { throwError };
}

// Simple inline error display for smaller components
export function InlineError({
  message = "Something went wrong",
  onRetry,
  className,
}: {
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn(
      "flex items-center gap-3 p-4 rounded-lg bg-red-50 border border-red-100",
      className
    )}>
      <AlertCircle className="h-5 w-5 text-red-500 shrink-0" />
      <span className="text-sm text-red-700 flex-1">{message}</span>
      {onRetry && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onRetry}
          className="text-red-600 hover:text-red-700 hover:bg-red-100"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export default ErrorBoundary;
