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
import { ProposalDetailsView } from './ProposalDetailsView';
import { SimpleProposalModal } from './SimpleProposalModal';

import { FileText, SendIcon, Eye, Clock, Upload, X, CheckCircle as CheckCircleIcon, Edit, MessageCircle, AlertTriangle, Users, Plane, FileUp } from "lucide-react";

import { formatCurrency, formatDate } from './helpers';

interface ProposalsTabProps {
  requestId: Id<"packageRequests">;
  requestDetails: any;
  proposals: any[];
  showHeader?: boolean;
}

const statusConfig: { [key: string]: { label: string; color: string; icon: React.ReactNode } } = {
  draft: { label: "Rascunho", color: "bg-gray-200 text-gray-800", icon: <FileText className="h-3 w-3" /> },
  review: { label: "Em Revisão", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
  sent: { label: "Enviada", color: "bg-blue-100 text-blue-800", icon: <SendIcon className="h-3 w-3" /> },
  viewed: { label: "Visualizada", color: "bg-purple-100 text-purple-800", icon: <Eye className="h-3 w-3" /> },
  under_negotiation: { label: "Em Negociação", color: "bg-orange-100 text-orange-800", icon: <Clock className="h-3 w-3" /> },
  accepted: { label: "Aceita", color: "bg-green-100 text-green-800", icon: <CheckCircleIcon className="h-3 w-3" /> },
  awaiting_participants_data: { label: "Aguardando Dados", color: "bg-blue-100 text-blue-800", icon: <Clock className="h-3 w-3" /> },
  participants_data_completed: { label: "Dados Recebidos", color: "bg-green-100 text-green-800", icon: <CheckCircleIcon className="h-3 w-3" /> },
  flight_booking_in_progress: { label: "Reservando Voos", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
  flight_booked: { label: "Voos Confirmados", color: "bg-green-100 text-green-800", icon: <CheckCircleIcon className="h-3 w-3" /> },
  documents_uploaded: { label: "Documentos Prontos", color: "bg-green-100 text-green-800", icon: <FileText className="h-3 w-3" /> },
  awaiting_final_confirmation: { label: "Aguardando Confirmação", color: "bg-blue-100 text-blue-800", icon: <Clock className="h-3 w-3" /> },
  payment_pending: { label: "Pagamento Pendente", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
  payment_completed: { label: "Pago", color: "bg-green-100 text-green-800", icon: <CheckCircleIcon className="h-3 w-3" /> },
  contracted: { label: "Contratado", color: "bg-green-100 text-green-800", icon: <CheckCircleIcon className="h-3 w-3" /> },
  rejected: { label: "Rejeitada", color: "bg-red-100 text-red-800", icon: <X className="h-3 w-3" /> },
  expired: { label: "Expirada", color: "bg-gray-100 text-gray-500", icon: <Clock className="h-3 w-3" /> },
  withdrawn: { label: "Retirada", color: "bg-gray-100 text-gray-500", icon: <X className="h-3 w-3" /> },
};

export function ProposalsTab({ requestId, requestDetails, proposals, showHeader = true }: ProposalsTabProps) {
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("proposals");
  const [showFlightBookingDialog, setShowFlightBookingDialog] = useState(false);
  const [showDocumentUploadDialog, setShowDocumentUploadDialog] = useState(false);
  const [flightNotes, setFlightNotes] = useState("");
  const [flightDetails, setFlightDetails] = useState("");
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const sendProposal = useMutation(api.domains.packageProposals.mutations.sendPackageProposal);
  const startFlightBooking = useMutation(api.domains.packageProposals.mutations.startFlightBooking);
  const confirmFlightBooked = useMutation(api.domains.packageProposals.mutations.confirmFlightBooked);
  const uploadContractDocuments = useMutation(api.domains.packageProposals.mutations.uploadContractDocuments);
  
  const handleSendProposal = async (proposalId: Id<"packageProposals">) => {
    try {
      await sendProposal({
        id: proposalId,
        sendEmail: true,
        sendNotification: true,
        customMessage: "Sua proposta personalizada está pronta! Confira todos os detalhes e entre em contato se tiver dúvidas.",
      });
      toast.success("Proposta enviada com sucesso!");
    } catch (error) {
      console.error("Error sending proposal:", error);
      toast.error("Erro ao enviar proposta");
    }
  };

  const handleEditSuccess = () => {
    setShowEditDialog(false);
    // Data will refetch automatically via Convex
  };

  const handleStartFlightBooking = async (proposalId: Id<"packageProposals">) => {
    try {
      await startFlightBooking({
        proposalId,
        notes: flightNotes || "Iniciando processo de reserva de voos",
      });
      toast.success("Processo de reserva de voos iniciado!");
      setFlightNotes("");
    } catch (error) {
      console.error("Error starting flight booking:", error);
      toast.error("Erro ao iniciar reserva de voos");
    }
  };

  const handleConfirmFlightBooked = async (proposalId: Id<"packageProposals">) => {
    try {
      await confirmFlightBooked({
        proposalId,
        flightDetails: flightDetails || "Voos confirmados",
        notes: flightNotes,
      });
      toast.success("Voos confirmados com sucesso!");
      setFlightDetails("");
      setFlightNotes("");
      setShowFlightBookingDialog(false);
    } catch (error) {
      console.error("Error confirming flight booking:", error);
      toast.error("Erro ao confirmar voos");
    }
  };

  const handleFileUpload = async (files: FileList) => {
    setIsUploading(true);
    try {
      const documents = [];
      
      for (const file of Array.from(files)) {
        // Simulate file upload to storage (replace with actual storage integration)
        const storageId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        documents.push({
          storageId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          description: "",
        });
      }
      
      setUploadedDocuments([...uploadedDocuments, ...documents]);
      toast.success(`${documents.length} arquivo(s) adicionado(s)`);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Erro ao fazer upload dos arquivos");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadDocuments = async (proposalId: Id<"packageProposals">) => {
    if (uploadedDocuments.length === 0) {
      toast.error("Adicione pelo menos um documento");
      return;
    }

    try {
      await uploadContractDocuments({
        proposalId,
        documents: uploadedDocuments,
      });
      toast.success("Documentos enviados com sucesso!");
      setUploadedDocuments([]);
      setShowDocumentUploadDialog(false);
    } catch (error) {
      console.error("Error uploading documents:", error);
      toast.error("Erro ao enviar documentos");
    }
  };

  const removeDocument = (index: number) => {
    setUploadedDocuments(uploadedDocuments.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {showHeader && (
        <div>
          <h3 className="text-lg font-semibold">Propostas de Pacote</h3>
          <p className="text-sm text-gray-600">
            Gerencie propostas e documentos para a solicitação #{requestDetails.requestNumber}
          </p>
        </div>
      )}

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

                const hasRevisionRequest = proposal.status === "under_negotiation" && proposal.revisionNotes;
                const isRejected = proposal.status === "rejected";

                return (
                  <Card key={proposal._id} className={`hover:shadow-lg transition-shadow duration-300 ease-in-out ${
                    hasRevisionRequest ? 'border-orange-300 bg-orange-50/30' : ''
                  }`}>
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
                            {proposal.status === "under_negotiation" && proposal.revisionNotes && (
                              <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300 text-xs">
                                <MessageCircle className="h-3 w-3 mr-1" />
                                Revisão Solicitada
                              </Badge>
                            )}
                            {isExpired && (
                              <Badge variant="destructive" className="text-xs">
                                Expirada
                              </Badge>
                            )}
                          </div>
                          
                          {/* Seção de Revisão (se houver) */}
                          {proposal.status === "under_negotiation" && proposal.revisionNotes && (
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                              <div className="flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h5 className="font-semibold text-orange-800">
                                      Revisão Solicitada pelo Cliente
                                    </h5>
                                    {proposal.lastRevisionRequest && (
                                      <Badge variant="outline" className="text-xs bg-orange-100 text-orange-700 border-orange-300">
                                        {formatDate(proposal.lastRevisionRequest)}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="bg-white border border-orange-200 rounded p-3">
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                      {proposal.revisionNotes}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Seção de Dados dos Participantes (se houver) */}
                          {(proposal.status === "participants_data_completed" || 
                            proposal.status === "flight_booking_in_progress" || 
                            proposal.status === "flight_booked" ||
                            proposal.status === "documents_uploaded" ||
                            proposal.status === "awaiting_final_confirmation" ||
                            proposal.status === "payment_pending" ||
                            proposal.status === "contracted") && proposal.participantsData && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                              <div className="flex items-start gap-3">
                                <Users className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h5 className="font-semibold text-blue-800">
                                      Dados dos Participantes Recebidos
                                    </h5>
                                    {proposal.participantsDataSubmittedAt && (
                                      <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                                        {formatDate(proposal.participantsDataSubmittedAt)}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="bg-white border border-blue-200 rounded p-3">
                                    <div className="grid gap-2">
                                      {proposal.participantsData.map((participant: any, index: number) => (
                                        <div key={index} className="text-sm border-b border-gray-100 pb-2 last:border-b-0">
                                          <span className="font-medium">{participant.fullName}</span>
                                          <span className="text-gray-500 ml-2">
                                            {participant.birthDate} • CPF: {participant.cpf}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Seção de Detalhes dos Voos (se houver) */}
                          {(proposal.status === "flight_booked" ||
                            proposal.status === "documents_uploaded" ||
                            proposal.status === "awaiting_final_confirmation" ||
                            proposal.status === "payment_pending" ||
                            proposal.status === "contracted") && proposal.flightDetails && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                              <div className="flex items-start gap-3">
                                <Plane className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <h5 className="font-semibold text-green-800">
                                      Voos Confirmados
                                    </h5>
                                    {proposal.flightBookingCompletedAt && (
                                      <Badge variant="outline" className="text-xs bg-green-100 text-green-700 border-green-300">
                                        {formatDate(proposal.flightBookingCompletedAt)}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="bg-white border border-green-200 rounded p-3">
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                      {proposal.flightDetails}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

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
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              setSelectedProposal(proposal);
                              setShowViewDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Detalhes
                          </Button>
                          
                          {/* Edit button - show for editable statuses */}
                          {["draft", "review", "under_negotiation", "rejected"].includes(proposal.status) && (
                            <Button
                              variant="default"
                              size="sm"
                              className={
                                hasRevisionRequest 
                                  ? "text-white bg-orange-600 hover:bg-orange-700" 
                                  : isRejected 
                                  ? "text-white bg-red-600 hover:bg-red-700"
                                  : ""
                              }
                              onClick={() => {
                                setSelectedProposal(proposal);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              {hasRevisionRequest ? "Revisar Proposta" : isRejected ? "Refazer Proposta" : "Editar"}
                            </Button>
                          )}
                          
                          {/* Send proposal button */}
                          {proposal.status === "draft" && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleSendProposal(proposal._id)}
                            >
                              <SendIcon className="h-4 w-4 mr-2" />
                              Enviar
                            </Button>
                          )}
                          
                          {/* Contract flow buttons - conditional based on includesAirfare */}
                          {proposal.status === "participants_data_completed" && requestDetails?.tripDetails?.includesAirfare === true && (
                            <Button
                              size="sm"
                              variant="default"
                              className="text-white bg-blue-600 hover:bg-blue-700"
                              onClick={() => handleStartFlightBooking(proposal._id)}
                            >
                              <Plane className="h-4 w-4 mr-2" />
                              Iniciar Reserva Voos
                            </Button>
                          )}
                          
                          {proposal.status === "participants_data_completed" && requestDetails?.tripDetails?.includesAirfare === false && (
                            <Button
                              size="sm"
                              variant="default"
                              className="text-white bg-purple-600 hover:bg-purple-700"
                              onClick={() => {
                                setSelectedProposal(proposal);
                                setShowDocumentUploadDialog(true);
                              }}
                            >
                              <FileUp className="h-4 w-4 mr-2" />
                              Upload Documentos
                            </Button>
                          )}
                          
                          {proposal.status === "flight_booking_in_progress" && (
                            <Button
                              size="sm"
                              variant="default"
                              className="text-white bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setSelectedProposal(proposal);
                                setShowFlightBookingDialog(true);
                              }}
                            >
                              <CheckCircleIcon className="h-4 w-4 mr-2" />
                              Confirmar Voos
                            </Button>
                          )}
                          
                          {proposal.status === "flight_booked" && (
                            <Button
                              size="sm"
                              variant="default"
                              className="text-white bg-purple-600 hover:bg-purple-700"
                              onClick={() => {
                                setSelectedProposal(proposal);
                                setShowDocumentUploadDialog(true);
                              }}
                            >
                              <FileUp className="h-4 w-4 mr-2" />
                              Upload Documentos
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
            <ProposalDetailsView proposal={selectedProposal} />
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Proposal Dialog */}
      {selectedProposal && (
        <SimpleProposalModal
          isOpen={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          packageRequestId={requestId}
          onSuccess={handleEditSuccess}
          isEditing={true}
          existingProposal={selectedProposal}
          customerName={requestDetails?.customerInfo?.name}
        />
      )}

      {/* Flight Booking Confirmation Dialog */}
      <Dialog open={showFlightBookingDialog} onOpenChange={setShowFlightBookingDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Confirmar Reserva de Voos</DialogTitle>
            <DialogDescription>
              Confirme que os voos foram reservados e adicione os detalhes de confirmação.
            </DialogDescription>
          </DialogHeader>
          
          {selectedProposal && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Proposta: {selectedProposal.title}</h4>
                <p className="text-sm text-gray-600">#{selectedProposal.proposalNumber}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Detalhes dos Voos Confirmados *</label>
                  <textarea
                    className="w-full mt-1 p-2 border rounded-md"
                    rows={3}
                    placeholder="Ex: Voo SP-FEN 15/12 às 08:00, Volta FEN-SP 25/12 às 16:30..."
                    value={flightDetails}
                    onChange={(e) => setFlightDetails(e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Notas Adicionais</label>
                  <textarea
                    className="w-full mt-1 p-2 border rounded-md"
                    rows={2}
                    placeholder="Observações sobre a reserva..."
                    value={flightNotes}
                    onChange={(e) => setFlightNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowFlightBookingDialog(false);
                    setFlightDetails("");
                    setFlightNotes("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  className="text-white bg-green-600 hover:bg-green-700"
                  onClick={() => handleConfirmFlightBooked(selectedProposal._id)}
                  disabled={!flightDetails.trim()}
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Confirmar Voos Reservados
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Document Upload Dialog */}
      <Dialog open={showDocumentUploadDialog} onOpenChange={setShowDocumentUploadDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload de Documentos Contratuais</DialogTitle>
            <DialogDescription>
              Faça upload dos documentos necessários para o cliente revisar e dar confirmação final.
            </DialogDescription>
          </DialogHeader>
          
          {selectedProposal && (
            <div className="space-y-6">
              <div>
                <h4 className="font-medium mb-2">Proposta: {selectedProposal.title}</h4>
                <p className="text-sm text-gray-600">#{selectedProposal.proposalNumber}</p>
              </div>

              {/* File Upload Area */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Adicionar Documentos</label>
                  <div className="mt-2">
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-4 text-gray-500" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Clique para enviar</span> ou arraste e solte
                          </p>
                          <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG (MAX. 10MB cada)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                          disabled={isUploading}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Uploaded Documents List */}
                {uploadedDocuments.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Documentos Adicionados ({uploadedDocuments.length})</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {uploadedDocuments.map((doc, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <FileText className="h-5 w-5 text-blue-500" />
                            <div>
                              <p className="text-sm font-medium">{doc.fileName}</p>
                              <p className="text-xs text-gray-500">
                                {doc.fileType} • {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDocument(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowDocumentUploadDialog(false);
                    setUploadedDocuments([]);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  className="text-white bg-purple-600 hover:bg-purple-700"
                  onClick={() => handleUploadDocuments(selectedProposal._id)}
                  disabled={uploadedDocuments.length === 0 || isUploading}
                >
                  <FileUp className="h-4 w-4 mr-2" />
                  {isUploading ? "Enviando..." : `Enviar ${uploadedDocuments.length} Documento(s)`}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
