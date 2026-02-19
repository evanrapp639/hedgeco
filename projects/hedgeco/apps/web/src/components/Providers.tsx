"use client";

import { AuthProvider } from "@/contexts/AuthContext";
import { TRPCProvider } from "@/components/TRPCProvider";
import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <TRPCProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </TRPCProvider>
    </SessionProvider>
  );
}
