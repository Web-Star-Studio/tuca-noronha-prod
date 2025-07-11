"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PackageProposalCreationForm } from "@/components/dashboard/PackageProposalCreationForm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

interface CreateProposalClientPageProps {
  packageRequestId: Id<"packageRequests">;
}

export default function CreateProposalClientPage({ packageRequestId }: CreateProposalClientPageProps) {
  const router = useRouter();

  const packageRequest = useQuery(api.domains.packageRequests.queries.getPackageRequest, {
    id: packageRequestId,
  });

  if (packageRequest === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (packageRequest === null) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-2">Solicitação não encontrada</h2>
        <p className="text-gray-600 mb-4">A solicitação de pacote não foi encontrada.</p>
        <Button onClick={() => router.back()}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <h1 className="text-2xl font-bold">Criar Proposta</h1>
          </div>
          <p className="text-muted-foreground">
            Criar proposta para a solicitação de pacote
          </p>
        </div>
      </div>

      {/* Package Request Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Solicitação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Destino</p>
              <p className="text-lg font-semibold">{packageRequest.destination}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Grupo</p>
              <p className="text-lg font-semibold">
                {packageRequest.tripDetails?.groupSize || 'N/A'} pessoas
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Duração</p>
              <p className="text-lg font-semibold">
                {packageRequest.tripDetails?.duration || 'N/A'} dias
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Orçamento</p>
              <p className="text-lg font-semibold">
                {packageRequest.tripDetails?.budget 
                  ? formatCurrency(packageRequest.tripDetails.budget) 
                  : 'Não informado'
                }
              </p>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-gray-600">Status</p>
              <Badge variant="outline">{packageRequest.status}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-600">Criada em</p>
              <p className="text-sm text-gray-600">{formatDate(packageRequest.createdAt)}</p>
            </div>
          </div>

          {packageRequest.specialRequests && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium text-gray-600 mb-2">Requisitos Especiais</p>
              <p className="text-sm text-gray-700">{packageRequest.specialRequests}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proposal Creation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Criar Proposta</CardTitle>
        </CardHeader>
        <CardContent>
          <PackageProposalCreationForm
            packageRequestId={packageRequestId}
            onSuccess={(proposalId) => {
              toast.success("Proposta criada com sucesso!");
              router.push(`/admin/dashboard/propostas-pacotes`);
            }}
            onCancel={() => router.back()}
          />
        </CardContent>
      </Card>
    </div>
  );
} 