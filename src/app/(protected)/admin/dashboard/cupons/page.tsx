"use client";

import { CouponsGrid } from "@/components/dashboard/coupons";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Skeleton } from "@/components/ui/skeleton";

export default function CouponsPage() {
  const { user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Acesso negado</h2>
          <p className="text-muted-foreground">
            Você precisa estar logado para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  // Verificar permissões
  const canManageCoupons = user.role === "master" || user.role === "partner" || user.role === "employee";

  if (!canManageCoupons) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-semibold">Acesso negado</h2>
          <p className="text-muted-foreground">
            Você não tem permissão para gerenciar cupons.
          </p>
        </div>
      </div>
    );
  }

  // Determinar IDs baseados no role do usuário
  const partnerId = user.role === "partner" ? user._id : 
                   user.role === "employee" ? user.partnerId : 
                   undefined;
  
  const organizationId = user.organizationId;

  return (
    <div className="space-y-6">
      {/* Header da Página */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Cupons de Desconto</h1>
        <p className="text-muted-foreground">
          Gerencie cupons de desconto para seus produtos e serviços. 
          Crie, edite e monitore o uso dos cupons em tempo real.
        </p>
      </div>

      {/* Grid Principal de Cupons */}
      <CouponsGrid 
        partnerId={partnerId}
        organizationId={organizationId}
      />
    </div>
  );
}