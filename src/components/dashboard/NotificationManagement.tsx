"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Bell,
  BellRing,
  CheckCircle,
  Calendar,
  CreditCard,
  Users,
  Send,
  Search,
  Filter,
  Trash2,
  Eye,
  Plus,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ui } from "@/lib/ui-config";

interface NotificationManagementProps {
  className?: string;
}

export function NotificationManagement({ className }: NotificationManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newNotification, setNewNotification] = useState({
    type: "system_update",
    title: "",
    message: "",
    userEmail: "",
  });

  // Fetch user notifications with admin privileges
  const notifications = useQuery(api.domains.notifications.queries.getUserNotifications, {
    limit: 100,
    includeRead: true,
  });

  // Get all users for sending notifications
  const users = useQuery(api.domains.users.queries.getAllUsers);

  // Mutations
  const createNotification = useMutation(api.domains.notifications.mutations.createNotification);
  const markAsRead = useMutation(api.domains.notifications.mutations.markAsRead);
  const deleteNotification = useMutation(api.domains.notifications.mutations.deleteNotification);
  const sendBulkNotification = useMutation(api.domains.notifications.mutations.sendBulkNotification);

  // Filter notifications
  const filteredNotifications = notifications?.filter((notification) => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === "all" || notification.type === typeFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "read" && notification.isRead) ||
      (statusFilter === "unread" && !notification.isRead);
    
    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  const handleCreateNotification = async () => {
    if (!newNotification.title || !newNotification.message) {
      toast.error("Título e mensagem são obrigatórios");
      return;
    }

    try {
      if (newNotification.userEmail) {
        // Send to specific user
        const user = users?.find(u => u.email === newNotification.userEmail);
        if (!user) {
          toast.error("Usuário não encontrado");
          return;
        }

        await createNotification({
          userId: user._id,
          type: newNotification.type,
          title: newNotification.title,
          message: newNotification.message,
        });
      } else {
        // Send to all users
        if (users) {
          await sendBulkNotification({
            userIds: users.map(u => u._id),
            type: newNotification.type,
            title: newNotification.title,
            message: newNotification.message,
          });
        }
      }

      toast.success("Notificação enviada com sucesso!");
      setIsCreateDialogOpen(false);
      setNewNotification({
        type: "system_update",
        title: "",
        message: "",
        userEmail: "",
      });
    } catch (error) {
      toast.error("Erro ao enviar notificação");
      console.error(error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification({ notificationId });
      toast.success("Notificação removida");
    } catch (error) {
      toast.error("Erro ao remover notificação");
      console.error(error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "booking_confirmed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "booking_canceled":
        return <Calendar className="w-5 h-5 text-red-500" />;
      case "booking_updated":
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case "booking_reminder":
        return <BellRing className="w-5 h-5 text-orange-500" />;
      case "payment_received":
        return <CreditCard className="w-5 h-5 text-green-500" />;
      case "system_update":
        return <Bell className="w-5 h-5 text-blue-500" />;
      case "chat_message":
        return <MessageCircle className="w-5 h-5 text-purple-500" />;
      case "chat_room_created":
        return <MessageCircle className="w-5 h-5 text-indigo-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case "booking_confirmed":
        return "Reserva Confirmada";
      case "booking_canceled":
        return "Reserva Cancelada";
      case "booking_updated":
        return "Reserva Atualizada";
      case "booking_reminder":
        return "Lembrete de Reserva";
      case "payment_received":
        return "Pagamento Recebido";
      case "system_update":
        return "Atualização do Sistema";
      case "chat_message":
        return "Mensagem de Chat";
      case "chat_room_created":
        return "Nova Conversa";
      default:
        return "Notificação";
    }
  };

  const stats = {
    total: notifications?.length || 0,
    unread: notifications?.filter(n => !n.isRead).length || 0,
    today: notifications?.filter(n => {
      const today = new Date();
      const notificationDate = new Date(n.createdAt);
      return notificationDate.toDateString() === today.toDateString();
    }).length || 0,
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className={`${ui.typography.h2.className} ${ui.colors.text.primary}`}>
            Gerenciamento de Notificações
          </h2>
          <p className={ui.colors.text.secondary}>
            Visualize e gerencie notificações do sistema
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nova Notificação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Notificação</DialogTitle>
              <DialogDescription>
                Envie uma notificação para usuários específicos ou todos os usuários
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="type">Tipo de Notificação</Label>
                <Select
                  value={newNotification.type}
                  onValueChange={(value) => 
                    setNewNotification(prev => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system_update">Atualização do Sistema</SelectItem>
                    <SelectItem value="booking_reminder">Lembrete</SelectItem>
                    <SelectItem value="payment_received">Pagamento</SelectItem>
                    <SelectItem value="chat_message">Mensagem de Chat</SelectItem>
                    <SelectItem value="chat_room_created">Nova Conversa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="userEmail">Email do Usuário (opcional)</Label>
                <Input
                  id="userEmail"
                  placeholder="Deixe vazio para enviar para todos"
                  value={newNotification.userEmail}
                  onChange={(e) => 
                    setNewNotification(prev => ({ ...prev, userEmail: e.target.value }))
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  placeholder="Título da notificação"
                  value={newNotification.title}
                  onChange={(e) => 
                    setNewNotification(prev => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>
              
              <div>
                <Label htmlFor="message">Mensagem</Label>
                <Textarea
                  id="message"
                  placeholder="Conteúdo da notificação"
                  value={newNotification.message}
                  onChange={(e) => 
                    setNewNotification(prev => ({ ...prev, message: e.target.value }))
                  }
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateNotification}>
                  <Send className="w-4 h-4 mr-2" />
                  Enviar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${ui.colors.text.secondary}`}>
                  Total de Notificações
                </p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Bell className={`h-8 w-8 ${ui.colors.primary}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${ui.colors.text.secondary}`}>
                  Não Lidas
                </p>
                <p className={`text-2xl font-bold ${ui.colors.warning}`}>
                  {stats.unread}
                </p>
              </div>
              <BellRing className={`h-8 w-8 ${ui.colors.warning}`} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${ui.colors.text.secondary}`}>
                  Hoje
                </p>
                <p className={`text-2xl font-bold ${ui.colors.success}`}>
                  {stats.today}
                </p>
              </div>
              <Calendar className={`h-8 w-8 ${ui.colors.success}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${ui.colors.text.muted} w-4 h-4`} />
          <Input
            placeholder="Buscar notificações..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="booking_confirmed">Reserva Confirmada</SelectItem>
            <SelectItem value="booking_canceled">Reserva Cancelada</SelectItem>
            <SelectItem value="booking_updated">Reserva Atualizada</SelectItem>
            <SelectItem value="booking_reminder">Lembrete</SelectItem>
            <SelectItem value="payment_received">Pagamento</SelectItem>
            <SelectItem value="system_update">Sistema</SelectItem>
            <SelectItem value="chat_message">Mensagem de Chat</SelectItem>
            <SelectItem value="chat_room_created">Nova Conversa</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="unread">Não lidas</SelectItem>
            <SelectItem value="read">Lidas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <Card key={notification._id} className={cn(
              "transition-colors",
              !notification.isRead && "bg-blue-50 border-l-4 border-blue-500"
            )}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className={cn(
                          "font-medium text-sm",
                          !notification.isRead && "text-gray-900",
                          notification.isRead && "text-gray-600"
                        )}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-2 ml-2">
                          <Badge variant="outline" className="text-xs">
                            {getNotificationTypeLabel(notification.type)}
                          </Badge>
                          {!notification.isRead && (
                            <Badge variant="default" className="text-xs">
                              Nova
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className={cn(
                        "text-sm mb-2",
                        !notification.isRead && "text-gray-700",
                        notification.isRead && "text-gray-500"
                      )}>
                        {notification.message}
                      </p>
                      
                      {notification.data && (
                        <div className="text-xs text-gray-500 space-y-1 mb-2">
                          {notification.data.confirmationCode && (
                            <p className="font-mono">
                              Código: {notification.data.confirmationCode}
                            </p>
                          )}
                          {notification.data.assetName && (
                            <p>Local: {notification.data.assetName}</p>
                          )}
                        </div>
                      )}
                      
                      <p className="text-xs text-gray-400">
                        {format(new Date(notification.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedNotification(notification)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteNotification(notification._id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma notificação encontrada
              </h3>
              <p className="text-gray-500">
                Ajuste os filtros ou crie uma nova notificação
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 