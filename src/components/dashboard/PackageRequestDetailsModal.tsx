"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Reply,
  FileText,
  Plus,
  Eye,
  SendIcon,
  CheckCircle as CheckCircleIcon,
  Upload,
  X
} from "lucide-react";
import { 
  STATUS_LABELS, 
  STATUS_COLORS
} from "../../../convex/domains/packages/types";
import { Id } from "@/../convex/_generated/dataModel";
import { toast } from "sonner";
import { ProposalDocumentManager } from "./ProposalDocumentManager";

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

  const requestProposals = useQuery(
    api.domains.packageProposals.queries.getProposalsForRequest,
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Detalhes da Solicitação
              </TabsTrigger>
              <TabsTrigger value="proposals" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Propostas ({requestProposals?.length || 0})
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

            <TabsContent value="proposals" className="space-y-6 mt-0">
              <ProposalsTab 
                requestId={requestId!} 
                requestDetails={requestDetails}
                proposals={requestProposals || []}
              />
            </TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Component for managing proposals within a package request
interface ProposalsTabProps {
  requestId: Id<"packageRequests">;
  requestDetails: any;
  proposals: any[];
}

function ProposalsTab({ requestId, requestDetails, proposals }: ProposalsTabProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [isCreatingProposal, setIsCreatingProposal] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState("proposals");
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  const sendProposal = useMutation(api.domains.packageProposals.mutations.sendPackageProposal);
  const createProposal = useMutation(api.domains.packageProposals.mutations.createPackageProposal);
  const generateUploadUrl = useMutation(api.domains.media.mutations.generateUploadUrl);
  const uploadAttachment = useMutation(api.domains.packageProposals.documents.uploadProposalAttachment);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('pt-BR');
  };

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate files
    const validFiles = files.filter(file => {
      if (file.type !== 'application/pdf') {
        toast.error(`Arquivo "${file.name}" não é um PDF válido`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`Arquivo "${file.name}" é muito grande. Limite: 10MB`);
        return false;
      }
      return true;
    });

    setUploadedFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFilesToProposal = async (proposalId: Id<"packageProposals">) => {
    if (uploadedFiles.length === 0) return;

    try {
      for (const file of uploadedFiles) {
        // Get upload URL
        const uploadUrl = await generateUploadUrl();
        
        // Upload file to storage
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        const { storageId } = await result.json();

        // Save attachment info to database
        await uploadAttachment({
          proposalId,
          storageId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          description: `Documento anexado durante criação da proposta`,
        });
      }
      
      toast.success(`${uploadedFiles.length} arquivo(s) anexado(s) à proposta!`);
      setUploadedFiles([]);
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Erro ao anexar arquivos à proposta");
    }
  };

  const statusConfig = {
    draft: { label: "Rascunho", color: "bg-gray-500" },
    review: { label: "Em Revisão", color: "bg-yellow-500" },
    sent: { label: "Enviada", color: "bg-blue-500" },
    viewed: { label: "Visualizada", color: "bg-purple-500" },
    under_negotiation: { label: "Em Negociação", color: "bg-orange-500" },
    accepted: { label: "Aceita", color: "bg-green-500" },
    rejected: { label: "Rejeitada", color: "bg-red-500" },
    expired: { label: "Expirada", color: "bg-gray-500" },
    withdrawn: { label: "Retirada", color: "bg-gray-500" },
  };

  const priorityConfig = {
    low: { label: "Baixa", color: "bg-gray-500" },
    normal: { label: "Normal", color: "bg-blue-500" },
    high: { label: "Alta", color: "bg-orange-500" },
    urgent: { label: "Urgente", color: "bg-red-500" },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">Propostas de Pacote</h3>
        <p className="text-sm text-gray-600">
          Gerencie propostas e documentos para a solicitação #{requestDetails.requestNumber}
        </p>
      </div>

      {/* Sub-tabs */}
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
          {/* Action buttons */}
          <div className="flex justify-end gap-2">
            <Button 
              onClick={() => setShowCreateForm(!showCreateForm)}
              variant={showCreateForm ? "secondary" : "default"}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Criação Rápida
            </Button>
            <Button 
              onClick={() => window.open(`/admin/dashboard/propostas-pacotes/criar/${requestId}`, '_blank')}
              variant="outline"
              className="flex items-center gap-2"
            >
              Criação Completa
            </Button>
          </div>

      {/* Quick Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Criação Rápida de Proposta</CardTitle>
            <CardDescription>
              Crie uma proposta básica rapidamente. Para mais opções, use a criação completa.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsCreatingProposal(true);
              
              const formData = new FormData(e.currentTarget);
              const title = formData.get('title') as string;
              const description = formData.get('description') as string;
              const totalPrice = parseFloat(formData.get('totalPrice') as string);
              const validDays = parseInt(formData.get('validDays') as string);
              
              try {
                const proposalId = await createProposal({
                  packageRequestId: requestId,
                  title,
                  description,
                  summary: description.substring(0, 200),
                  components: [{
                    type: "other",
                    name: "Pacote Completo",
                    description: "Pacote turístico completo conforme solicitação",
                    quantity: 1,
                    unitPrice: totalPrice,
                    totalPrice: totalPrice,
                    included: true,
                    optional: false,
                  }],
                  subtotal: totalPrice,
                  taxes: totalPrice * 0.05, // 5% taxes
                  fees: totalPrice * 0.02, // 2% fees
                  discount: 0,
                  totalPrice: totalPrice * 1.07, // Total with taxes and fees
                  currency: "BRL",
                  validUntil: Date.now() + (validDays * 24 * 60 * 60 * 1000),
                  paymentTerms: "Pagamento via cartão de crédito ou transferência bancária",
                  cancellationPolicy: "Cancelamento gratuito até 48h antes da viagem",
                  inclusions: ["Hospedagem", "Transporte", "Atividades", "Seguro viagem"],
                  exclusions: ["Refeições não mencionadas", "Despesas pessoais"],
                  requiresApproval: false,
                  priority: "normal" as const,
                });
                
                // Upload files to the created proposal
                await uploadFilesToProposal(proposalId);
                
                toast.success("Proposta criada com sucesso!");
                setShowCreateForm(false);
                setUploadedFiles([]);
                e.currentTarget.reset();
              } catch (error) {
                console.error("Error creating proposal:", error);
                toast.error("Erro ao criar proposta");
              } finally {
                setIsCreatingProposal(false);
              }
            }} className="space-y-4">
              <div>
                <Label htmlFor="title">Título da Proposta *</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Ex: Pacote Noronha 7 dias - Família Silva"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Descreva brevemente o que está incluído nesta proposta..."
                  rows={3}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="totalPrice">Valor Total (R$) *</Label>
                  <Input
                    id="totalPrice"
                    name="totalPrice"
                    type="number"
                    step="0.01"
                    placeholder="5000.00"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="validDays">Válida por (dias) *</Label>
                  <Input
                    id="validDays"
                    name="validDays"
                    type="number"
                    defaultValue="30"
                    min="1"
                    max="90"
                    required
                  />
                </div>
              </div>
              
              {/* File Upload Section */}
              <div>
                <Label htmlFor="file-upload">Documentos PDF (opcional)</Label>
                <div className="mt-2">
                  <Input
                    id="file-upload"
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handleFileSelect}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Apenas arquivos PDF. Máximo 10MB por arquivo.
                  </p>
                </div>
                
                {/* Selected Files List */}
                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-gray-700">
                      Arquivos selecionados ({uploadedFiles.length}):
                    </p>
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-red-500" />
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <span className="text-xs text-gray-500">
                            ({(file.size / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setUploadedFiles([]);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isCreatingProposal}>
                  {isCreatingProposal ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Proposta
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Proposals List */}
      {proposals.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma proposta criada
            </h3>
            <p className="text-gray-500 mb-4">
              Crie a primeira proposta para esta solicitação de pacote.
            </p>
            <Button 
              onClick={() => window.open(`/admin/dashboard/propostas-pacotes/criar/${requestId}`, '_blank')}
              className="mx-auto"
            >
              Criar Proposta
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {proposals.map((proposal) => {
            const status = statusConfig[proposal.status as keyof typeof statusConfig];
            const priority = priorityConfig[proposal.priority as keyof typeof priorityConfig];
            const isExpired = proposal.validUntil < Date.now();

            return (
              <Card key={proposal._id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{proposal.title}</h4>
                        <Badge className={`${status.color} text-white text-xs`}>
                          {status.label}
                        </Badge>
                        <Badge className={`${priority.color} text-white text-xs`}>
                          {priority.label}
                        </Badge>
                        {isExpired && (
                          <Badge variant="destructive" className="text-xs">
                            Expirada
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">
                        Proposta #{proposal.proposalNumber}
                      </p>
                      
                      {proposal.summary && (
                        <p className="text-sm text-gray-700 mb-3">
                          {proposal.summary}
                        </p>
                      )}
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Valor: </span>
                          <span className="text-green-600 font-semibold">
                            {formatCurrency(proposal.totalPrice)}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Válida até: </span>
                          <span>{formatDate(proposal.validUntil)}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Componentes: </span>
                          <span>{proposal.components.length}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Criada: </span>
                          <span>{formatDate(proposal.createdAt)}</span>
                        </div>
                      </div>

                      {/* Additional proposal metrics */}
                      {proposal.negotiationRounds > 0 && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Rodadas de negociação: </span>
                          <span>{proposal.negotiationRounds}</span>
                        </div>
                      )}

                      {proposal.convertedToBooking && (
                        <div className="mt-2">
                          <Badge className="bg-green-100 text-green-800">
                            Convertida em Reserva
                          </Badge>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedProposal(proposal);
                          setShowViewDialog(true);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      
                      {proposal.status === "draft" && (
                        <Button
                          size="sm"
                          onClick={() => handleSendProposal(proposal._id)}
                        >
                          <SendIcon className="h-4 w-4 mr-1" />
                          Enviar
                        </Button>
                      )}
                      
                      {(proposal.status === "sent" || proposal.status === "viewed") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`/propostas/${proposal._id}`, '_blank')}
                        >
                          Link Público
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumo das Propostas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Total: </span>
                  <span className="font-semibold">{proposals.length}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Aceitas: </span>
                  <span className="font-semibold text-green-600">
                    {proposals.filter(p => p.status === "accepted").length}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Em Negociação: </span>
                  <span className="font-semibold text-orange-600">
                    {proposals.filter(p => p.status === "under_negotiation").length}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Valor Total: </span>
                  <span className="font-semibold">
                    {formatCurrency(proposals.reduce((acc, p) => acc + p.totalPrice, 0))}
                  </span>
                </div>
              </div>

              {/* Action suggestions based on proposal status */}
              {proposals.filter(p => p.status === "accepted").length > 0 && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <CheckCircleIcon className="h-4 w-4 inline mr-1" />
                    Existem propostas aceitas! Considere convertê-las em reservas.
                  </p>
                </div>
              )}
              
              {proposals.filter(p => p.status === "draft").length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Há propostas em rascunho aguardando envio.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* View Proposal Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedProposal?.title}
            </DialogTitle>
            <DialogDescription>
              Proposta #{selectedProposal?.proposalNumber}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProposal && (
            <div className="space-y-6">
              {/* Proposal Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Status: </span>
                  <Badge className={`${statusConfig[selectedProposal.status as keyof typeof statusConfig]?.color} text-white`}>
                    {statusConfig[selectedProposal.status as keyof typeof statusConfig]?.label}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Prioridade: </span>
                  <Badge className={`${priorityConfig[selectedProposal.priority as keyof typeof priorityConfig]?.color} text-white`}>
                    {priorityConfig[selectedProposal.priority as keyof typeof priorityConfig]?.label}
                  </Badge>
                </div>
                <div>
                  <span className="font-medium">Valor Total: </span>
                  <span className="text-green-600 font-semibold">
                    {formatCurrency(selectedProposal.totalPrice)}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Válida até: </span>
                  <span>{formatDate(selectedProposal.validUntil)}</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="font-medium mb-2">Descrição</h4>
                <p className="text-sm text-gray-600">{selectedProposal.description}</p>
              </div>

              {/* Components */}
              <div>
                <h4 className="font-medium mb-2">Componentes ({selectedProposal.components.length})</h4>
                <div className="space-y-2">
                  {selectedProposal.components.map((component: any, index: number) => (
                    <div key={index} className="border rounded p-3 text-sm">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium">{component.name}</span>
                        <span className="font-semibold text-green-600">
                          {formatCurrency(component.totalPrice)}
                        </span>
                      </div>
                      <p className="text-gray-600 text-xs mb-1">{component.description}</p>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          {component.type}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {component.quantity}x {formatCurrency(component.unitPrice)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Detalhamento de Preços</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(selectedProposal.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxas:</span>
                      <span>{formatCurrency(selectedProposal.taxes)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fees:</span>
                      <span>{formatCurrency(selectedProposal.fees)}</span>
                    </div>
                    {selectedProposal.discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Desconto:</span>
                        <span>-{formatCurrency(selectedProposal.discount)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 flex justify-between font-semibold">
                      <span>Total:</span>
                      <span className="text-green-600">{formatCurrency(selectedProposal.totalPrice)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button
                  onClick={() => window.open(`/propostas/${selectedProposal._id}`, '_blank')}
                >
                  Ver Página Pública
                </Button>
                {selectedProposal.status === "draft" && (
                  <Button
                    onClick={() => {
                      handleSendProposal(selectedProposal._id);
                      setShowViewDialog(false);
                    }}
                  >
                    Enviar Proposta
                  </Button>
                )}
                <Button variant="outline" onClick={() => setShowViewDialog(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6 mt-4">
          {/* Check if there are any proposals to show documents for */}
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
                      Proposta #{proposal.proposalNumber} - Documentos e anexos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ProposalDocumentManager proposalId={proposal._id} />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Nenhuma proposta criada ainda</p>
                  <p className="text-sm text-gray-500">
                    Crie uma proposta primeiro para poder gerenciar documentos
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
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

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Data não definida";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "Data inválida" : date.toLocaleDateString('pt-BR');
  };

  // Helper function to format trip dates (handles both specific and flexible dates)
  const formatTripDates = (tripDetails: any) => {
    if (tripDetails.flexibleDates) {
      // For flexible dates, show months
      const startMonth = tripDetails.startMonth;
      const endMonth = tripDetails.endMonth;
      
      if (startMonth && endMonth) {
        const formatMonth = (monthStr: string) => {
          const [year, month] = monthStr.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1);
          return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        };
        
        if (startMonth === endMonth) {
          return `${formatMonth(startMonth)} (datas flexíveis)`;
        } else {
          return `${formatMonth(startMonth)} - ${formatMonth(endMonth)} (datas flexíveis)`;
        }
      }
      return "Datas flexíveis";
    } else {
      // For specific dates
      if (tripDetails.startDate && tripDetails.endDate) {
        return `${formatDate(tripDetails.startDate)} - ${formatDate(tripDetails.endDate)}`;
      }
      return "Datas a definir";
    }
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
            <div className="md:col-span-2">
              <strong>Datas da Viagem:</strong> {formatTripDates(request.tripDetails)}
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