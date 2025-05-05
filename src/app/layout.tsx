import type { Metadata } from "next";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { playfairDisplay, montserrat } from "@/lib/fonts";
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
    <html lang="pt-BR">
      <body
        className={`${montserrat.className} ${playfairDisplay.className} antialiased`}
      >
        <ConvexClientProvider>{children}</ConvexClientProvider>
      </body>
    </html>
  );
}
