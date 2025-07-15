"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PackageProposalCreationForm } from "@/components/dashboard/PackageProposalCreationForm";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { 
  ArrowLeftIcon, 
  FileText,
  Loader2,
  ShieldExclamationIcon
} from "lucide-react";
import { toast } from "sonner";

interface EditProposalClientPageProps {
  proposalId: Id<"packageProposals">;
}

export default function EditProposalClientPage({ proposalId }: EditProposalClientPageProps) {
  const router = useRouter();
  const { user } = useCurrentUser();

  const proposal = useQuery(api.domains.packageProposals.queries.getPackageProposal, {
    id: proposalId,
  });

  const updateProposal = useMutation(api.domains.packageProposals.mutations.updatePackageProposal);

  // Check if user can edit this proposal
  const canEdit = user && proposal && (
    user.role === "master" || proposal.adminId === user._id
  );

  if (proposal === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (proposal === null) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold mb-2">Proposta não encontrada</h2>
        <p className="text-gray-600 mb-4">A proposta não foi encontrada.</p>
        <Button onClick={() => router.back()}>
          <ArrowLeftIcon className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>
    );
  }

  // Access control check
  if (!canEdit) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <ShieldExclamationIcon className="h-10 w-10 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-red-800">
              Acesso Negado
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Você não tem permissão para editar esta proposta.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-600">
                Apenas usuários master ou o criador da proposta podem editá-la.
              </p>
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button onClick={() => router.back()} className="w-full">
                Voltar
              </Button>
              
              <Button variant="ghost" asChild className="w-full">
                <a href="/admin/dashboard/propostas-pacotes">
                  Ver Propostas
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = {
    draft: { label: "Rascunho", color: "bg-gray-500" },
    review: { label: "Em Revisão", color: "bg-yellow-500" },
    sent: { label: "Enviada", color: "bg-blue-500" },
    viewed: { label: "Visualizada", color: "bg-purple-500" },
    under_negotiation: { label: "Em Negociação", color: "bg-orange-500" },
    accepted: { label: "Aceita", color: "bg-green-500" },
    rejected: { label: "Rejeitada", color: "bg-red-500" },
    expired: { label: "Expirada", color: "bg-gray-500" },
    withdrawn: { label: "Retirada", color: "bg-gray-500" },
  };

  const handleUpdateProposal = async (data: any) => {
    try {
      await updateProposal({
        id: proposalId,
        ...data,
      });
      toast.success("Proposta atualizada com sucesso!");
      router.push("/admin/dashboard/propostas-pacotes");
    } catch (error) {
      console.error("Error updating proposal:", error);
      toast.error("Erro ao atualizar proposta");
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="h-9 w-9"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            <span className="sr-only">Voltar</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Editar Proposta</h1>
            <p className="text-muted-foreground">
              Proposta <span className="font-semibold text-gray-700">#{proposal.proposalNumber}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`${statusConfig[proposal.status as keyof typeof statusConfig]?.color} text-white`}>
            {statusConfig[proposal.status as keyof typeof statusConfig]?.label}
          </Badge>
        </div>
      </header>

      {/* Current Proposal Info */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Informações Atuais
          </CardTitle>
          <CardDescription>
            Dados da proposta que será editada.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Título</span>
              <span className="text-sm">{proposal.title}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Valor Total</span>
              <span className="text-sm font-semibold text-green-600">
                {formatCurrency(proposal.totalPrice)}
              </span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Válida até</span>
              <span className="text-sm">{formatDate(proposal.validUntil)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Componentes</span>
              <span className="text-sm">{proposal.components?.length || 0}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Criada em</span>
              <span className="text-sm">{formatDate(proposal.createdAt)}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-500">Última atualização</span>
              <span className="text-sm">{formatDate(proposal.updatedAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Editar Proposta</CardTitle>
          <CardDescription>
            Faça as alterações necessárias nos campos abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PackageProposalCreationForm
            packageRequestId={proposal.packageRequestId}
            existingProposal={proposal}
            onSuccess={() => {
              toast.success("Proposta atualizada com sucesso!");
              router.push("/admin/dashboard/propostas-pacotes");
            }}
            onCancel={() => router.back()}
            isEditing={true}
          />
        </CardContent>
      </Card>
    </div>
  );
} 