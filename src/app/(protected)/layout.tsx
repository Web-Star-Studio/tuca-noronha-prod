"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Define allowed roles for dashboard access
const ALLOWED_ROLES = ["partner", "employee", "master"];

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useCurrentUser();
  const router = useRouter();
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    // Skip check if still loading
    if (isLoading) return;
    
    // If not authenticated, redirect to sign-in
    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }
    
    // If authenticated but user data still loading, wait
    if (!user) return;
    
    // Check if user has required role
    const userRole = user.role || "traveler";
    if (!ALLOWED_ROLES.includes(userRole)) {
      // Show toast notification
      toast.error("Você não tem permissão para acessar esta área.", {
        description: "Área restrita a parceiros, funcionários e administradores.",
      });
      
      // Instead of redirecting, show access denied message in place
      setAccessDenied(true);
    } else {
      setAccessDenied(false);
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Show nothing while checking permissions
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-pulse text-slate-400">Verificando permissões...</div>
      </div>
    );
  }

  // If access is denied, show the message inline instead of redirecting
  if (accessDenied) {
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
            <Button asChild>
              <Link href="/" className="flex items-center gap-2">
                Ir para a Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If user has necessary role, render children
  return <>{children}</>;
} 