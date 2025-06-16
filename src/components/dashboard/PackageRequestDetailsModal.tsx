"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Calendar, 
  Users, 
  MapPin, 
  DollarSign, 
  Mail,
  Phone,
  Clock,
  AlertTriangle,
  MessageSquare,
  Edit,
  CheckCircle,
  XCircle,
  User,
  Send,
  Reply
} from "lucide-react";
import { 
  STATUS_LABELS, 
  STATUS_COLORS
} from "../../../convex/domains/packages/types";
import { Id } from "@/../convex/_generated/dataModel";
import { toast } from "sonner";

interface PackageRequestDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  requestId: Id<"packageRequests"> | null;
}

export default function PackageRequestDetailsModal({ 
  isOpen, 
  onClose, 
  requestId 
}: PackageRequestDetailsModalProps) {
  const [activeTab, setActiveTab] = useState("details");
  const [adminResponse, setAdminResponse] = useState("");
  const [isResponding, setIsResponding] = useState(false);
  const [replyingToMessage, setReplyingToMessage] = useState<Id<"packageRequestMessages"> | null>(null);
  const [isFirstMessage, setIsFirstMessage] = useState(false);
  const [replySubject, setReplySubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [replyPriority, setReplyPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");

  // Queries
  const requestDetails = useQuery(
    api.packages.getPackageRequestDetails,
    requestId ? { requestId } : "skip"
  );
  
  const requestMessages = useQuery(
    api.packages.getPackageRequestMessages,
    requestId ? { packageRequestId: requestId } : "skip"
  );

  // Mutations
  const updateRequestStatus = useMutation(api.packages.updatePackageRequestStatus);
  const markMessageAsRead = useMutation(api.packages.markPackageRequestMessageAsRead);
  const sendReply = useMutation(api.packages.sendPackageRequestReply);

  // Auto-scroll to bottom when new messages arrive
  React.useEffect(() => {
    if (requestMessages && requestMessages.length > 0) {
      setTimeout(() => {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      }, 100);
    }
  }, [requestMessages]);

  // Auto-mark unread messages as read when in chat tab
  React.useEffect(() => {
    if (activeTab === "messages" && requestMessages) {
      const unreadMessages = requestMessages.filter(msg => 
        msg.status === "sent" && 
        !msg.senderEmail?.includes("admin") && 
        !msg.senderEmail?.includes("tournarrays")
      );
      
      unreadMessages.forEach(msg => {
        handleMarkAsRead(msg._id);
      });
    }
  }, [activeTab, requestMessages]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent": return <Clock className="h-4 w-4" />;
      case "read": return <CheckCircle className="h-4 w-4" />;
      case "replied": return <MessageSquare className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const handleMarkAsRead = async (messageId: Id<"packageRequestMessages">) => {
    try {
      await markMessageAsRead({ messageId });
      toast.success("Mensagem marcada como lida");
    } catch (error) {
      console.error("Erro ao marcar mensagem como lida:", error);
      toast.error("Erro ao marcar mensagem como lida");
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!requestId) return;

    try {
      await updateRequestStatus({
        id: requestId,
        status: newStatus as any,
        note: adminResponse || undefined,
      });
      toast.success("Status atualizado com sucesso");
      setAdminResponse("");
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const handleStartReply = (messageId: Id<"packageRequestMessages"> | null, originalSubject: string) => {
    setReplyingToMessage(messageId);
    setIsFirstMessage(messageId === null);
    setReplySubject(originalSubject.startsWith("Re: ") ? originalSubject : `Re: ${originalSubject}`);
    setReplyMessage("");
    setReplyPriority("medium");
    
    // Scroll para o formulário de resposta
    setTimeout(() => {
      const replyForm = document.querySelector('[data-reply-form]');
      if (replyForm) {
        replyForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleStartFirstMessage = () => {
    setReplyingToMessage(null);
    setIsFirstMessage(true);
    setReplySubject(`Informações sobre solicitação #${requestDetails.requestNumber}`);
    setReplyMessage("");
    setReplyPriority("medium");
    
    // Scroll para o formulário de resposta
    setTimeout(() => {
      const replyForm = document.querySelector('[data-reply-form]');
      if (replyForm) {
        replyForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleSendReply = async () => {
    if (!requestId || !replyMessage.trim() || !replySubject.trim()) {
      toast.error("Por favor, preencha o assunto e a mensagem");
      return;
    }

    setIsResponding(true);
    try {
      await sendReply({
        packageRequestId: requestId,
        originalMessageId: replyingToMessage || undefined,
        subject: replySubject,
        message: replyMessage,
        priority: replyPriority,
      });

      // Clear form
      setReplyingToMessage(null);
      setIsFirstMessage(false);
      setReplySubject("");
      setReplyMessage("");
      setReplyPriority("medium");

      toast.success("Resposta enviada com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar resposta:", error);
      toast.error("Erro ao enviar resposta");
    } finally {
      setIsResponding(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!requestId || !replyMessage.trim()) {
      toast.error("Por favor, digite uma mensagem");
      return;
    }

    setIsResponding(true);
    try {
      await sendReply({
        packageRequestId: requestId,
        originalMessageId: undefined,
        subject: `Mensagem do chat - ${new Date().toLocaleString('pt-BR')}`,
        message: replyMessage,
        priority: replyPriority,
      });

      // Clear message input
      setReplyMessage("");
      
      // Auto-scroll to bottom after a short delay to allow for re-render
      setTimeout(() => {
        const chatMessages = document.getElementById('chat-messages');
        if (chatMessages) {
          chatMessages.scrollTop = chatMessages.scrollHeight;
        }
      }, 100);

      toast.success("Mensagem enviada!");
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem");
    } finally {
      setIsResponding(false);
    }
  };

  const handleCancelReply = () => {
    setReplyingToMessage(null);
    setIsFirstMessage(false);
    setReplySubject("");
    setReplyMessage("");
    setReplyPriority("medium");
  };

  if (!requestDetails) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="bg-white max-w-6xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Carregando Solicitação</DialogTitle>
            <DialogDescription>
              Aguarde enquanto carregamos os detalhes da solicitação...
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando detalhes...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-6xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Solicitação #{requestDetails.requestNumber}</span>
            <Badge className={STATUS_COLORS[requestDetails.status as keyof typeof STATUS_COLORS]}>
              {STATUS_LABELS[requestDetails.status as keyof typeof STATUS_LABELS]}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Detalhes completos da solicitação e histórico de mensagens
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Detalhes da Solicitação
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat ({requestMessages?.length || 0})
                {requestMessages?.some(msg => msg.status === "sent" && !msg.senderEmail?.includes("admin") && !msg.senderEmail?.includes("tournarrays")) && (
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                )}
              </TabsTrigger>
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Ações Admin
              </TabsTrigger>
            </TabsList>

            <div className="overflow-y-auto max-h-[calc(85vh-200px)] mt-4">
              <TabsContent value="details" className="space-y-6 mt-0">
                <RequestDetailsContent request={requestDetails} />
              </TabsContent>

            <TabsContent value="messages" className="space-y-0 mt-0 h-full">
              {/* Chat Header */}
              <div className="flex items-center justify-between border-b border-gray-200 pb-3 mb-4">
                <div className="flex items-center gap-3">
                  <MessageSquare className="h-5 w-5 text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold">Chat da Solicitação</h3>
                    <p className="text-sm text-gray-600">
                      Conversa sobre #{requestDetails.requestNumber}
                    </p>
                  </div>
                </div>
                <Badge variant="outline">
                  {requestMessages?.length || 0} mensagens
                </Badge>
              </div>

              {/* Chat Container */}
              <div className="flex flex-col h-[450px]">
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto mb-4 space-y-3 bg-gray-50 rounded-lg p-4" id="chat-messages">
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
                            className={`flex ${isAdminMessage ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-[70%] ${
                              isAdminMessage 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white text-gray-800 border border-gray-200'
                            } rounded-lg p-3 shadow-sm`}>
                              {/* Message Header */}
                              {message.subject && (
                                <div className={`text-xs font-medium mb-1 ${
                                  isAdminMessage ? 'text-blue-100' : 'text-gray-600'
                                }`}>
                                  {message.subject}
                                </div>
                              )}
                              
                              {/* Message Content */}
                              <div className="whitespace-pre-wrap text-sm">
                                {message.message}
                              </div>
                              
                              {/* Message Footer */}
                              <div className={`flex items-center justify-between mt-2 text-xs ${
                                isAdminMessage ? 'text-blue-100' : 'text-gray-500'
                              }`}>
                                <span>{message.senderName}</span>
                                <div className="flex items-center gap-2">
                                  <span>{formatDateTime(message.createdAt)}</span>
                                  {message.priority !== 'medium' && (
                                    <Badge 
                                      className={`text-xs px-1 py-0 ${
                                        isAdminMessage 
                                          ? 'bg-blue-500 text-blue-100' 
                                          : getPriorityColor(message.priority)
                                      }`}
                                    >
                                      {getPriorityLabel(message.priority)}
                                    </Badge>
                                  )}
                                  {!isAdminMessage && message.status === "sent" && (
                                    <button
                                      onClick={() => handleMarkAsRead(message._id)}
                                      className="text-blue-600 hover:text-blue-800 text-xs underline"
                                    >
                                      Marcar como lida
                                    </button>
                                  )}
                                </div>
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
                        <p className="text-xs">Inicie a conversa enviando uma mensagem</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input Area */}
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Digite sua mensagem..."
                        rows={2}
                        className="resize-none"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (replyMessage.trim()) {
                              handleSendChatMessage();
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Select value={replyPriority} onValueChange={(value: any) => setReplyPriority(value)}>
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
                        onClick={handleSendChatMessage}
                        disabled={isResponding || !replyMessage.trim()}
                        size="sm"
                        className="h-8 px-3"
                      >
                        {isResponding ? (
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
            </TabsContent>

            <TabsContent value="admin" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Atualizar Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate("in_review")}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <Clock className="h-4 w-4" />
                      <span className="text-xs">Em Análise</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate("proposal_sent")}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <Mail className="h-4 w-4" />
                      <span className="text-xs">Proposta Enviada</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate("confirmed")}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs">Confirmado</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate("cancelled")}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <XCircle className="h-4 w-4" />
                      <span className="text-xs">Cancelado</span>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleStatusUpdate("completed")}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs">Concluído</span>
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Notas Administrativas (opcional)</Label>
                    <Textarea
                      placeholder="Adicione notas sobre esta atualização..."
                      value={adminResponse}
                      onChange={(e) => setAdminResponse(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Informações de Controle</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div><strong>Criado em:</strong> {formatDateTime(requestDetails.createdAt)}</div>
                  <div><strong>Última atualização:</strong> {formatDateTime(requestDetails.updatedAt)}</div>
                  {requestDetails.assignedTo && (
                    <div><strong>Atribuído a:</strong> {requestDetails.assignedTo}</div>
                  )}
                  {requestDetails.adminNotes && (
                    <div>
                      <strong>Notas Admin:</strong>
                      <p className="ml-2 mt-1 text-gray-700">{requestDetails.adminNotes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Component for displaying request details
function RequestDetailsContent({ request }: { request: any }) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Customer Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Informações do Cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong>Nome:</strong> {request.customerInfo.name}
            </div>
            <div>
              <strong>Email:</strong> {request.customerInfo.email}
            </div>
            <div>
              <strong>Telefone:</strong> {request.customerInfo.phone}
            </div>
            {request.customerInfo.age && (
              <div>
                <strong>Idade:</strong> {request.customerInfo.age} anos
              </div>
            )}
            {request.customerInfo.occupation && (
              <div>
                <strong>Profissão:</strong> {request.customerInfo.occupation}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Trip Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Detalhes da Viagem
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <strong>Destino:</strong> {request.tripDetails.destination}
            </div>
            <div>
              <strong>Duração:</strong> {request.tripDetails.duration} dias
            </div>
            <div>
              <strong>Data de Início:</strong> {formatDate(request.tripDetails.startDate)}
            </div>
            <div>
              <strong>Data de Fim:</strong> {formatDate(request.tripDetails.endDate)}
            </div>
            <div>
              <strong>Tamanho do Grupo:</strong> {request.tripDetails.groupSize} pessoas
            </div>
            <div>
              <strong>Acompanhantes:</strong> {request.tripDetails.companions}
            </div>
            <div>
              <strong>Orçamento:</strong> {formatCurrency(request.tripDetails.budget)}
            </div>
            <div>
              <strong>Flexibilidade do Orçamento:</strong> {request.tripDetails.budgetFlexibility}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Preferências</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <strong>Tipo de Hospedagem:</strong> 
            <span className="ml-2">{request.preferences.accommodationType.join(", ")}</span>
          </div>
          <div>
            <strong>Atividades:</strong> 
            <span className="ml-2">{request.preferences.activities.join(", ")}</span>
          </div>
          <div>
            <strong>Transporte:</strong> 
            <span className="ml-2">{request.preferences.transportation.join(", ")}</span>
          </div>
          <div>
            <strong>Preferências Alimentares:</strong> 
            <span className="ml-2">{request.preferences.foodPreferences.join(", ")}</span>
          </div>
          {request.preferences.accessibility && request.preferences.accessibility.length > 0 && (
            <div>
              <strong>Acessibilidade:</strong> 
              <span className="ml-2">{request.preferences.accessibility.join(", ")}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      {(request.specialRequirements || request.previousExperience || request.expectedHighlights) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {request.specialRequirements && (
              <div>
                <strong>Requisitos Especiais:</strong> 
                <p className="ml-2 mt-1 text-gray-700">{request.specialRequirements}</p>
              </div>
            )}
            {request.previousExperience && (
              <div>
                <strong>Experiência Anterior:</strong> 
                <p className="ml-2 mt-1 text-gray-700">{request.previousExperience}</p>
              </div>
            )}
            {request.expectedHighlights && (
              <div>
                <strong>Expectativas:</strong> 
                <p className="ml-2 mt-1 text-gray-700">{request.expectedHighlights}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 