"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Building2, Plus } from "lucide-react";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";

export default function CreateSampleOrgsPage() {
  const [isCreating, setIsCreating] = useState(false);
  const createSampleOrganizations = useMutation(api.domains.rbac.mutations.createSampleOrganizations);
  const { user } = useCurrentUser();

  const handleCreateSampleOrgs = async () => {
    setIsCreating(true);
    try {
      const orgIds = await createSampleOrganizations({});
      toast.success(`${orgIds.length} organizações de exemplo criadas com sucesso!`);
    } catch {
      console.error("Erro ao criar organizações:", error);
      toast.error("Erro ao criar organizações de exemplo");
    } finally {
      setIsCreating(false);
    }
  };

  if (!user || (user.role !== "partner" && user.role !== "master")) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card>
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-medium mb-2">Acesso Negado</h3>
            <p className="text-gray-600">
              Apenas partners e masters podem acessar esta página de debug.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Debug: Criar Organizações de Exemplo</h1>
        <p className="text-gray-600 mt-2">
          Esta página é apenas para desenvolvimento. Cria organizações de exemplo para testar o sistema de assets.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Organizações de Exemplo
          </CardTitle>
          <CardDescription>
            Clique no botão abaixo para criar 4 organizações de exemplo:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Restaurante do Mar (tipo: restaurant)</li>
              <li>Aventuras Fernando de Noronha (tipo: activity_service)</li>
              <li>Eventos Noronha (tipo: event_service)</li>
              <li>Aluguel de Veículos Ilha (tipo: rental_service)</li>
            </ul>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleCreateSampleOrgs}
            disabled={isCreating}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isCreating ? "Criando organizações..." : "Criar Organizações de Exemplo"}
          </Button>
        </CardContent>
      </Card>

      <Card className="border-orange-200 bg-orange-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-500 mt-2"></div>
            <div>
              <p className="text-sm font-medium text-orange-800">Atenção</p>
              <p className="text-sm text-orange-700">
                Esta funcionalidade é apenas para desenvolvimento e deve ser removida em produção.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 