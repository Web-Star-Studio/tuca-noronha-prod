import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard de Eventos | TripNative",
  description: "Gerencie os eventos da plataforma.",
};

export default function EventosLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="w-full">
      {children}
    </div>
  );
}
