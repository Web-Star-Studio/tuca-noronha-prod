"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Loader2 } from "lucide-react";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface SubscriptionGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function SubscriptionGuard({ children, redirectTo = "/guia-assinatura" }: SubscriptionGuardProps) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const { user, isLoading: userLoading } = useCurrentUser();
  
  const hasSubscription = useQuery(
    api.domains.subscriptions.queries.hasActiveSubscription,
    user ? {} : "skip"
  );

  useEffect(() => {
    if (!userLoading && !user) {
      // Se não está logado, redireciona para login
      router.push("/sign-in");
      return;
    }

    if (hasSubscription !== undefined) {
      setIsChecking(false);
      
      if (!hasSubscription) {
        // Não tem assinatura ativa, redireciona para checkout
        const currentPath = window.location.pathname;
        const checkoutUrl = `${redirectTo}?redirect=${encodeURIComponent(currentPath)}`;
        router.push(checkoutUrl);
      }
    }
  }, [hasSubscription, user, userLoading, router, redirectTo]);

  if (userLoading || isChecking) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!user || !hasSubscription) {
    return null; // Não renderiza nada enquanto redireciona
  }

  return <>{children}</>;
} 