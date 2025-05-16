"use client";

import type { ReactNode } from "react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";
import { QueryProvider } from "@/lib/providers/QueryProvider";

// Initialize the Convex client
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL ?? "");

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <AuthProvider>
          <QueryProvider>
            {children}
            <Toaster richColors />
          </QueryProvider>
        </AuthProvider>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
} 