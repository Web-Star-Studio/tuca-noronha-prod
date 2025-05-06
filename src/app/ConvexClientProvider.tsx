"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { ReactNode } from "react";
import { ptBR } from '@clerk/localizations';

// Criando uma instância do cliente Convex
const convexClient = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Chave pública do Clerk - idealmente deve vir de variáveis de ambiente
const CLERK_PUBLISHABLE_KEY = 'pk_test_aGFybWxlc3MtcG9sZWNhdC0yLmNsZXJrLmFjY291bnRzLmRldiQ';

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider 
      localization={ptBR} 
      publishableKey={CLERK_PUBLISHABLE_KEY}
    >
      <ConvexProviderWithClerk 
        client={convexClient} 
        useAuth={useAuth}
      >
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}