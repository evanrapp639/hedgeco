"use client";

import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-8">
          <WifiOff className="h-12 w-12 text-slate-400" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-slate-900 mb-3">
          You're Offline
        </h1>

        {/* Description */}
        <p className="text-slate-500 mb-8 leading-relaxed">
          It looks like you've lost your internet connection. 
          Check your connection and try again.
        </p>

        {/* Actions */}
        <div className="space-y-3">
          <Button onClick={handleRefresh} className="w-full" size="lg">
            <RefreshCw className="h-5 w-5 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" asChild className="w-full" size="lg">
            <Link href="/">
              <Home className="h-5 w-5 mr-2" />
              Go Home
            </Link>
          </Button>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-400 mt-8">
          Some content may be available offline. 
          <br />
          Your data will sync when you're back online.
        </p>
      </div>
    </div>
  );
}
