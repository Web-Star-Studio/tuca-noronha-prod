"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Id } from '@/../convex/_generated/dataModel';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Calendar, 
  MapPin, 
  Users, 
  DollarSign, 
  Package, 
  MessageCircle,
  Eye,
  FileText,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc } from '@/components/ui/dialog';
import { toast } from 'sonner';
import PackageRequestChatModal from '@/components/customer/PackageRequestChatModal';
import { ProposalDetailsView } from '@/components/dashboard/package-request-details/ProposalDetailsView';
import { ProposalActionsModal } from '@/components/proposals/ProposalActionsModal';

// Status configuration
const statusConfig: { [key: string]: { label: string; color: string; icon: React.ReactNode } } = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-4 w-4" /> },
  in_review: { label: "Em Análise", color: "bg-blue-100 text-blue-800", icon: <Clock className="h-4 w-4" /> },
  proposal_sent: { label: "Proposta Enviada", color: "bg-purple-100 text-purple-800", icon: <FileText className="h-4 w-4" /> },
  confirmed: { label: "Confirmado", color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-4 w-4" /> },
  requires_revision: { label: "Requer Revisão", color: "bg-orange-100 text-orange-800", icon: <Clock className="h-4 w-4" /> },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: <XCircle className="h-4 w-4" /> },
};

export default function ClientPackageRequestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;
  
  const [chatModalOpen, setChatModalOpen] = React.useState(false);
  const [selectedProposal, setSelectedProposal] = React.useState<any>(null);
  const [proposalModalOpen, setProposalModalOpen] = React.useState(false);
  const [proposalActionsModalOpen, setProposalActionsModalOpen] = React.useState(false);

  // Fetch request details
  const packageRequest = useQuery(
    api.domains.packageRequests.queries.getPackageRequest,
    requestId ? { id: requestId as Id<"packageRequests"> } : "skip"
  );

  // Fetch proposals for this request
  const proposals = useQuery(
    api.domains.packageProposals.queries.getProposalsForRequest,
    requestId ? { packageRequestId: requestId as Id<"packageRequests"> } : "skip"
  );

  // Helper function to format trip dates
  const formatTripDates = (tripDetails: any) => {
    if (tripDetails.flexibleDates) {
      const startMonth = tripDetails.startMonth;
      const endMonth = tripDetails.endMonth;
      
      if (startMonth && endMonth) {
        const formatMonth = (monthStr: string) => {
          const [year, month] = monthStr.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1);
          return format(date, "MMMM 'de' yyyy", { locale: ptBR });
        };
        
        if (startMonth === endMonth) {
          return `${formatMonth(startMonth)} (datas flexíveis)`;
        } else {
          return `${formatMonth(startMonth)} - ${formatMonth(endMonth)} (datas flexíveis)`;
        }
      }
      return "Datas flexíveis";
    } else {
      if (tripDetails.startDate && tripDetails.endDate) {
        const startDate = new Date(tripDetails.startDate);
        const endDate = new Date(tripDetails.endDate);
        
        if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
          return `${format(startDate, "dd/MM/yyyy", { locale: ptBR })} - ${format(endDate, "dd/MM/yyyy", { locale: ptBR })}`;
        }
      }
      return "Datas a definir";
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (!packageRequest) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando detalhes...</p>
        </div>
      </div>
    );
  }

  const status = statusConfig[packageRequest.status];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.push('/meu-painel')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Painel
        </Button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Solicitação #{packageRequest.requestNumber}
            </h1>
            <p className="text-gray-600 mt-2">
              Criada em {format(new Date(packageRequest._creationTime), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          <Badge className={`${status.color} px-4 py-2`}>
            {status.icon}
            <span className="ml-2">{status.label}</span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Trip Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trip Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Detalhes da Viagem
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Destino</label>
                  <p className="text-lg font-semibold">{packageRequest.tripDetails.destination}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Período</label>
                  <p className="text-lg">{formatTripDates(packageRequest.tripDetails)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Número de Pessoas</label>
                  <p className="text-lg">{packageRequest.tripDetails.groupSize} pessoas</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Orçamento</label>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(packageRequest.tripDetails.budget)}
                  </p>
                </div>
                {packageRequest.tripDetails.duration && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Duração</label>
                    <p className="text-lg">{packageRequest.tripDetails.duration} dias</p>
                  </div>
                )}
                {packageRequest.tripDetails.tripType && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Tipo de Viagem</label>
                    <p className="text-lg">{packageRequest.tripDetails.tripType}</p>
                  </div>
                )}
              </div>

              {packageRequest.tripDetails.additionalInfo && (
                <div className="pt-4 border-t">
                  <label className="text-sm font-medium text-gray-500">Informações Adicionais</label>
                  <p className="text-gray-700 mt-2">{packageRequest.tripDetails.additionalInfo}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Proposals Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Propostas
              </CardTitle>
              <CardDescription>
                Propostas enviadas para sua solicitação
              </CardDescription>
            </CardHeader>
            <CardContent>
              {proposals && proposals.length > 0 ? (
                <div className="space-y-4">
                  {proposals.map((proposal: any) => (
                    <div
                      key={proposal._id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{proposal.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Proposta #{proposal.proposalNumber}
                          </p>
                          {proposal.summary && (
                            <p className="text-gray-700 mt-2">{proposal.summary}</p>
                          )}
                          
                          <div className="flex items-center gap-4 mt-4 text-sm">
                            <span className="text-gray-500">
                              Válida até: {format(new Date(proposal.validUntil), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                            <span className="font-semibold text-green-600">
                              {formatCurrency(proposal.totalPrice)}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProposal(proposal);
                              setProposalModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                          {['sent', 'viewed', 'under_negotiation'].includes(proposal.status) && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700"
                              onClick={() => {
                                setSelectedProposal(proposal);
                                setProposalActionsModalOpen(true);
                              }}
                            >
                              Responder
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Nenhuma proposta enviada ainda</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Aguarde enquanto nossa equipe prepara as melhores opções para sua viagem
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preferences */}
          {packageRequest.preferences && Object.keys(packageRequest.preferences).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Preferências</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {packageRequest.preferences.accommodation && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Acomodação</label>
                      <p className="text-gray-700">{packageRequest.preferences.accommodation}</p>
                    </div>
                  )}
                  {packageRequest.preferences.mealPlan && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Refeições</label>
                      <p className="text-gray-700">{packageRequest.preferences.mealPlan}</p>
                    </div>
                  )}
                  {packageRequest.preferences.activities && packageRequest.preferences.activities.length > 0 && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-gray-500">Atividades de Interesse</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {packageRequest.preferences.activities.map((activity: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {activity}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Actions and Status */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => setChatModalOpen(true)}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Abrir Chat
              </Button>
              {proposals && proposals.length > 0 && (
                <Button
                  className="w-full"
                  variant="default"
                  onClick={() => {
                    setSelectedProposal(proposals[0]);
                    setProposalModalOpen(true);
                  }}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Última Proposta
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Status History */}
          {packageRequest.statusHistory && packageRequest.statusHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {packageRequest.statusHistory.map((history: any, index: number) => {
                    const historyStatus = statusConfig[history.status];
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          history.status === packageRequest.status ? 'bg-blue-600' : 'bg-gray-300'
                        }`} />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {historyStatus?.label || history.status}
                          </p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(history.timestamp), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </p>
                          {history.notes && (
                            <p className="text-xs text-gray-600 mt-1">{history.notes}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Admin Notes */}
          {packageRequest.adminNotes && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900">Notas da Administração</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-blue-800">{packageRequest.adminNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Chat Modal */}
      <PackageRequestChatModal
        isOpen={chatModalOpen}
        onClose={() => setChatModalOpen(false)}
        requestId={requestId as Id<"packageRequests">}
        requestNumber={packageRequest.requestNumber}
      />

      {/* Proposal Details Modal */}
      <Dialog open={proposalModalOpen} onOpenChange={setProposalModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProposal?.title}</DialogTitle>
            <DialogDesc>Proposta #{selectedProposal?.proposalNumber}</DialogDesc>
          </DialogHeader>
          {selectedProposal && <ProposalDetailsView proposal={selectedProposal} />}
        </DialogContent>
      </Dialog>

      {/* Proposal Actions Modal */}
      {selectedProposal && packageRequest && (
        <ProposalActionsModal
          isOpen={proposalActionsModalOpen}
          onClose={() => {
            setProposalActionsModalOpen(false);
            // Refresh the page data after actions
            window.location.reload();
          }}
          proposal={selectedProposal}
          packageRequest={packageRequest}
        />
      )}
    </div>
  );
}
