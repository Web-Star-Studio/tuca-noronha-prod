"use client";

import { PartnerOnboarding } from "@/components/partners/PartnerOnboarding";
import { usePartner } from "@/lib/hooks/usePartner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function PagamentosPage() {
  const { currentUser, canBePartner } = usePartner();

  // Verificar se está carregando
  if (!currentUser) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Verificar se é partner
  if (!canBePartner) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Acesso Negado</h1>
          <p className="text-muted-foreground">
            Esta página é exclusiva para parceiros
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sem Permissão</CardTitle>
            <CardDescription>
              Você não tem permissão para acessar esta página.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Entre em contato com um administrador se você acredita que deveria ter acesso.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pagamentos</h1>
        <p className="text-muted-foreground">
          Configure sua conta para receber pagamentos
        </p>
      </div>

      <PartnerOnboarding />
    </div>
  );
} 