"use client";

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useAction } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Id } from '@/../convex/_generated/dataModel';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  MapPin, 
  Package, 
  MessageCircle,
  Eye,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Plane,
  Calendar,
  Users,
  DollarSign,
  AlertCircle,
  Info,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription as DialogDesc } from '@/components/ui/dialog';
import PackageRequestChatModal from '@/components/customer/PackageRequestChatModal';
import { ProposalDetailsView } from '@/components/dashboard/package-request-details/ProposalDetailsView';
import { ProposalActionsModal } from '@/components/proposals/ProposalActionsModal';
import { ProposalAcceptanceFlow } from '@/components/customer/ProposalAcceptanceFlow';

// Status configuration for package requests
const statusConfig: { [key: string]: { label: string; color: string; icon: React.ReactNode } } = {
  pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: <Clock className="h-4 w-4" /> },
  in_review: { label: "Em Análise", color: "bg-blue-100 text-blue-800 border-blue-200", icon: <Clock className="h-4 w-4" /> },
  proposal_sent: { label: "Proposta Enviada", color: "bg-purple-100 text-purple-800 border-purple-200", icon: <FileText className="h-4 w-4" /> },
  confirmed: { label: "Confirmado", color: "bg-green-100 text-green-800 border-green-200", icon: <CheckCircle className="h-4 w-4" /> },
  requires_revision: { label: "Requer Revisão", color: "bg-orange-100 text-orange-800 border-orange-200", icon: <Clock className="h-4 w-4" /> },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800 border-red-200", icon: <XCircle className="h-4 w-4" /> },
};

// Status configuration for proposals
const proposalStatusConfig: { [key: string]: { label: string; color: string; bgColor: string } } = {
  draft: { label: "Rascunho", color: "text-gray-600", bgColor: "bg-gray-100" },
  sent: { label: "Enviada", color: "text-blue-600", bgColor: "bg-blue-50" },
  viewed: { label: "Visualizada", color: "text-purple-600", bgColor: "bg-purple-50" },
  under_negotiation: { label: "Em Negociação", color: "text-orange-600", bgColor: "bg-orange-50" },
  accepted: { label: "Aceita", color: "text-green-600", bgColor: "bg-green-50" },
  awaiting_participants_data: { label: "Aguardando Dados", color: "text-blue-600", bgColor: "bg-blue-50" },
  participants_data_completed: { label: "Dados Enviados", color: "text-green-600", bgColor: "bg-green-50" },
  flight_booking_in_progress: { label: "Reservando Voos", color: "text-yellow-600", bgColor: "bg-yellow-50" },
  flight_booked: { label: "Voos Confirmados", color: "text-green-600", bgColor: "bg-green-50" },
  documents_uploaded: { label: "Documentos Disponíveis", color: "text-purple-600", bgColor: "bg-purple-50" },
  awaiting_final_confirmation: { label: "Aguardando Confirmação", color: "text-blue-600", bgColor: "bg-blue-50" },
  payment_pending: { label: "Pagamento Pendente", color: "text-yellow-600", bgColor: "bg-yellow-50" },
  contracted: { label: "Contratado", color: "text-green-700", bgColor: "bg-green-100" },
  rejected: { label: "Rejeitada", color: "text-red-600", bgColor: "bg-red-50" },
  expired: { label: "Expirada", color: "text-gray-500", bgColor: "bg-gray-100" },
};

export default function ClientPackageRequestDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const requestId = params.id as string;
  const { toast } = useToast();
  
  const [chatModalOpen, setChatModalOpen] = React.useState(false);
  const [selectedProposal, setSelectedProposal] = React.useState<any>(null);
  const [proposalModalOpen, setProposalModalOpen] = React.useState(false);
  const [proposalActionsModalOpen, setProposalActionsModalOpen] = React.useState(false);
  const [showAcceptanceFlow, setShowAcceptanceFlow] = React.useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = React.useState(false);
  
  const createPaymentPreferenceAction = useAction(api.domains.payments.actions.createPaymentPreferenceWithUpdate);
  
  // Função para processar pagamento
  const handleRetryPayment = async (proposal: any) => {
    if (!proposal.participantsData || proposal.participantsData.length === 0) {
      toast({
        title: "Dados incompletos",
        description: "Os dados dos participantes são necessários para processar o pagamento.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingPayment(true);
    
    try {
      const firstParticipant = proposal.participantsData[0];
      
      console.log("=== INICIANDO CRIAÇÃO DE PAGAMENTO ===");
      console.log("Proposta ID:", proposal._id);
      console.log("Participante:", firstParticipant);
      console.log("Valor:", proposal.totalPrice);
      
      const paymentData = {
        proposalId: proposal._id,
        items: [
          {
            id: proposal._id,
            title: proposal.title || "Pacote de Viagem",
            description: proposal.summary || proposal.description || "Pacote completo de viagem",
            quantity: 1,
            unit_price: proposal.totalPrice,
            currency_id: "BRL",
          }
        ],
        payer: {
          name: firstParticipant.fullName,
          email: firstParticipant.email || packageRequest?.customerInfo?.email || "",
          identification: {
            type: "CPF",
            number: firstParticipant.cpf.replace(/\D/g, ""),
          },
        },
      };
      
      console.log("Dados do pagamento:", JSON.stringify(paymentData, null, 2));
      
      const result = await createPaymentPreferenceAction(paymentData);
      
      console.log("Resultado da action:", result);

      if (result.success && (result.initPoint || result.sandboxInitPoint)) {
        // Use sandbox in dev, production in prod
        const checkoutUrl = process.env.NODE_ENV === 'production' 
          ? result.initPoint 
          : (result.sandboxInitPoint || result.initPoint);
        
        console.log("Sucesso! Redirecionando para:", checkoutUrl);
        
        toast({
          title: "Redirecionando para pagamento",
          description: "Você será redirecionado para o Mercado Pago...",
        });
        
        // Redirecionar diretamente para o checkout do Mercado Pago
        setTimeout(() => {
          window.location.href = checkoutUrl!;
        }, 1000);
      } else {
        console.error("Falha na criação:", result);
        const errorMsg = result.error || "Erro ao criar preferência de pagamento";
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error("=== ERRO AO PROCESSAR PAGAMENTO ===");
      console.error("Erro completo:", error);
      console.error("Stack:", error.stack);
      
      toast({
        title: "Erro ao processar pagamento",
        description: error.message || "Não foi possível criar a preferência de pagamento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

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
                  {proposals.map((proposal: any) => {
                    const proposalStatus = proposalStatusConfig[proposal.status] || proposalStatusConfig.draft;
                    const isExpired = proposal.validUntil < Date.now();
                    const hasFlightInfo = proposal.flightDetails || proposal.flightBookingNotes;
                    const hasDocuments = proposal.contractDocuments && proposal.contractDocuments.length > 0;
                    
                    return (
                      <div
                        key={proposal._id}
                        className={`border-2 rounded-xl p-5 hover:shadow-lg transition-all ${
                          proposal.status === 'payment_pending' 
                            ? 'bg-yellow-50 border-yellow-400' 
                            : 'bg-white'
                        }`}
                      >
                        {/* Payment Pending Alert */}
                        {proposal.status === 'payment_pending' && (
                          <div className="mb-4 p-3 bg-yellow-100 border-l-4 border-yellow-500 rounded">
                            <div className="flex items-center gap-2">
                              <CreditCard className="h-5 w-5 text-yellow-700" />
                              <div>
                                <p className="font-semibold text-yellow-900">Pagamento Pendente</p>
                                <p className="text-sm text-yellow-800">
                                  Clique no botão abaixo para realizar o pagamento e finalizar sua reserva.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-bold text-xl text-gray-900">{proposal.title}</h4>
                              <Badge className={`${proposalStatus.bgColor} ${proposalStatus.color} border-0`}>
                                {proposalStatus.label}
                              </Badge>
                              {isExpired && (
                                <Badge variant="destructive" className="text-xs">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Expirada
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 mb-3">
                              Proposta #{proposal.proposalNumber}
                            </p>
                            {proposal.summary && (
                              <p className="text-gray-700 text-sm leading-relaxed">{proposal.summary}</p>
                            )}
                          </div>
                        </div>

                        {/* Key Info Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-green-50 rounded-lg">
                              <DollarSign className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Valor Total</p>
                              <p className="font-bold text-green-600">{formatCurrency(proposal.totalPrice)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <Calendar className="h-4 w-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Válida até</p>
                              <p className="font-semibold text-sm">{format(new Date(proposal.validUntil), "dd/MM/yy", { locale: ptBR })}</p>
                            </div>
                          </div>
                          {proposal.participantsData && (
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-purple-50 rounded-lg">
                                <Users className="h-4 w-4 text-purple-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Participantes</p>
                                <p className="font-semibold text-sm">{proposal.participantsData.length}</p>
                              </div>
                            </div>
                          )}
                          {(hasFlightInfo || hasDocuments) && (
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-orange-50 rounded-lg">
                                <Info className="h-4 w-4 text-orange-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Info Adicional</p>
                                <p className="font-semibold text-sm">
                                  {[hasFlightInfo && 'Voos', hasDocuments && 'Docs'].filter(Boolean).join(', ')}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Flight Info - Inline Preview */}
                        {hasFlightInfo && (
                          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Plane className="h-4 w-4 text-blue-600" />
                              <h5 className="font-semibold text-blue-900 text-sm">Informações de Voos</h5>
                            </div>
                            {proposal.flightDetails && (
                              <p className="text-xs text-blue-800 line-clamp-2">{proposal.flightDetails}</p>
                            )}
                            {proposal.flightBookingCompletedAt && (
                              <p className="text-xs text-blue-600 mt-1">
                                Confirmado em {format(new Date(proposal.flightBookingCompletedAt), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            )}
                          </div>
                        )}

                        {/* Documents - Inline Preview */}
                        {hasDocuments && (
                          <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4 text-purple-600" />
                              <h5 className="font-semibold text-purple-900 text-sm">Documentos Disponíveis</h5>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {proposal.contractDocuments.slice(0, 3).map((doc: any, idx: number) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {doc.fileName}
                                </Badge>
                              ))}
                              {proposal.contractDocuments.length > 3 && (
                                <Badge variant="secondary" className="text-xs">+{proposal.contractDocuments.length - 3}</Badge>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProposal(proposal);
                              setProposalModalOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes Completos
                          </Button>
                          {['sent', 'viewed', 'under_negotiation'].includes(proposal.status) && !isExpired && (
                            <Button
                              size="sm"
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                              onClick={() => {
                                setSelectedProposal(proposal);
                                setProposalActionsModalOpen(true);
                              }}
                            >
                              Responder Proposta
                            </Button>
                          )}
                          {['awaiting_participants_data', 'documents_uploaded'].includes(proposal.status) && (
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => {
                                setSelectedProposal(proposal);
                                setShowAcceptanceFlow(true);
                              }}
                            >
                              Continuar Processo
                            </Button>
                          )}
                          {proposal.status === 'payment_pending' && (
                            <Button
                              size="sm"
                              className="bg-yellow-600 hover:bg-yellow-700 text-white"
                              onClick={() => handleRetryPayment(proposal)}
                              disabled={isProcessingPayment}
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              {isProcessingPayment ? 'Processando...' : 'Realizar Pagamento'}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
            setSelectedProposal(null);
            // Refresh the page data after actions
            window.location.reload();
          }}
          proposal={selectedProposal}
          packageRequest={packageRequest}
        />
      )}

      {/* Proposal Acceptance Flow */}
      {showAcceptanceFlow && selectedProposal && (
        <ProposalAcceptanceFlow
          proposal={selectedProposal}
          onClose={() => {
            setShowAcceptanceFlow(false);
            setSelectedProposal(null);
          }}
          onSuccess={() => {
            setShowAcceptanceFlow(false);
            setSelectedProposal(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
