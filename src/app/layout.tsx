'use client'

import { playfairDisplay, montserrat } from "@/lib/fonts";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import {ConvexProviderWithClerk} from 'convex/react-clerk'
import { ptBR } from '@clerk/localizations'
import "./globals.css";
import { ConvexReactClient } from "convex/react";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  return (
    <ClerkProvider localization={ptBR} publishableKey='pk_test_aGFybWxlc3MtcG9sZWNhdC0yLmNsZXJrLmFjY291bnRzLmRldiQ'>
      <html lang="pt-BR">
        <body
          className={`${montserrat.className} ${playfairDisplay.className} antialiased`}
        >
          <ConvexProviderWithClerk client={convex} useAuth={useAuth}>{children}</ConvexProviderWithClerk>
        </body>
      </html>
    </ClerkProvider>
  );
}
