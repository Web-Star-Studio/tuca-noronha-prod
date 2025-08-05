"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../../../../../../../convex/_generated/api";
import { Id } from "../../../../../../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PackageProposalCreationForm } from "@/components/dashboard/PackageProposalCreationForm";
import { formatCurrency } from "@/lib/utils";
import { 
  ArrowLeftIcon, 
  User, 
  MapPin, 
  Users, 
  Calendar, 
  DollarSign, 
  FileText,
  Sparkles,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { STATUS_LABELS, STATUS_COLORS } from "@/../convex/domains/packages/types";

interface CreateProposalClientPageProps {
  packageRequestId: Id<"packageRequests">;
}

const DetailItem = ({ icon, label, children, className }: { icon: React.ReactNode, label: string, children: React.ReactNode, className?: string }) => (
  <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-gray-50/50 ${className}`}>
    <div className="text-blue-600 mt-1">{icon}</div>
    <div>
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <div className="text-base font-semibold text-gray-800">{children}</div>
    </div>
  </div>
);

export default function CreateProposalClientPage({ packageRequestId }: CreateProposalClientPageProps) {
  const router = useRouter();

  const packageRequest = useQuery(api.domains.packageRequests.queries.getPackageRequest, {
    id: packageRequestId,
  });

  if (packageRequest === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
            <h1 className="text-2xl font-bold tracking-tight">Criar Nova Proposta</h1>
            <p className="text-muted-foreground">
              Para solicitação <span className="font-semibold text-gray-700">#{packageRequest.requestNumber}</span>
            </p>
          </div>
        </div>
      </header>

      {/* Package Request Summary */}
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-blue-600" />Resumo da Solicitação</CardTitle>
          <CardDescription>
            Informações chave do pedido do cliente para guiar a criação da proposta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DetailItem icon={<User className="h-5 w-5"/>} label="Cliente">
              {packageRequest.customerInfo.name}
            </DetailItem>
             <DetailItem icon={<MapPin className="h-5 w-5"/>} label="Destino">
              {packageRequest.tripDetails.destination}
            </DetailItem>
            <DetailItem icon={<Users className="h-5 w-5"/>} label="Grupo">
              {packageRequest.tripDetails?.groupSize || 'N/A'} pessoas
            </DetailItem>
            <DetailItem icon={<Calendar className="h-5 w-5"/>} label="Duração">
               {packageRequest.tripDetails?.duration || 'N/A'} dias
            </DetailItem>
            <DetailItem icon={<DollarSign className="h-5 w-5"/>} label="Orçamento">
              {packageRequest.tripDetails?.budget 
                ? formatCurrency(packageRequest.tripDetails.budget) 
                : 'Não informado'
              }
            </DetailItem>
            <div className="flex items-center p-3">
              <Badge className={`${STATUS_COLORS[packageRequest.status as keyof typeof STATUS_COLORS]} text-sm`}>
                {STATUS_LABELS[packageRequest.status as keyof typeof STATUS_LABELS]}
              </Badge>
            </div>
          </div>
          
          {packageRequest.specialRequirements && (
            <div className="mt-4 pt-4 border-t">
              <DetailItem icon={<Sparkles className="h-5 w-5"/>} label="Requisitos Especiais">
                <p className="text-sm text-gray-700 font-normal">{packageRequest.specialRequirements}</p>
              </DetailItem>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proposal Creation Form */}
      <Card>
        <CardHeader>
          <CardTitle>Formulário da Proposta</CardTitle>
           <CardDescription>Preencha os detalhes abaixo para criar o pacote personalizado.</CardDescription>
        </CardHeader>
        <CardContent>
          <PackageProposalCreationForm
            packageRequestId={packageRequestId}
            onSuccess={() => {
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