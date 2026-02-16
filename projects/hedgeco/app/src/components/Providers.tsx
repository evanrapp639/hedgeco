"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { TRPCProvider } from "@/components/TRPCProvider";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <TRPCProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </TRPCProvider>
  );
}
