"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Search, 
  Calendar,
  User,
  Clock,
  AlertCircle,
  Archive,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { DashboardPageHeader } from "../components";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AdminChatsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Buscar salas de chat
  const chatRooms = useQuery(api.domains.chat.queries.listChatRooms, {
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const filteredChats = chatRooms?.filter((room) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      room.title.toLowerCase().includes(searchLower) ||
      room.otherParticipant.name?.toLowerCase().includes(searchLower) ||
      room.otherParticipant.email?.toLowerCase().includes(searchLower) ||
      room.contextId.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Ativa", color: "bg-green-100 text-green-800", icon: CheckCircle },
      closed: { label: "Fechada", color: "bg-gray-100 text-gray-800", icon: XCircle },
      archived: { label: "Arquivada", color: "bg-gray-100 text-gray-800", icon: Archive },
      escalated: { label: "Escalada", color: "bg-red-100 text-red-800", icon: AlertCircle },
      pending_response: { label: "Aguardando", color: "bg-yellow-100 text-yellow-800", icon: Clock },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    const Icon = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const formatContextType = (type: string) => {
    const types = {
      asset: "Asset",
      booking: "Reserva",
      admin_reservation: "Reserva Admin",
      package_request: "Solicitação de Pacote",
      package_proposal: "Proposta de Pacote",
    };
    return types[type as keyof typeof types] || type;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <DashboardPageHeader
        title="Central de Conversas"
        description="Gerencie todas as conversas com clientes"
        icon={MessageCircle}
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por título, cliente ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="closed">Fechadas</SelectItem>
                <SelectItem value="archived">Arquivadas</SelectItem>
                <SelectItem value="escalated">Escaladas</SelectItem>
                <SelectItem value="pending_response">Aguardando Resposta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Chat List */}
      <Card>
        <CardHeader>
          <CardTitle>Conversas</CardTitle>
          <CardDescription>
            {filteredChats?.length || 0} conversas encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {!filteredChats?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma conversa encontrada
              </div>
            ) : (
              filteredChats.map((room) => (
                <Card
                  key={room._id}
                  className="border cursor-pointer hover:shadow-md transition-all"
                  onClick={() => router.push(`/admin/dashboard/chats/${room._id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold">{room.title}</h3>
                          {getStatusBadge(room.status)}
                          <Badge variant="outline">
                            {formatContextType(room.contextType)}
                          </Badge>
                          {room.unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white">
                              {room.unreadCount} nova{room.unreadCount > 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            {room.otherParticipant.name || room.otherParticipant.email}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(room.lastMessageAt || room.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </div>
                          
                          {room.contextType === "booking" && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                Código: {room.contextId}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {room.lastMessagePreview && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {room.lastMessagePreview}
                          </p>
                        )}
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        className="ml-4"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 