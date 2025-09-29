"use client";

import React, { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { Id } from '@/../convex/_generated/dataModel';
import { toast } from 'sonner';
import { 
  CheckCircle, 
  XCircle, 
  Edit3, 
  AlertCircle, 
  FileText,
  DollarSign,
  Calendar
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ProposalDetailsView } from '@/components/dashboard/package-request-details/ProposalDetailsView';
import { ParticipantsDataModal } from './ParticipantsDataModal';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProposalActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: any;
  packageRequest: any;
}

export function ProposalActionsModal({
  isOpen,
  onClose,
  proposal,
  packageRequest,
}: ProposalActionsModalProps) {
  const [action, setAction] = useState<'view' | 'accept' | 'reject' | 'revise'>('view');
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [revisionNotes, setRevisionNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const acceptProposal = useMutation(api.domains.packageProposals.mutations.acceptProposal);
  const rejectProposal = useMutation(api.domains.packageProposals.mutations.rejectProposal);
  const requestRevision = useMutation(api.domains.packageProposals.mutations.requestProposalRevision);
  const markAsViewed = useMutation(api.domains.packageProposals.mutations.markProposalAsViewed);

  // Mark as viewed when modal opens
  React.useEffect(() => {
    if (isOpen && proposal && proposal.status === 'sent') {
      markAsViewed({ proposalId: proposal._id as Id<"packageProposals"> }).catch(console.error);
    }
  }, [isOpen, proposal, markAsViewed]);

  const handleAccept = () => {
    setAction('accept');
    setShowParticipantsModal(true);
  };

  const handleConfirmAccept = async (participantsData: any[]) => {
    setIsSubmitting(true);
    try {
      const result = await acceptProposal({
        proposalId: proposal._id as Id<"packageProposals">,
        participantsData,
      });

      if (result.success) {
        toast.success(result.message);
        setShowParticipantsModal(false);
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao aceitar proposta");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Por favor, informe o motivo da rejeição");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await rejectProposal({
        proposalId: proposal._id as Id<"packageProposals">,
        reason: rejectReason,
      });

      if (result.success) {
        toast.success(result.message);
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao rejeitar proposta");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionNotes.trim()) {
      toast.error("Por favor, descreva as alterações desejadas");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await requestRevision({
        proposalId: proposal._id as Id<"packageProposals">,
        revisionNotes,
      });

      if (result.success) {
        toast.success(result.message);
        onClose();
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao solicitar revisão");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = () => {
    const statusMap: { [key: string]: { label: string; color: string; icon: React.ReactNode } } = {
      sent: { label: "Nova", color: "bg-blue-100 text-blue-800", icon: <FileText className="h-3 w-3" /> },
      viewed: { label: "Visualizada", color: "bg-purple-100 text-purple-800", icon: <FileText className="h-3 w-3" /> },
      under_negotiation: { label: "Em Negociação", color: "bg-orange-100 text-orange-800", icon: <Edit3 className="h-3 w-3" /> },
      accepted: { label: "Aceita", color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-3 w-3" /> },
      rejected: { label: "Rejeitada", color: "bg-red-100 text-red-800", icon: <XCircle className="h-3 w-3" /> },
    };

    const status = statusMap[proposal.status] || { 
      label: proposal.status, 
      color: "bg-gray-100 text-gray-800",
      icon: null 
    };

    return (
      <Badge className={`${status.color} px-3 py-1`}>
        {status.icon}
        <span className="ml-1.5">{status.label}</span>
      </Badge>
    );
  };

  if (!proposal) return null;

  return (
    <>
      <Dialog open={isOpen && action === 'view'} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{proposal.title}</span>
              {getStatusBadge()}
            </DialogTitle>
            <DialogDescription>
              Proposta #{proposal.proposalNumber}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Quick Info */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Valor Total</p>
                  <p className="font-semibold text-green-600">
                    {formatCurrency(proposal.totalPrice)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Válida até</p>
                  <p className="font-semibold">
                    {format(new Date(proposal.validUntil), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-xs text-gray-500">Componentes</p>
                  <p className="font-semibold">{proposal.components?.length || 0}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Proposal Details */}
            <ProposalDetailsView proposal={proposal} />

            <Separator />

            {/* Action Buttons */}
            {['sent', 'viewed', 'under_negotiation'].includes(proposal.status) && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Analise cuidadosamente todos os detalhes da proposta antes de tomar uma decisão.
                    Você pode aceitar, rejeitar ou solicitar alterações.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setAction('reject')}
                    disabled={isSubmitting}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setAction('revise')}
                    disabled={isSubmitting}
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    Pedir Revisão
                  </Button>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={handleAccept}
                    disabled={isSubmitting}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aceitar Proposta
                  </Button>
                </div>
              </div>
            )}

            {proposal.status === 'accepted' && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Você aceitou esta proposta. Nossa equipe entrará em contato para finalizar os detalhes.
                </AlertDescription>
              </Alert>
            )}

            {proposal.status === 'rejected' && (
              <Alert className="bg-red-50 border-red-200">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  Esta proposta foi rejeitada. Nossa equipe pode enviar novas propostas.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={action === 'reject'} onOpenChange={() => setAction('view')}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              Rejeitar Proposta
            </DialogTitle>
            <DialogDescription>
              Por favor, informe o motivo da rejeição para que possamos melhorar nossa proposta.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reject-reason">Motivo da Rejeição *</Label>
              <Textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ex: O valor está acima do meu orçamento, prefiro outro tipo de acomodação..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAction('view')} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isSubmitting || !rejectReason.trim()}
            >
              Confirmar Rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revision Request Modal */}
      <Dialog open={action === 'revise'} onOpenChange={() => setAction('view')}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-orange-600" />
              Solicitar Revisão
            </DialogTitle>
            <DialogDescription>
              Descreva as alterações que gostaria na proposta.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="revision-notes">Alterações Desejadas *</Label>
              <Textarea
                id="revision-notes"
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="Ex: Gostaria de incluir café da manhã, trocar o hotel por outro mais central..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAction('view')} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleRequestRevision}
              disabled={isSubmitting || !revisionNotes.trim()}
            >
              Enviar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Participants Data Modal */}
      <ParticipantsDataModal
        isOpen={showParticipantsModal}
        onClose={() => setShowParticipantsModal(false)}
        onConfirm={handleConfirmAccept}
        numberOfParticipants={packageRequest?.tripDetails?.groupSize || 1}
        proposalTitle={proposal.title}
      />
    </>
  );
}
