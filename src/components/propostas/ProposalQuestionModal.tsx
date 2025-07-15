"use client";

import React, { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { MessageSquare, Send } from "lucide-react";
import { Id } from "@/../convex/_generated/dataModel";
import { toast } from "sonner";

interface ProposalQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId: Id<"packageProposals">;
  proposalTitle: string;
}

export default function ProposalQuestionModal({ 
  isOpen, 
  onClose, 
  proposalId,
  proposalTitle
}: ProposalQuestionModalProps) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const sendQuestion = useMutation(api.domains.packageProposals.mutations.sendProposalQuestion);

  const handleSendQuestion = async () => {
    if (!message.trim()) {
      toast.error("Por favor, escreva sua pergunta");
      return;
    }

    if (message.trim().length < 10) {
      toast.error("A pergunta deve ter pelo menos 10 caracteres");
      return;
    }

    setIsSending(true);
    try {
      const result = await sendQuestion({
        proposalId,
        message: message.trim(),
      });

      if (result.success) {
        toast.success(result.message);
        setMessage("");
        onClose();
      } else {
        toast.error("Erro ao enviar pergunta");
      }
    } catch (error) {
      console.error("Erro ao enviar pergunta:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao enviar pergunta");
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = () => {
    if (!isSending) {
      setMessage("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Fazer Pergunta sobre a Proposta
          </DialogTitle>
          <DialogDescription>
            Envie uma pergunta sobre a proposta "{proposalTitle}". O parceiro será notificado e responderá em breve.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="question" className="text-sm font-medium">
              Sua pergunta
            </label>
            <Textarea
              id="question"
              placeholder="Digite sua pergunta sobre a proposta..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
              disabled={isSending}
            />
            <p className="text-xs text-gray-500">
              Caracteres: {message.length}/500 (mínimo 10)
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSendQuestion}
            disabled={isSending || !message.trim() || message.trim().length < 10}
            className="gap-2"
          >
            {isSending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar Pergunta
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}