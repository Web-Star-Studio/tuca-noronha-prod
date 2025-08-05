"use client";

import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Id } from '@/../convex/_generated/dataModel';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProposalDocumentManager } from '../ProposalDocumentManager';

import { FileText, Plus, SendIcon, Eye, Clock, Upload, X, CheckCircle as CheckCircleIcon } from "lucide-react";

import { formatCurrency, formatDate } from './helpers';

interface ProposalsTabProps {
  requestId: Id<"packageRequests">;
  requestDetails: any;
  proposals: any[];
}

const statusConfig: { [key: string]: { label: string; color: string; icon: React.ReactNode } } = {
  draft: { label: "Rascunho", color: "bg-gray-200 text-gray-800", icon: <FileText className="h-3 w-3" /> },
  review: { label: "Em Revisão", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
  sent: { label: "Enviada", color: "bg-blue-100 text-blue-800", icon: <SendIcon className="h-3 w-3" /> },
  viewed: { label: "Visualizada", color: "bg-purple-100 text-purple-800", icon: <Eye className="h-3 w-3" /> },
  under_negotiation: { label: "Em Negociação", color: "bg-orange-100 text-orange-800", icon: <Clock className="h-3 w-3" /> },
  accepted: { label: "Aceita", color: "bg-green-100 text-green-800", icon: <CheckCircleIcon className="h-3 w-3" /> },
  rejected: { label: "Rejeitada", color: "bg-red-100 text-red-800", icon: <X className="h-3 w-3" /> },
  expired: { label: "Expirada", color: "bg-gray-100 text-gray-500", icon: <Clock className="h-3 w-3" /> },
  withdrawn: { label: "Retirada", color: "bg-gray-100 text-gray-500", icon: <X className="h-3 w-3" /> },
};

export function ProposalsTab({ requestId, requestDetails, proposals }: ProposalsTabProps) {
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("proposals");

  const sendProposal = useMutation(api.domains.packageProposals.mutations.sendPackageProposal);
  
  const handleSendProposal = async (proposalId: Id<"packageProposals">) => {
    try {
      await sendProposal({
        id: proposalId,
        sendEmail: true,
        sendNotification: true,
        customMessage: "Sua proposta personalizada está pronta! Confira todos os detalhes e entre em contato se tiver dúvidas.",
      });
      toast.success("Proposta enviada com sucesso!");
    } catch {
      console.error("Error sending proposal:", error);
      toast.error("Erro ao enviar proposta");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Propostas de Pacote</h3>
        <p className="text-sm text-gray-600">
          Gerencie propostas e documentos para a solicitação #{requestDetails.requestNumber}
        </p>
      </div>

      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="proposals" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Propostas ({proposals.length})
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Documentos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="proposals" className="space-y-6 mt-4">
          <div className="flex justify-end gap-2">
            <Button 
              onClick={() => window.open(`/admin/dashboard/propostas-pacotes/criar/${requestId}`, '_blank')}
              variant="default"
              className="flex items-center gap-2 group"
            >
              <Plus className="h-4 w-4 transition-transform duration-300 group-hover:rotate-90" />
              Criar Proposta Completa
            </Button>
          </div>

          {proposals.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma proposta criada
                </h3>
                <p className="text-gray-500 mb-4 text-sm">
                  Crie a primeira proposta para esta solicitação.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {proposals.map((proposal) => {
                const status = statusConfig[proposal.status as keyof typeof statusConfig];
                const isExpired = proposal.validUntil < Date.now();

                return (
                  <Card key={proposal._id} className="hover:shadow-lg transition-shadow duration-300 ease-in-out">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base text-gray-800">{proposal.title}</h4>
                          <p className="text-xs text-gray-500 mb-3">
                            Proposta #{proposal.proposalNumber}
                          </p>
                          
                          <div className="flex items-center gap-2 mb-4">
                            <Badge variant="outline" className={`${status.color} border-current`}>
                              {status.icon}
                              <span className="ml-1.5">{status.label}</span>
                            </Badge>
                            {isExpired && (
                              <Badge variant="destructive" className="text-xs">
                                Expirada
                              </Badge>
                            )}
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t pt-4 mt-4">
                            <div>
                              <span className="font-medium text-gray-500 block">Valor</span>
                              <span className="text-green-600 font-semibold">
                                {formatCurrency(proposal.totalPrice)}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500 block">Válida até</span>
                              <span>{formatDate(proposal.validUntil)}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500 block">Componentes</span>
                              <span>{proposal.components.length}</span>
                            </div>
                            <div>
                              <span className="font-medium text-gray-500 block">Criada</span>
                              <span>{formatDate(proposal.createdAt)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => {
                              setSelectedProposal(proposal);
                              setShowViewDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Detalhes
                          </Button>
                          
                          {proposal.status === "draft" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendProposal(proposal._id)}
                            >
                              <SendIcon className="h-4 w-4 mr-2" />
                              Enviar
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-6 mt-4">
          {proposals.length > 0 ? (
            <div className="space-y-4">
              {proposals.map((proposal) => (
                <Card key={proposal._id}>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {proposal.title}
                    </CardTitle>
                    <CardDescription>
                      Proposta #{proposal.proposalNumber} - Documentos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProposalDocumentManager proposalId={proposal._id} />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="pt-6 text-center py-8">
                <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Nenhuma proposta criada</p>
                <p className="text-sm text-gray-500">
                  Crie uma proposta para poder gerenciar seus documentos.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {/* View Proposal Dialog */}
      {selectedProposal && (
        <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProposal.title}</DialogTitle>
              <DialogDescription>Proposta #{selectedProposal.proposalNumber}</DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
                {/* ... (conteúdo do diálogo de visualização da proposta) ... */}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 