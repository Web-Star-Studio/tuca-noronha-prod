"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ShieldAlert, ChevronLeft, Home } from "lucide-react";
import Link from "next/link";

export default function AccessDeniedPage() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="mx-auto max-w-md p-6 text-center">
        <div className="mb-8 flex justify-center">
          <div className="rounded-full bg-red-100 p-3">
            <ShieldAlert className="h-12 w-12 text-red-600" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-3">
          Acesso Negado
        </h1>
        
        <p className="text-slate-600 mb-8">
          Você não tem permissões para acessar esta área. 
          Este conteúdo é restrito a parceiros, funcionários e administradores do sistema.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            variant="outline" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Voltar
          </Button>
          
          <Button asChild>
            <Link href="/" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Ir para a Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 