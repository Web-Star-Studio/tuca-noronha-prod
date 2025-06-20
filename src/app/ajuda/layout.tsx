import { Metadata } from "next";
import { HelpCircle } from "lucide-react";
import Header from "@/components/header/Header";
import Footer from "@/components/footer/Footer";

export const metadata: Metadata = {
  title: "Ajuda e Suporte | Turismo Noronha",
  description: "Central de ajuda com perguntas frequentes, guias detalhados e suporte ao cliente para sua viagem a Fernando de Noronha.",
  keywords: ["ajuda", "suporte", "FAQ", "dúvidas", "Fernando de Noronha", "turismo", "viagem"],
};

export default function AjudaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen">
      <Header />
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
          {children}
      </div>
      
      <Footer />
    </main>
  );
} 