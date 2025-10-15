"use client";

import React, { useState } from 'react';
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { MessageCircle, Send } from "lucide-react";

interface ContactDialogProps {
  isOpen: boolean;
  onClose: () => void;
  packageRequestId: Id<"packageRequests">;
  requestNumber: string;
}

const ContactDialog: React.FC<ContactDialogProps> = ({
  isOpen,
  onClose,
  packageRequestId,
  requestNumber,
}) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createMessage = useMutation(api.packages.createPackageRequestMessage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);
    
    try {
      await createMessage({
        packageRequestId,
        subject: subject.trim(),
        message: message.trim(),
        priority,
      });

      toast.success("Mensagem enviada com sucesso! Nossa equipe entrará em contato em breve.");
      
      // Reset form
      setSubject("");
      setMessage("");
      setPriority("medium");
      onClose();
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityOptions = [
    { value: "low", label: "Baixa", description: "Informação geral" },
    { value: "medium", label: "Média", description: "Dúvida ou alteração" },
    { value: "high", label: "Alta", description: "Problema ou urgência" },
    { value: "urgent", label: "Urgente", description: "Questão crítica" },
  ];

  const subjectTemplates = [
    "Dúvida sobre minha solicitação",
    "Alteração nos detalhes da viagem",
    "Status da proposta",
    "Problema com a solicitação",
    "Cancelamento da solicitação",
    "Informações adicionais",
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-blue-600" />
            Entrar em Contato
          </DialogTitle>
          <DialogDescription>
            Envie uma mensagem sobre a solicitação <strong>{requestNumber}</strong>. 
            Nossa equipe responderá em breve.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Subject Field */}
          <div className="space-y-2">
            <Label htmlFor="subject">Assunto *</Label>
            <div className="space-y-2">
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Digite o assunto da sua mensagem"
                required
              />
              <div className="flex flex-wrap gap-1">
                <span className="text-xs text-gray-500 mr-2">Sugestões:</span>
                {subjectTemplates.map((template) => (
                  <button
                    key={template}
                    type="button"
                    onClick={() => setSubject(template)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded-full transition-colors"
                  >
                    {template}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Priority Field */}
          <div className="space-y-2">
            <Label htmlFor="priority">Prioridade</Label>
            <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a prioridade" />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Message Field */}
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Descreva sua dúvida, solicitação ou problema em detalhes..."
              className="min-h-[120px]"
              required
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Seja o mais específico possível para uma resposta mais rápida</span>
              <span>{message.length}/1000</span>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !subject.trim() || !message.trim()}
            >
              {isSubmitting ? (
                "Enviando..."
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar Mensagem
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ContactDialog; 