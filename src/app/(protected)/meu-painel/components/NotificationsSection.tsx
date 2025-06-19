"use client";

import React, { useState } from 'react';
import { motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Bell, 
  CheckCircle2, 
  Calendar,
  CreditCard,
  MessageCircle,
  BellRing,
  Search,
  X,
  Dot,
  MoreHorizontal
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface NotificationsSectionProps {
  className?: string;
  maxItems?: number;
  compact?: boolean;
}

export default function NotificationsSection({ 
  className, 
  maxItems = 20, 
  compact = false 
}: NotificationsSectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch notifications from Convex
  const notifications = useQuery(api.domains.notifications.queries.getUserNotifications, {
    limit: maxItems,
  });

  // Get unread count
  const unreadCount = useQuery(api.domains.notifications.queries.getUnreadNotificationCount);

  // Mutations
  const markAsRead = useMutation(api.domains.notifications.mutations.markAsRead);
  const markAllAsRead = useMutation(api.domains.notifications.mutations.markAllAsRead);
  const deleteNotification = useMutation(api.domains.notifications.mutations.deleteNotification);

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

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead({ notificationId });
    } catch (error) {
      toast.error("Erro ao marcar notificação como lida");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead({});
      toast.success("Todas as notificações foram marcadas como lidas");
    } catch (error) {
      toast.error("Erro ao marcar todas as notificações como lidas");
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await deleteNotification({ notificationId });
      toast.success("Notificação removida");
    } catch (error) {
      toast.error("Erro ao remover notificação");
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconMap = {
      booking_confirmed: { icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-50" },
      booking_canceled: { icon: Calendar, color: "text-red-500", bg: "bg-red-50" },
      booking_updated: { icon: Calendar, color: "text-blue-500", bg: "bg-blue-50" },
      booking_reminder: { icon: BellRing, color: "text-orange-500", bg: "bg-orange-50" },
      payment_received: { icon: CreditCard, color: "text-emerald-500", bg: "bg-emerald-50" },
      system_update: { icon: Bell, color: "text-blue-500", bg: "bg-blue-50" },
      chat_message: { icon: MessageCircle, color: "text-purple-500", bg: "bg-purple-50" },
      chat_room_created: { icon: MessageCircle, color: "text-indigo-500", bg: "bg-indigo-50" },
    };

    const { icon: IconComponent, color, bg } = iconMap[type] || { 
      icon: Bell, 
      color: "text-gray-500", 
      bg: "bg-gray-50" 
    };
    
    return (
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center border border-white/80 shadow-sm`}>
        <IconComponent className={`h-5 w-5 ${color}`} />
      </div>
    );
  };

  const getNotificationStyle = (type: string, isRead: boolean) => {
    if (isRead) {
      return "bg-gray-50/70 hover:bg-gray-100/70 border-gray-200/50";
    }
    
    const typeStyles = {
      booking_confirmed: "bg-emerald-50/50 hover:bg-emerald-50 border-l-emerald-400",
      booking_canceled: "bg-red-50/50 hover:bg-red-50 border-l-red-400",
      booking_updated: "bg-blue-50/50 hover:bg-blue-50 border-l-blue-400",
      booking_reminder: "bg-orange-50/50 hover:bg-orange-50 border-l-orange-400",
      payment_received: "bg-emerald-50/50 hover:bg-emerald-50 border-l-emerald-400",
      system_update: "bg-blue-50/50 hover:bg-blue-50 border-l-blue-400",
      chat_message: "bg-purple-50/50 hover:bg-purple-50 border-l-purple-400",
      chat_room_created: "bg-indigo-50/50 hover:bg-indigo-50 border-l-indigo-400",
    };

    return typeStyles[type] || "bg-gray-50/50 hover:bg-gray-50 border-l-gray-400";
  };

  const getNotificationTypeLabel = (type: string) => {
    const labels = {
      booking_confirmed: "Reserva Confirmada",
      booking_canceled: "Reserva Cancelada", 
      booking_updated: "Reserva Atualizada",
      booking_reminder: "Lembrete",
      payment_received: "Pagamento",
      system_update: "Sistema",
      chat_message: "Mensagem",
      chat_room_created: "Nova Conversa",
    };
    return labels[type] || "Notificação";
  };

  if (compact) {
    return (
      <Card className={cn("bg-white shadow-sm border-gray-200/50", className)}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-gray-600" />
              <CardTitle className="text-lg font-semibold text-gray-900">
                Notificações
              </CardTitle>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs font-medium">
                  {unreadCount} novas
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {filteredNotifications.length > 0 ? (
            <div className="space-y-2">
              {filteredNotifications.slice(0, 3).map((notification) => (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "relative p-3 rounded-xl border border-l-2 transition-all duration-200 cursor-pointer group",
                    getNotificationStyle(notification.type, notification.isRead)
                  )}
                  onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <h4 className={cn(
                          "font-medium text-sm leading-tight",
                          !notification.isRead ? "text-gray-900" : "text-gray-600"
                        )}>
                          {notification.title}
                        </h4>
                        {!notification.isRead && (
                          <Dot className="w-4 h-4 text-blue-500 fill-blue-500" />
                        )}
                      </div>
                      
                      <p className={cn(
                        "text-sm leading-relaxed mb-2",
                        !notification.isRead ? "text-gray-700" : "text-gray-500"
                      )}>
                        {notification.message}
                      </p>
                      
                      <time className="text-xs text-gray-400" dateTime={notification.createdAt}>
                        {format(new Date(notification.createdAt), "dd/MM 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </time>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Bell className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-gray-500 text-sm">Nenhuma notificação</p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Bell className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Notificações</h1>
            <p className="text-gray-500">
              {unreadCount > 0 ? `${unreadCount} notificações não lidas` : "Todas as notificações estão em dia"}
            </p>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <Button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Marcar todas como lidas
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
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
            <SelectItem value="booking_confirmed">Reservas Confirmadas</SelectItem>
            <SelectItem value="booking_canceled">Reservas Canceladas</SelectItem>
            <SelectItem value="booking_reminder">Lembretes</SelectItem>
            <SelectItem value="payment_received">Pagamentos</SelectItem>
            <SelectItem value="chat_message">Mensagens</SelectItem>
            <SelectItem value="system_update">Sistema</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="unread">Não lidas</SelectItem>
            <SelectItem value="read">Lidas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notification) => (
            <motion.div
              key={notification._id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "relative p-4 rounded-xl border border-l-2 transition-all duration-200 cursor-pointer group",
                getNotificationStyle(notification.type, notification.isRead)
              )}
              onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className="text-xs font-medium border-gray-300"
                      >
                        {getNotificationTypeLabel(notification.type)}
                      </Badge>
                      {!notification.isRead && (
                        <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                          Nova
                        </span>
                      )}
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!notification.isRead && (
                          <DropdownMenuItem onClick={() => handleMarkAsRead(notification._id)}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Marcar como lida
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem 
                          onClick={() => handleDeleteNotification(notification._id)}
                          className="text-red-600"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <h4 className={cn(
                    "font-medium text-lg mb-2 leading-tight",
                    !notification.isRead ? "text-gray-900" : "text-gray-600"
                  )}>
                    {notification.title}
                  </h4>
                  
                  <p className={cn(
                    "text-sm leading-relaxed mb-3",
                    !notification.isRead ? "text-gray-700" : "text-gray-500"
                  )}>
                    {notification.message}
                  </p>
                  
                  {notification.data && (
                    <div className="mb-3 p-3 bg-white/60 rounded-lg border border-gray-200/50">
                      <div className="space-y-2 text-sm">
                        {notification.data.confirmationCode && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Código:</span>
                            <code className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-800">
                              {notification.data.confirmationCode}
                            </code>
                          </div>
                        )}
                        {notification.data.assetName && (
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500">Local:</span>
                            <span className="text-gray-700">{notification.data.assetName}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <time className="text-xs text-gray-400" dateTime={notification.createdAt}>
                    {format(new Date(notification.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                      locale: ptBR,
                    })}
                  </time>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma notificação encontrada
            </h3>
            <p className="text-gray-500 max-w-sm leading-relaxed">
              {searchTerm || typeFilter !== "all" || statusFilter !== "all" 
                ? "Ajuste os filtros para ver mais notificações" 
                : "Você receberá notificações sobre suas reservas e atualizações importantes aqui."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 