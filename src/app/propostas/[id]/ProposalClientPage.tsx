"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { notFound, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, MapPinIcon, UsersIcon, CurrencyDollarIcon, ClockIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon, XCircleIcon, ShieldExclamationIcon } from "@heroicons/react/24/solid";
import { FileText, Download, Plane } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { toast } from "sonner";
import ProposalQuestionModal from "@/components/propostas/ProposalQuestionModal";
import { ProposalAcceptanceFlow } from "@/components/customer/ProposalAcceptanceFlow";

interface ProposalClientPageProps {
  proposalId: string;
}

export function ProposalClientPage({ proposalId }: ProposalClientPageProps) {
  const { userId, isLoaded } = useAuth();
  const router = useRouter();
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [showAcceptanceFlow, setShowAcceptanceFlow] = useState(false);
  
  // Query to get proposal by ID with error handling
  const proposalResult = useQuery(api.domains.packageProposals.queries.getPackageProposalWithAuth, {
    id: proposalId as Id<"packageProposals">,
  });

  // Query to get package request details
  const packageRequest = useQuery(
    api.domains.packageRequests.queries.getPackageRequest,
    proposalResult?.success && proposalResult.data ? { id: proposalResult.data.packageRequestId } : undefined
  );

  // Query to get admin details
  const admin = useQuery(
    api.domains.users.queries.getAdminBasicInfo,
    proposalResult?.success && proposalResult.data ? { userId: proposalResult.data.adminId } : undefined
  );

  // Handle auth redirect
  useEffect(() => {
    if (isLoaded && !userId) {
      // If user is not authenticated, redirect to sign-in
      router.push(`/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
  }, [isLoaded, userId, router]);

  // Handle proposal result
  useEffect(() => {
    if (proposalResult && !proposalResult.success) {
      if (proposalResult.errorType === "unauthenticated") {
        router.push(`/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`);
        return;
      }
      
      if (proposalResult.errorType === "access_denied") {
        router.push("/acesso-negado");
        return;
      }
      
      if (proposalResult.errorType === "not_found") {
        notFound();
        return;
      }
    }
  }, [proposalResult, router]);

  // Loading state
  if (!isLoaded || !userId) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Handle query loading
  if (proposalResult === undefined || packageRequest === undefined || admin === undefined) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Handle error states
  if (!proposalResult.success) {
    if (proposalResult.errorType === "access_denied") {
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
                Você não tem permissão para visualizar esta proposta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center space-y-3">
                <p className="text-sm text-gray-600">
                  Esta proposta é privada e só pode ser visualizada por usuários autorizados.
                </p>
              </div>
              
              <div className="flex flex-col space-y-2">
                <Button asChild className="w-full">
                  <Link href="/">
                    Voltar para a Home
                  </Link>
                </Button>
                
                <Button variant="ghost" asChild className="w-full">
                  <Link href="/ajuda">
                    Central de Ajuda
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-red-600 mb-4">Erro ao carregar proposta: {proposalResult.error}</p>
            <Button asChild>
              <Link href="/">Voltar para a Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const proposal = proposalResult.data;
  if (!proposal) {
    notFound();
  }

  const isExpired = proposal.validUntil < Date.now();
  const canAccept = (proposal.status === "sent" || proposal.status === "viewed") && !isExpired;
  const needsParticipantsData = proposal.status === "awaiting_participants_data";
  const hasPendingDocuments = proposal.status === "documents_uploaded";
  const isInProgress = ["participants_data_completed", "flight_booking_in_progress", "flight_booked"].includes(proposal.status);

  // Handle accepting proposal
  const handleAcceptProposal = () => {
    setShowAcceptanceFlow(true);
  };

  // Handle opening question modal
  const handleOpenQuestionModal = () => {
    setIsQuestionModalOpen(true);
  };

  const statusConfig = {
    review: { label: "Em Revisão", color: "bg-yellow-500" },
    sent: { label: "Enviada", color: "bg-blue-500" },
    viewed: { label: "Visualizada", color: "bg-purple-500" },
    under_negotiation: { label: "Em Negociação", color: "bg-orange-500" },
    accepted: { label: "Aceita", color: "bg-green-500" },
    awaiting_participants_data: { label: "Aguardando Seus Dados", color: "bg-blue-500" },
    participants_data_completed: { label: "Dados Enviados", color: "bg-green-500" },
    flight_booking_in_progress: { label: "Reservando Voos", color: "bg-yellow-500" },
    flight_booked: { label: "Voos Confirmados", color: "bg-green-500" },
    documents_uploaded: { label: "Documentos Disponíveis", color: "bg-purple-500" },
    awaiting_final_confirmation: { label: "Aguardando Confirmação", color: "bg-blue-500" },
    payment_pending: { label: "Pagamento Pendente", color: "bg-yellow-500" },
    payment_completed: { label: "Pago", color: "bg-green-500" },
    contracted: { label: "Contratado", color: "bg-green-600" },
    rejected: { label: "Rejeitada", color: "bg-red-500" },
    expired: { label: "Expirada", color: "bg-gray-400" },
    withdrawn: { label: "Retirada", color: "bg-gray-400" },
  };

  const currentStatus = isExpired ? "expired" : proposal.status;
  const statusInfo = statusConfig[currentStatus as keyof typeof statusConfig];
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{proposal.title}</h1>
              <p className="text-gray-600 mt-1">Proposta #{proposal.proposalNumber}</p>
            </div>
            <Badge className={`${statusInfo.color} text-white`}>
              {statusInfo.label}
            </Badge>
          </div>
          
          {proposal.summary && (
            <p className="text-lg text-gray-700 mb-4">{proposal.summary}</p>
          )}
          
          <p className="text-gray-600">{proposal.description}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Package Components */}
            <Card>
              <CardHeader>
                <CardTitle>Componentes do Pacote</CardTitle>
                <CardDescription>
                  Detalhes de todos os serviços incluídos na sua proposta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {proposal.components.map((component, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold text-lg">{component.name}</h4>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency(component.totalPrice)}</p>
                          <p className="text-sm text-gray-500">
                            {component.quantity}x {formatCurrency(component.unitPrice)}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-600 mb-2">{component.description}</p>
                      <div className="flex gap-2">
                        {component.included && (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            Incluído
                          </Badge>
                        )}
                        {component.optional && (
                          <Badge variant="outline" className="text-blue-600 border-blue-600">
                            Opcional
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-gray-600">
                          {component.type}
                        </Badge>
                      </div>
                      {component.notes && (
                        <p className="text-sm text-gray-500 mt-2 italic">{component.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Terms and Policies */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Termos de Pagamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-line">{proposal.paymentTerms}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Política de Cancelamento</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-line">{proposal.cancellationPolicy}</p>
                </CardContent>
              </Card>
            </div>

            {/* Flight Information - Show when available */}
            {(proposal.flightDetails || proposal.flightBookingNotes) && (
              <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <Plane className="h-5 w-5" />
                    Informações dos Voos
                  </CardTitle>
                  <CardDescription>
                    Detalhes sobre suas reservas de voo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {proposal.flightDetails && (
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2">Detalhes da Confirmação</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{proposal.flightDetails}</p>
                    </div>
                  )}
                  {proposal.flightBookingNotes && (
                    <div className="bg-white rounded-lg p-4 border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2">Observações</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{proposal.flightBookingNotes}</p>
                    </div>
                  )}
                  {proposal.flightBookingCompletedAt && (
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                      <CheckCircleIcon className="h-4 w-4" />
                      <span>Voos confirmados em {formatDate(proposal.flightBookingCompletedAt)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Contract Documents - Show when available */}
            {proposal.contractDocuments && proposal.contractDocuments.length > 0 && (
              <Card className="border-purple-200 bg-purple-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-800">
                    <FileText className="h-5 w-5" />
                    Documentos do Contrato
                  </CardTitle>
                  <CardDescription>
                    Documentos importantes para sua viagem
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {proposal.contractDocuments.map((doc: any, index: number) => (
                      <div key={index} className="bg-white border border-purple-200 rounded-lg p-4 flex items-center justify-between hover:bg-purple-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-purple-100 rounded-lg">
                            <FileText className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{doc.fileName}</p>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <span>{(doc.fileSize / 1024).toFixed(1)} KB</span>
                              <span>•</span>
                              <span>Enviado em {formatDate(doc.uploadedAt)}</span>
                            </div>
                            {doc.description && (
                              <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-purple-300 text-purple-700 hover:bg-purple-100"
                          onClick={() => {
                            // TODO: Implement document download
                            toast.info("Download de documentos será implementado em breve");
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar
                        </Button>
                      </div>
                    ))}
                  </div>
                  {proposal.documentsUploadedAt && (
                    <div className="flex items-center gap-2 text-sm text-purple-600 mt-4 pt-4 border-t border-purple-200">
                      <CheckCircleIcon className="h-4 w-4" />
                      <span>Documentos enviados em {formatDate(proposal.documentsUploadedAt)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Resumo de Preços</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(proposal.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Impostos</span>
                  <span>{formatCurrency(proposal.taxes)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Taxas</span>
                  <span>{formatCurrency(proposal.fees)}</span>
                </div>
                {proposal.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto</span>
                    <span>-{formatCurrency(proposal.discount)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(proposal.totalPrice)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Validity and Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Informações da Proposta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Válida até</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(proposal.validUntil)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <UsersIcon className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="font-medium">Responsável</p>
                    <p className="text-sm text-gray-600">{admin?.name}</p>
                  </div>
                </div>

                {admin?.email && (
                  <div className="flex items-center gap-2">
                    <EnvelopeIcon className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Contato</p>
                      <p className="text-sm text-gray-600">{admin.email}</p>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Action buttons based on proposal status */}
                {canAccept ? (
                  <div className="space-y-2">
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={handleAcceptProposal}
                    >
                      Aceitar Proposta
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleOpenQuestionModal}
                    >
                      Fazer Pergunta
                    </Button>
                  </div>
                ) : needsParticipantsData ? (
                  <div className="space-y-3">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-blue-600 font-medium">Preencha os Dados dos Participantes</p>
                      <p className="text-sm text-blue-500 mt-1">
                        Precisamos dos dados para reservar os voos
                      </p>
                    </div>
                    <Button 
                      className="w-full bg-blue-600 hover:bg-blue-700"
                      onClick={handleAcceptProposal}
                    >
                      <UsersIcon className="h-4 w-4 mr-2" />
                      Preencher Dados dos Participantes
                    </Button>
                  </div>
                ) : hasPendingDocuments ? (
                  <div className="space-y-3">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <p className="text-purple-600 font-medium">Documentos Disponíveis</p>
                      <p className="text-sm text-purple-500 mt-1">
                        Revise os documentos e dê sua confirmação final
                      </p>
                    </div>
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      onClick={handleAcceptProposal}
                    >
                      Revisar Documentos e Confirmar
                    </Button>
                  </div>
                ) : isInProgress ? (
                  <div className="space-y-3">
                    <div className="text-center p-4 bg-yellow-50 rounded-lg">
                      <p className="text-yellow-600 font-medium">Proposta em Andamento</p>
                      <p className="text-sm text-yellow-500 mt-1">
                        Nossa equipe está trabalhando na sua viagem
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleOpenQuestionModal}
                    >
                      Fazer Pergunta
                    </Button>
                  </div>
                ) : isExpired ? (
                  <div className="space-y-3">
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <p className="text-red-600 font-medium">Proposta Expirada</p>
                      <p className="text-sm text-red-500 mt-1">
                        Entre em contato para renovar
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleOpenQuestionModal}
                    >
                      Fazer Pergunta
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 font-medium">
                        Status: {statusInfo.label}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleOpenQuestionModal}
                    >
                      Fazer Pergunta
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Package Request Info */}
            {packageRequest && (
              <Card>
                <CardHeader>
                  <CardTitle>Sua Solicitação Original</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPinIcon className="h-5 w-5 text-gray-500" />
                    <div>
                      <p className="font-medium">Destino</p>
                      <p className="text-sm text-gray-600">{packageRequest.tripDetails?.destination}</p>
                    </div>
                  </div>

                  {packageRequest.tripDetails && (
                    <>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">Período</p>
                          <p className="text-sm text-gray-600">
                            {packageRequest.tripDetails.duration} dias
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <UsersIcon className="h-5 w-5 text-gray-500" />
                        <div>
                          <p className="font-medium">Pessoas</p>
                          <p className="text-sm text-gray-600">
                            {packageRequest.tripDetails.groupSize} pessoas
                          </p>
                        </div>
                      </div>

                      {packageRequest.tripDetails.budget && (
                        <div className="flex items-center gap-2">
                          <CurrencyDollarIcon className="h-5 w-5 text-gray-500" />
                          <div>
                            <p className="font-medium">Orçamento</p>
                            <p className="text-sm text-gray-600">
                              {formatCurrency(packageRequest.tripDetails.budget)}
                            </p>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center text-gray-600">
            <p className="mb-2">
              Tem alguma dúvida sobre esta proposta?
            </p>
            <div className="flex justify-center gap-4">
              <Link href="/ajuda" className="text-blue-600 hover:underline">
                Central de Ajuda
              </Link>
              <Link href="/contact" className="text-blue-600 hover:underline">
                Fale Conosco
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Question Modal */}
      {proposal && (
        <ProposalQuestionModal
          isOpen={isQuestionModalOpen}
          onClose={() => setIsQuestionModalOpen(false)}
          proposalId={proposal._id}
          proposalTitle={proposal.title}
        />
      )}

      {/* Proposal Acceptance Flow */}
      {showAcceptanceFlow && proposal && (
        <ProposalAcceptanceFlow
          proposal={proposal}
          onClose={() => setShowAcceptanceFlow(false)}
          onSuccess={() => {
            setShowAcceptanceFlow(false);
            // Reload to show updated status
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}