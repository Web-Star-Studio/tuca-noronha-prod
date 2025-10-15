"use client";

import React, { useState } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { 
  CheckCircle,
  Clock,
  CreditCard,
  Download,
  FileText, 
  Plus,
  Users,
  X 
} from "lucide-react";
import { renderMarkdownText } from "@/lib/renderMarkdown";

import { formatCurrency, formatDate } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Participant {
  fullName: string;
  birthDate: string;
  cpf: string;
  email?: string;
  phone?: string;
}

interface ProposalAcceptanceFlowProps {
  proposal: any;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ProposalAcceptanceFlow({ proposal, onClose, onSuccess }: ProposalAcceptanceFlowProps) {
  const [currentStep, setCurrentStep] = useState<'accept' | 'participants' | 'documents' | 'final'>('accept');
  const [participants, setParticipants] = useState<Participant[]>([
    { fullName: "", birthDate: "", cpf: "", email: "", phone: "" }
  ]);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const acceptProposalInitial = useMutation(api.domains.packageProposals.mutations.acceptProposalInitial);
  const submitParticipantsData = useMutation(api.domains.packageProposals.mutations.submitParticipantsData);
  const giveFinalConfirmation = useMutation(api.domains.packageProposals.mutations.giveFinalConfirmation);
  const createPaymentPreferenceAction = useAction(api.domains.payments.actions.createPaymentPreferenceWithUpdate);

  const handleAcceptProposal = async () => {
    try {
      await acceptProposalInitial({
        proposalId: proposal._id,
      });
      toast.success("Proposta aceita! Preencha os dados dos participantes.");
      setCurrentStep('participants');
    } catch (error) {
      console.error("Error accepting proposal:", error);
      toast.error("Erro ao aceitar proposta");
    }
  };

  const handleSubmitParticipants = async () => {
    const validParticipants = participants.filter(p => 
      p.fullName.trim() && p.birthDate.trim() && p.cpf.trim()
    );

    if (validParticipants.length === 0) {
      toast.error("Adicione pelo menos um participante com dados completos");
      return;
    }

    try {
      await submitParticipantsData({
        proposalId: proposal._id,
        participantsData: validParticipants,
      });
      toast.success("Dados dos participantes enviados! Aguarde a confirmação dos voos.");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error submitting participants:", error);
      toast.error("Erro ao enviar dados dos participantes");
    }
  };

  const handleFinalConfirmation = async () => {
    if (!termsAccepted) {
      toast.error("Você deve aceitar os termos e condições");
      return;
    }

    try {
      // First, give final confirmation
      await giveFinalConfirmation({
        proposalId: proposal._id,
        termsAccepted,
      });
      
      toast.success("Confirmação registrada! Criando pagamento...");
      
      // Create payment preference usando action (chamada direta ao Mercado Pago)
      const firstParticipant = proposal.participantsData?.[0];
      const paymentResult = await createPaymentPreferenceAction({
        proposalId: proposal._id,
        items: [
          {
            id: proposal._id,
            title: proposal.title,
            description: `Pacote de viagem - Proposta #${proposal.proposalNumber}`,
            category_id: "travel_packages",
            quantity: 1,
            currency_id: "BRL",
            unit_price: proposal.finalAmount || proposal.totalPrice,
          }
        ],
        payer: firstParticipant ? {
          name: firstParticipant.fullName.split(' ')[0],
          surname: firstParticipant.fullName.split(' ').slice(1).join(' ') || firstParticipant.fullName.split(' ')[0],
          email: firstParticipant.email,
          phone: firstParticipant.phone ? {
            area_code: firstParticipant.phone.replace(/\D/g, '').substring(0, 2),
            number: firstParticipant.phone.replace(/\D/g, '').substring(2),
          } : undefined,
          identification: firstParticipant.cpf ? {
            type: "CPF",
            number: firstParticipant.cpf.replace(/\D/g, ''),
          } : undefined,
        } : undefined,
      });

      if (paymentResult.success && (paymentResult.initPoint || paymentResult.sandboxInitPoint)) {
        // Use sandbox in dev, production in prod
        const checkoutUrl = process.env.NODE_ENV === 'production' 
          ? paymentResult.initPoint 
          : (paymentResult.sandboxInitPoint || paymentResult.initPoint);
        
        toast.success("Redirecionando para o Checkout Pro do Mercado Pago...");
        
        // Redirect direto para Mercado Pago Checkout Pro
        setTimeout(() => {
          window.location.href = checkoutUrl!;
        }, 1000);
      } else {
        // Parse error for better UX
        let errorTitle = "Erro ao criar pagamento";
        let errorDescription = paymentResult.error || "Tente novamente em alguns instantes";
        
        if (paymentResult.error) {
          const errorMsg = paymentResult.error.toLowerCase();
          
          if (errorMsg.includes("mercado pago") && (errorMsg.includes("idempotency") || errorMsg.includes("header"))) {
            errorTitle = "Erro temporário no pagamento";
            errorDescription = "Ocorreu um erro temporário. Por favor, recarregue a página e tente novamente.";
          } else if (errorMsg.includes("token") || errorMsg.includes("access")) {
            errorTitle = "Erro de configuração";
            errorDescription = "Por favor, entre em contato com o suporte.";
          } else if (errorMsg.includes("timeout") || errorMsg.includes("connection")) {
            errorTitle = "Erro de conexão";
            errorDescription = "Verifique sua conexão com a internet e tente novamente.";
          }
        }
        
        toast.error(errorTitle, {
          description: errorDescription,
          duration: 6000,
        });
      }
    } catch (error) {
      console.error("Error in final confirmation:", error);
      
      // Better error parsing
      let errorTitle = "Erro na confirmação final";
      let errorDescription = "Tente novamente em alguns instantes";
      
      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes("network") || errorMsg.includes("fetch")) {
          errorTitle = "Erro de conexão";
          errorDescription = "Verifique sua conexão com a internet e tente novamente.";
        } else if (errorMsg.includes("mercado pago")) {
          errorTitle = "Erro no processamento do pagamento";
          errorDescription = "Não foi possível processar o pagamento. Tente novamente ou entre em contato com o suporte.";
        } else if (error.message && error.message.length < 100) {
          errorDescription = error.message;
        }
      }
      
      toast.error(errorTitle, {
        description: errorDescription,
        duration: 6000,
      });
    }
  };

  const addParticipant = () => {
    setParticipants([...participants, { fullName: "", birthDate: "", cpf: "", email: "", phone: "" }]);
  };

  const removeParticipant = (index: number) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index));
    }
  };

  const updateParticipant = (index: number, field: keyof Participant, value: string) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value };
    setParticipants(updated);
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'accept':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aceitar Proposta de Pacote</h3>
              <p className="text-gray-600">
                Revise os detalhes da proposta e aceite para iniciar o processo de contratação.
              </p>
            </div>

            {/* Validity Alert */}
            <Alert className="border-orange-500 bg-orange-50 mb-4">
              <Clock className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-900 font-semibold text-sm">
                ⏰ Validade de 24 horas
              </AlertTitle>
              <AlertDescription className="text-orange-800 text-xs">
                Esta proposta expira em 24 horas. Aceite agora para garantir os valores e disponibilidade.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{proposal.title}</CardTitle>
                <Badge variant="outline">#{proposal.proposalNumber}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-500 block">Valor Total</span>
                    <span className="text-green-600 font-semibold text-lg">
                      {formatCurrency(proposal.totalPrice)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-500 block">Válida até</span>
                    <span>{formatDate(proposal.validUntil)}</span>
                  </div>
                </div>
                
                <div>
                  <span className="font-medium text-gray-500 block mb-2">Descrição</span>
                  <div className="text-sm text-gray-700">
                    {renderMarkdownText(proposal.description)}
                  </div>
                </div>

              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={handleAcceptProposal}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Aceitar Proposta
              </Button>
            </div>
          </div>
        );

      case 'participants':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Dados dos Participantes</h3>
              <p className="text-gray-600">
                Preencha os dados de todos os participantes da viagem para a reserva dos voos.
              </p>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              {participants.map((participant, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Participante {index + 1}
                    </CardTitle>
                    {participants.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeParticipant(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`fullName-${index}`}>Nome Completo *</Label>
                        <Input
                          id={`fullName-${index}`}
                          value={participant.fullName}
                          onChange={(e) => updateParticipant(index, 'fullName', e.target.value)}
                          placeholder="Nome completo"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor={`birthDate-${index}`}>Data de Nascimento *</Label>
                        <Input
                          id={`birthDate-${index}`}
                          type="date"
                          value={participant.birthDate}
                          onChange={(e) => updateParticipant(index, 'birthDate', e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`cpf-${index}`}>CPF *</Label>
                        <Input
                          id={`cpf-${index}`}
                          value={participant.cpf}
                          onChange={(e) => updateParticipant(index, 'cpf', e.target.value)}
                          placeholder="000.000.000-00"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor={`email-${index}`}>Email (opcional)</Label>
                        <Input
                          id={`email-${index}`}
                          type="email"
                          value={participant.email || ""}
                          onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                          placeholder="email@exemplo.com"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor={`phone-${index}`}>Telefone (opcional)</Label>
                      <Input
                        id={`phone-${index}`}
                        value={participant.phone || ""}
                        onChange={(e) => updateParticipant(index, 'phone', e.target.value)}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              variant="outline"
              onClick={addParticipant}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Participante
            </Button>

            <div className="flex justify-between">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSubmitParticipants}
              >
                <Users className="h-4 w-4 mr-2" />
                Enviar Dados dos Participantes
              </Button>
            </div>
          </div>
        );

      case 'documents':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <FileText className="h-12 w-12 text-purple-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Documentos Contratuais</h3>
              <p className="text-gray-600">
                Revise os documentos enviados pela equipe e dê sua confirmação final.
              </p>
            </div>

            {proposal.contractDocuments && proposal.contractDocuments.length > 0 ? (
              <div className="space-y-3">
                <Label>Documentos Disponíveis</Label>
                {proposal.contractDocuments.map((doc: any, index: number) => (
                  <Card key={index}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex items-center space-x-3">
                        <FileText className="h-5 w-5 text-blue-500" />
                        <div>
                          <p className="text-sm font-medium">{doc.fileName}</p>
                          <p className="text-xs text-gray-500">
                            Enviado em {formatDate(doc.uploadedAt)}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="py-8 text-center">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    Aguardando documentos da equipe...
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={termsAccepted}
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
              />
              <Label htmlFor="terms" className="text-sm">
                Eu li, compreendi e aceito os termos e condições do contrato, 
                políticas de cancelamento e estou ciente dos valores finais da viagem.
              </Label>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                className="bg-purple-600 hover:bg-purple-700"
                onClick={handleFinalConfirmation}
                disabled={!termsAccepted}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Confirmar e Prosseguir para Pagamento
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Determine step based on proposal status
  React.useEffect(() => {
    if (proposal.status === 'sent' || proposal.status === 'viewed') {
      setCurrentStep('accept');
    } else if (proposal.status === 'awaiting_participants_data') {
      setCurrentStep('participants');
    } else if (proposal.status === 'documents_uploaded') {
      setCurrentStep('documents');
    }
  }, [proposal.status]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Contratação de Pacote</DialogTitle>
          <DialogDescription>
            Proposta #{proposal.proposalNumber}
          </DialogDescription>
        </DialogHeader>
        
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
}
