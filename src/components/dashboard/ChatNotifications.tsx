"use client";

import React, { useState } from "react";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageCircle,
  BellRing,
  CheckCircle2,
  Clock,
  User,
  ExternalLink,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ui } from "@/lib/ui-config";
import { ChatWindow } from "@/components/chat/ChatWindow";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Id } from "@/../convex/_generated/dataModel";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface ChatNotificationsProps {
  className?: string;
  maxItems?: number;
  showTitle?: boolean;
}

export function ChatNotifications({ 
  className, 
  maxItems = 10, 
  showTitle = true 
}: ChatNotificationsProps) {
  const [selectedChatRoomId, setSelectedChatRoomId] = useState<Id<"chatRooms"> | null>(null);
  const [showChatDialog, setShowChatDialog] = useState(false);

  // Buscar notificações de chat para o usuário atual
  const notifications = useQuery(api.domains.notifications.queries.getUserNotifications, {
    limit: maxItems,
  });

  // Filtrar apenas notificações de chat
  const chatNotifications = notifications?.filter(n => 
    n.type === "chat_message" || n.type === "chat_room_created"
  ) || [];

  // Mutations
  const markAsRead = useMutation(api.domains.notifications.mutations.markAsRead);
  const deleteNotification = useMutation(api.domains.notifications.mutations.deleteNotification);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead({ notificationId });
    } catch (error) {
      toast.error("Erro ao marcar notificação como lida");
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

  const handleOpenChat = (chatRoomId: string) => {
    try {
      setSelectedChatRoomId(chatRoomId as Id<"chatRooms">);
      setShowChatDialog(true);
    } catch (error) {
      toast.error("Erro ao abrir conversa");
      console.error(error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "chat_message":
        return <MessageCircle className="w-4 h-4 text-purple-500" />;
      case "chat_room_created":
        return <MessageCircle className="w-4 h-4 text-indigo-500" />;
      default:
        return <BellRing className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case "chat_message":
        return "Mensagem";
      case "chat_room_created":
        return "Nova Conversa";
      default:
        return "Chat";
    }
  };

  const unreadCount = chatNotifications.filter(n => !n.isRead).length;

  return (
    <>
      <Card className={cn("bg-white shadow-sm", className)}>
        {showTitle && (
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-purple-600" />
                <span>Notificações de Chat</span>
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {unreadCount}
                  </Badge>
                )}
              </div>
            </CardTitle>
            <CardDescription>
              Mensagens e conversas recentes
            </CardDescription>
          </CardHeader>
        )}
        
        <CardContent className={showTitle ? "pt-0" : ""}>
          {chatNotifications.length > 0 ? (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {chatNotifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={cn(
                      "p-3 rounded-lg border transition-colors group",
                      !notification.isRead 
                        ? "bg-purple-50 border-purple-200 hover:bg-purple-100" 
                        : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                            >
                              {getNotificationTypeLabel(notification.type)}
                            </Badge>
                            {!notification.isRead && (
                              <Badge variant="default" className="text-xs">
                                Nova
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {notification.relatedId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleOpenChat(notification.relatedId!)}
                                title="Abrir conversa"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </Button>
                            )}
                            {!notification.isRead && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => handleMarkAsRead(notification._id)}
                                title="Marcar como lida"
                              >
                                <CheckCircle2 className="w-3 h-3" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              onClick={() => handleDeleteNotification(notification._id)}
                              title="Remover notificação"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <h4 className={cn(
                          "font-medium text-sm mb-1",
                          !notification.isRead && "text-gray-900",
                          notification.isRead && "text-gray-600"
                        )}>
                          {notification.title}
                        </h4>
                        
                        <p className={cn(
                          "text-sm mb-2 line-clamp-2",
                          !notification.isRead && "text-gray-700",
                          notification.isRead && "text-gray-500"
                        )}>
                          {notification.message}
                        </p>
                        
                        {notification.data && (
                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                            {notification.data.senderName && (
                              <div className="flex items-center gap-1">
                                <User className="w-3 h-3" />
                                <span>{notification.data.senderName}</span>
                              </div>
                            )}
                            {notification.data.assetName && (
                              <div className="flex items-center gap-1">
                                <span>📍 {notification.data.assetName}</span>
                              </div>
                            )}
                            {notification.data.bookingCode && (
                              <div className="flex items-center gap-1">
                                <span>🎫 {notification.data.bookingCode}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>
                              {format(new Date(notification.createdAt), "dd/MM HH:mm", {
                                locale: ptBR,
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma notificação de chat
              </h3>
              <p className="text-gray-500">
                Você será notificado quando receber mensagens
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Chat */}
      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] p-0">
          <VisuallyHidden>
            <DialogTitle>Conversa com Cliente</DialogTitle>
          </VisuallyHidden>
          {selectedChatRoomId && (
            <ChatWindow
              chatRoomId={selectedChatRoomId}
              onClose={() => setShowChatDialog(false)}
              className="h-[600px]"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 