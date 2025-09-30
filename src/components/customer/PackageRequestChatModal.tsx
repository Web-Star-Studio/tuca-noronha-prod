"use client";

import React, { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { MessageSquare, Send } from "lucide-react";
import { Id } from "@/../convex/_generated/dataModel";
import { toast } from "sonner";
import { usePackageRequestQueries } from "@/hooks/usePackageRequestQueries";

interface PackageRequestChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: Id<"packageRequests"> | null;
  requestNumber: string;
}

export default function PackageRequestChatModal({ 
  isOpen, 
  onClose, 
  requestId,
  requestNumber
}: PackageRequestChatModalProps) {
  const [chatMessage, setChatMessage] = useState("");
  const [messagePriority, setMessagePriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [isSending, setIsSending] = useState(false);

  // Usar o hook personalizado para queries
  const {
    requestDetails,
    requestMessages,
    isLoading,
    hasValidId,
  } = usePackageRequestQueries({
    requestId,
    enabled: isOpen,
  });

  // Mutations
  const sendMessage = useMutation(api.packages.createPackageRequestMessage);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (requestMessages && requestMessages.length > 0) {
      setTimeout(() => {
        const chatMessages = document.getElementById('customer-chat-messages');
        if (chatMessages) {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      }, 100);
    }
  }, [requestMessages]);

  // Não renderizar se não há requestId válido
  if (isOpen && !hasValidId) {
    return null;
  }

  const formatDateTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case "urgent": return "Urgente";
      case "high": return "Alta";
      case "medium": return "Média";
      case "low": return "Baixa";
      default: return priority;
    }
  };

  const handleSendMessage = async () => {
    if (!requestId || !chatMessage.trim()) {
      toast.error("Por favor, digite uma mensagem");
      return;
    }

    setIsSending(true);
    try {
      await sendMessage({
        packageRequestId: requestId,
        subject: `Mensagem do cliente - ${new Date().toLocaleString('pt-BR')}`,
        message: chatMessage,
        priority: messagePriority,
      });

      // Clear message input
      setChatMessage("");
      
      // Auto-scroll to bottom after a short delay to allow for re-render
      setTimeout(() => {
        const chatMessages = document.getElementById('customer-chat-messages');
        if (chatMessages) {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      }, 100);

      toast.success("Mensagem enviada!");
    } catch {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setIsSending(false);
    }
  };

  // useEffect duplicado removido (já movido para cima)

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-white max-w-4xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Carregando Chat</DialogTitle>
            <DialogDescription>
              Aguarde enquanto carregamos sua conversa...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando conversa...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!requestDetails) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-white max-w-4xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Carregando Chat</DialogTitle>
            <DialogDescription>
              Aguarde enquanto carregamos sua conversa...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando conversa...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "in_review": return "bg-blue-100 text-blue-800";
      case "proposal_sent": return "bg-purple-100 text-purple-800";
      case "confirmed": return "bg-green-100 text-green-800";
      case "requires_revision": return "bg-orange-100 text-orange-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Pendente";
      case "in_review": return "Em Análise";
      case "proposal_sent": return "Proposta Enviada";
      case "confirmed": return "Confirmado";  
      case "requires_revision": return "Requer Revisão";
      case "cancelled": return "Cancelado";
      default: return status;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-4xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Chat - Solicitação #{requestNumber}
                <Badge className={getStatusColor(requestDetails.status)}>
                {getStatusLabel(requestDetails.status)}
              </Badge>
              </DialogTitle>
              <DialogDescription className="mt-1">
                Converse com nossa equipe sobre sua solicitação
              </DialogDescription>
            </div>
            
          </div>
        </DialogHeader>

        <div className="mt-4">
          {/* Chat Container */}
          <div className="flex flex-col h-[450px]">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto mb-4 space-y-3 bg-gray-50 rounded-lg p-4" id="customer-chat-messages">
              {requestMessages && requestMessages.length > 0 ? (
                requestMessages
                  .sort((a, b) => a.createdAt - b.createdAt)
                  .map((message) => {
                    const isAdminMessage = message.senderEmail?.includes("admin") || 
                                         message.senderEmail?.includes("tournarrays") ||
                                         (requestDetails && message.senderEmail !== requestDetails.customerInfo.email);
                    
                    return (
                      <div 
                        key={message._id} 
                        className={`flex ${!isAdminMessage ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[70%] ${
                          !isAdminMessage 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-white text-gray-800 border border-gray-200'
                        } rounded-lg p-3 shadow-sm`}>
                          {/* Message Header */}
                          {message.subject && !message.subject.includes('Mensagem do') && (
                            <div className={`text-xs font-medium mb-1 ${
                              !isAdminMessage ? 'text-blue-100' : 'text-gray-600'
                            }`}>
                              {message.subject}
                            </div>
                          )}
                          
                          {/* Admin Badge */}
                          {isAdminMessage && (
                            <div className="text-xs font-medium mb-1 text-green-600">
                              👤 Equipe Tuca Noronha
                            </div>
                          )}
                          
                          {/* Message Content */}
                          <div className="whitespace-pre-wrap text-sm">
                            {message.message}
                          </div>
                          
                          {/* Message Footer */}
                          <div className={`flex items-center justify-between mt-2 text-xs ${
                            !isAdminMessage ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            <span>{formatDateTime(message.createdAt)}</span>
                            {message.priority !== 'medium' && (
                              <Badge 
                                className={`text-xs px-1 py-0 ${
                                  !isAdminMessage 
                                    ? 'bg-blue-500 text-blue-100' 
                                    : getPriorityColor(message.priority)
                                }`}
                              >
                                {getPriorityLabel(message.priority)}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">Nenhuma mensagem ainda</p>
                    <p className="text-xs">Envie uma mensagem para nossa equipe</p>
                  </div>
                </div>
              )}
            </div>

            {/* Chat Input Area */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Textarea
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    placeholder="Digite sua mensagem para a equipe..."
                    rows={2}
                    className="resize-none"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (chatMessage.trim()) {
                          handleSendMessage();
                        }
                      }
                    }}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Select value={messagePriority} onValueChange={(value: any) => setMessagePriority(value)}>
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baixa</SelectItem>
                      <SelectItem value="medium">Média</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleSendMessage}
                    disabled={isSending || !chatMessage.trim()}
                    size="sm"
                    className="h-8 px-3"
                  >
                    {isSending ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Pressione Enter para enviar, Shift+Enter para nova linha
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
