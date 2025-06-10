"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

// Define allowed roles for admin access - travelers are NOT allowed here
const ADMIN_ALLOWED_ROLES = ["partner", "employee", "master"];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated } = useCurrentUser();
  const router = useRouter();
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    // Debug log para entender o estado atual
    console.log('Admin Layout State:', { isLoading, isAuthenticated, hasUser: !!user, userRole: user?.role });
    
    // Skip check if still loading - wait for auth to stabilize
    if (isLoading) return;
    
    // If not authenticated and auth check is complete, redirect to sign-in
    if (!isAuthenticated && !isLoading) {
      console.log('Redirecting to sign-in: not authenticated');
      router.push("/sign-in");
      return;
    }
    
    // If authenticated but user data still loading, wait
    if (isAuthenticated && !user) return;
    
    // Only proceed with role check if we have user data
    if (user) {
      // Check if user has required admin role
      const userRole = user.role || "traveler";
      if (!ADMIN_ALLOWED_ROLES.includes(userRole)) {
        // Show toast notification
        toast.error("Você não tem permissão para acessar a área administrativa.", {
          description: "Área restrita a parceiros, funcionários e administradores.",
        });
        
        // Instead of redirecting, show access denied message in place
        setAccessDenied(true);
      } else {
        setAccessDenied(false);
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Show loading while checking permissions - but only if we're authenticated or still loading auth
  if (isLoading || (isAuthenticated && !user)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-slate-600">Verificando permissões administrativas...</div>
        </div>
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
            Acesso Negado - Área Administrativa
          </h1>
          
          <p className="text-slate-600 mb-8">
            Você não tem permissões para acessar a área administrativa. 
            Este conteúdo é restrito a parceiros, funcionários e administradores do sistema.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild>
              <Link href="/meu-painel" className="flex items-center gap-2">
                Ir para Meu Painel
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/" className="flex items-center gap-2">
                Ir para a Home
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // If user has necessary admin role, render children
  return <>{children}</>;
} 