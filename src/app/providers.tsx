"use client";

import type { ReactNode } from "react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/auth";
import { QueryProvider } from "@/lib/providers/QueryProvider";
import { OnboardingRedirect } from "@/components/onboarding/OnboardingRedirect";
import { ClerkCaptchaProvider } from "@/components/ClerkCaptchaProvider";
import { ptBR } from "@clerk/localizations";

// Initialize the Convex client
const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL ?? "");

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider localization={ptBR} publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>
      <ClerkCaptchaProvider>
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
          <AuthProvider>
            <QueryProvider>
              <OnboardingRedirect>
                {children}
              </OnboardingRedirect>
              <Toaster richColors />
            </QueryProvider>
          </AuthProvider>
        </ConvexProviderWithClerk>
      </ClerkCaptchaProvider>
    </ClerkProvider>
  );
} 