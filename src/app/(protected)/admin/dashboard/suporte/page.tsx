"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  MessageSquare, 
  AlertTriangle, 
  User, 
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Mail,
  Phone
} from "lucide-react";
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
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { Id } from "@/../convex/_generated/dataModel";

type SupportMessage = {
  _id: Id<"supportMessages">;
  _creationTime: number;
  userId: Id<"users">;
  userRole: "traveler" | "partner" | "employee" | "master";
  subject: string;
  category: string;
  message: string;
  contactEmail: string;
  isUrgent: boolean;
  status: string;
  assignedToMasterId?: Id<"users">;
  responseMessage?: string;
  respondedAt?: number;
  createdAt: number;
  updatedAt: number;
  user: {
    _id: Id<"users">;
    name?: string;
    email?: string;
    role?: string;
  };
  assignedMaster?: {
    _id: Id<"users">;
    name?: string;
    email?: string;
  };
};

const categoryLabels: Record<string, string> = {
  duvida: "Dúvida",
  problema: "Problema",
  sugestao: "Sugestão",
  cancelamento: "Cancelamento",
  outro: "Outro",
};

const statusLabels: Record<string, string> = {
  open: "Aberta",
  in_progress: "Em Andamento",
  resolved: "Resolvida",
  closed: "Fechada",
};

const statusColors: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  resolved: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

export default function SupportPage() {
  const { user } = useCurrentUser();
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [responseText, setResponseText] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Queries
  const supportMessages = useQuery(api["domains/support/queries"].listSupportMessages, {
    status: selectedStatus === "all" ? undefined : selectedStatus as any,
    limit: 100,
  });

  const supportStats = useQuery(api["domains/support/queries"].getSupportStatistics);

  // Mutations
  const updateStatus = useMutation(api["domains/support/mutations"].updateSupportMessageStatus);

  if (user?.role !== "master") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Apenas administradores master podem acessar esta página.</p>
        </div>
      </div>
    );
  }

  const handleViewMessage = (message: SupportMessage) => {
    setSelectedMessage(message);
    setResponseText(message.responseMessage || "");
    setIsDialogOpen(true);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedMessage) return;

    try {
      await updateStatus({
        supportMessageId: selectedMessage._id,
        status: newStatus as any,
        responseMessage: responseText.trim() || undefined,
      });

      toast.success(`Status atualizado para ${statusLabels[newStatus]}`);
      setIsDialogOpen(false);
      setSelectedMessage(null);
      setResponseText("");
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status da mensagem");
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUrgentMessages = () => {
    return supportMessages?.filter(msg => msg.isUrgent && msg.status !== "closed") || [];
  };

  const getMyAssignedMessages = () => {
    return supportMessages?.filter(msg => 
      msg.assignedToMasterId?.toString() === user?._id?.toString()
    ) || [];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg">
            <MessageSquare className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mensagens de Suporte</h1>
            <p className="text-sm text-gray-600">
              Gerenciar solicitações de suporte dos usuários
            </p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      {supportStats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{supportStats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Abertas</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{supportStats.open}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{supportStats.inProgress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolvidas</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{supportStats.resolved}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{supportStats.urgent}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Minhas</CardTitle>
              <User className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{supportStats.myAssigned}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <div className="flex items-center gap-4">
        <Select value={selectedStatus} onValueChange={setSelectedStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="open">Abertas</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="resolved">Resolvidas</SelectItem>
            <SelectItem value="closed">Fechadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de Mensagens */}
      <div className="space-y-4">
        {!supportMessages && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}

        {supportMessages && supportMessages.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma mensagem encontrada</h3>
                <p className="text-gray-600">
                  {selectedStatus === "all" 
                    ? "Não há mensagens de suporte no momento."
                    : `Não há mensagens com status "${statusLabels[selectedStatus]}".`
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {supportMessages?.map((message) => (
          <Card 
            key={message._id} 
            className={`cursor-pointer hover:shadow-md transition-shadow ${
              message.isUrgent ? "border-l-4 border-red-500" : ""
            }`}
            onClick={() => handleViewMessage(message)}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{message.subject}</h3>
                    {message.isUrgent && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Urgente
                      </Badge>
                    )}
                    <Badge className={`text-xs ${statusColors[message.status]}`}>
                      {statusLabels[message.status]}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {categoryLabels[message.category]}
                    </Badge>
                  </div>

                  <p className="text-gray-600 mb-3 line-clamp-2">
                    {message.message}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      {message.user.name || "Usuário"} ({message.userRole})
                    </div>
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {message.contactEmail}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatDate(message.createdAt)}
                    </div>
                  </div>

                  {message.assignedMaster && (
                    <div className="mt-2 text-sm text-purple-600">
                      Atribuída para: {message.assignedMaster.name}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog para visualizar/responder mensagem */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedMessage && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {selectedMessage.subject}
                  {selectedMessage.isUrgent && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Urgente
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Categoria:</strong> {categoryLabels[selectedMessage.category]}
                    </div>
                    <div>
                      <strong>Usuário:</strong> {selectedMessage.user.name || "Usuário"} ({selectedMessage.userRole})
                    </div>
                    <div>
                      <strong>Email:</strong> {selectedMessage.contactEmail}
                    </div>
                    <div>
                      <strong>Criado em:</strong> {formatDate(selectedMessage.createdAt)}
                    </div>
                    <div>
                      <strong>Status:</strong> 
                      <Badge className={`ml-2 text-xs ${statusColors[selectedMessage.status]}`}>
                        {statusLabels[selectedMessage.status]}
                      </Badge>
                    </div>
                  </div>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Mensagem:</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                  </div>
                </div>

                {selectedMessage.responseMessage && (
                  <div>
                    <h4 className="font-medium mb-2">Resposta Anterior:</h4>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="whitespace-pre-wrap">{selectedMessage.responseMessage}</p>
                      {selectedMessage.respondedAt && (
                        <div className="text-xs text-gray-500 mt-2">
                          Respondido em: {formatDate(selectedMessage.respondedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-2">Resposta:</h4>
                  <Textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Digite sua resposta..."
                    rows={4}
                    className="w-full"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <div className="flex gap-2 flex-wrap">
                  {selectedMessage.status !== "in_progress" && (
                    <Button 
                      variant="outline"
                      onClick={() => handleUpdateStatus("in_progress")}
                    >
                      Marcar como Em Andamento
                    </Button>
                  )}
                  
                  {selectedMessage.status !== "resolved" && (
                    <Button 
                      variant="default"
                      onClick={() => handleUpdateStatus("resolved")}
                      disabled={!responseText.trim()}
                    >
                      Resolver
                    </Button>
                  )}
                  
                  {selectedMessage.status !== "closed" && (
                    <Button 
                      variant="destructive"
                      onClick={() => handleUpdateStatus("closed")}
                    >
                      Fechar
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 