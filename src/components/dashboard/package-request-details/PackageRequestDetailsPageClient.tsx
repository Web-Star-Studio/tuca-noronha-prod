"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Mail, Phone, FileText, MessageSquare } from "lucide-react";

import type { Id } from "@/../convex/_generated/dataModel";
import { STATUS_COLORS, STATUS_LABELS } from "@/../convex/domains/packages/types";
import { usePackageRequestQueries } from "@/hooks/usePackageRequestQueries";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { RequestDetailsContent } from "./RequestDetailsContent";
import { AdminActionsTab } from "./AdminActionsTab";
import { ProposalsTab } from "./ProposalsTab";
import { ChatTab } from "./ChatTab";
import { SimpleProposalModal } from "./SimpleProposalModal";

interface PackageRequestDetailsPageClientProps {
  requestId: string;
}

export function PackageRequestDetailsPageClient({ requestId }: PackageRequestDetailsPageClientProps) {
  const router = useRouter();
  const convexRequestId = requestId as Id<"packageRequests">;
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);

  const {
    requestDetails,
    requestMessages,
    requestProposals,
    isLoading,
    refetchProposals, // Assuming the hook can return a refetch function
  } = usePackageRequestQueries({
    requestId: convexRequestId,
    enabled: true,
  });

  const handleProposalSuccess = () => {
    // The optimistic update from Convex should handle the UI update.
    // We can call a refetch function if the hook provides one for certainty.
    // refetchProposals?.(); 
  };

  const statusBadge = useMemo(() => {
    if (!requestDetails) return null;
    const status = requestDetails.status as keyof typeof STATUS_LABELS;
    const color = STATUS_COLORS[status] ?? "bg-gray-100 text-gray-800";
    return (
      <Badge className={`${color} px-3 py-1 text-sm`}>
        {STATUS_LABELS[status] || status}
      </Badge>
    );
  }, [requestDetails]);

  if (isLoading || requestDetails === undefined) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-600">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span>Carregando detalhes da solicitação...</span>
        </div>
      </div>
    );
  }

  if (!requestDetails) {
    return (
      <div className="mx-auto max-w-4xl space-y-6 pb-10">
        <Button variant="ghost" asChild className="px-0">
          <Link href="/admin/dashboard/solicitacoes-pacotes" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar para solicitações
          </Link>
        </Button>
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
            <h2 className="text-2xl font-semibold text-gray-800">Solicitação não encontrada</h2>
            <p className="mt-2 text-gray-500">
              A solicitação que você tentou acessar não existe ou foi removida.
            </p>
            <Button className="mt-6" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Button variant="ghost" asChild className="px-0 w-fit text-sm text-muted-foreground">
            <Link href="/admin/dashboard/solicitacoes-pacotes" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <span className="hidden sm:block">/</span>
          <span className="font-medium text-foreground">Solicitação #{requestDetails.requestNumber}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {statusBadge}
          <Button variant="outline" size="sm" className="gap-2" onClick={() => setIsChatModalOpen(true)}>
            <MessageSquare className="h-4 w-4" />
            Chat
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr,1fr] gap-6">
        <Card className="border-none shadow-none">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">
              Informações da Solicitação
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Detalhes completos sobre o perfil do cliente, viagem e preferências.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <RequestDetailsContent request={requestDetails} />
          </CardContent>
        </Card>

        <div className="space-y-6">

          <Card className="border-none shadow-none">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-semibold text-foreground">Histórico de propostas</CardTitle>
                <CardDescription className="text-sm text-muted-foreground">
                  Consulte as propostas e documentos já enviados.
                </CardDescription>
              </div>
              <Button size="sm" onClick={() => setIsProposalModalOpen(true)}>
                Criar Proposta
              </Button>
            </CardHeader>
            <CardContent>
              <ProposalsTab
                requestId={convexRequestId}
                requestDetails={requestDetails}
                proposals={requestProposals || []}
                showHeader={false}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <SimpleProposalModal 
        isOpen={isProposalModalOpen}
        onClose={() => setIsProposalModalOpen(false)}
        packageRequestId={convexRequestId}
        onSuccess={handleProposalSuccess}
      />

      <Dialog open={isChatModalOpen} onOpenChange={setIsChatModalOpen}>
        <DialogContent className="max-w-4xl overflow-hidden p-0">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Chat com o cliente</DialogTitle>
            <DialogDescription>
              Visualize e responda as mensagens desta solicitação sem sair da página.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 pb-6">
            <ChatTab
              requestId={convexRequestId}
              requestDetails={requestDetails}
              requestMessages={requestMessages || []}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
