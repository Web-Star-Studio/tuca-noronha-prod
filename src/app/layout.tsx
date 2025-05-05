import type { Metadata } from "next";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { playfairDisplay, montserrat } from "@/lib/fonts";
import { ClerkProvider } from "@clerk/nextjs";
import { ptBR } from '@clerk/localizations'
import "./globals.css";
export const metadata: Metadata = {
  title: "Tuca Noronha",
  description: "Tuca Noronha",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={ptBR}>
      <html lang="pt-BR">
        <body
          className={`${montserrat.className} ${playfairDisplay.className} antialiased`}
        >
          <ConvexClientProvider>{children}</ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
