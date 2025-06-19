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
  X,
  Dot,
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
  showWrapper?: boolean;
}

export function ChatNotifications({ 
  className, 
  maxItems = 10, 
  showTitle = true,
  showWrapper = true
}: ChatNotificationsProps) {
  const [selectedChatId, setSelectedChatId] = useState<Id<"chatRooms"> | null>(null);

  // Get chat-related notifications
  const notifications = useQuery(api.domains.notifications.queries.getUserNotifications, {
    limit: maxItems,
    type: "chat"
  });

  // Filter chat notifications
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

  const handleOpenChat = (chatId: Id<"chatRooms">) => {
    setSelectedChatId(chatId);
  };

  const getNotificationIcon = (type: string) => {
    const iconMap = {
      chat_message: { icon: MessageCircle, color: "text-purple-500", bg: "bg-purple-50" },
      chat_room_created: { icon: MessageCircle, color: "text-indigo-500", bg: "bg-indigo-50" },
    };
    
    const { icon: IconComponent, color, bg } = iconMap[type] || { 
      icon: MessageCircle, 
      color: "text-gray-500", 
      bg: "bg-gray-50" 
    };
    
    return (
      <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center border border-white/80 shadow-sm`}>
        <IconComponent className={`w-5 h-5 ${color}`} />
      </div>
    );
  };

  const getNotificationTypeLabel = (type: string) => {
    const labels = {
      chat_message: "Nova Mensagem",
      chat_room_created: "Nova Conversa",
    };
    return labels[type] || "Chat";
  };

  const getNotificationStyle = (type: string, isRead: boolean) => {
    if (isRead) {
      return "bg-gray-50/70 hover:bg-gray-100/70 border-gray-200/50";
    }
    
    const typeStyles = {
      chat_message: "bg-purple-50/50 hover:bg-purple-50 border-l-purple-400",
      chat_room_created: "bg-indigo-50/50 hover:bg-indigo-50 border-l-indigo-400",
    };

    return typeStyles[type] || "bg-gray-50/50 hover:bg-gray-50 border-l-gray-400";
  };

  const NotificationsContent = () => (
    <>
      {showTitle && showWrapper && (
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-purple-500" />
              <CardTitle className="text-lg font-semibold text-gray-900">
                Notificações de Chat
              </CardTitle>
              {chatNotifications.filter(n => !n.isRead).length > 0 && (
                <Badge variant="secondary" className="text-xs font-medium">
                  {chatNotifications.filter(n => !n.isRead).length} novas
                </Badge>
              )}
            </div>
          </div>
          <CardDescription className="text-gray-500">
            Mensagens e atualizações de conversas
          </CardDescription>
        </CardHeader>
      )}
      
      <div className={showWrapper ? (showTitle ? "pt-0" : "") : "p-4"}>
        {chatNotifications.length > 0 ? (
          <ScrollArea className={showWrapper ? "h-[400px]" : "h-[300px]"}>
            <div className="space-y-2">
              {chatNotifications.map((notification) => (
                <div
                  key={notification._id}
                  className={cn(
                    "relative p-3 rounded-xl border border-l-2 transition-all duration-200 group",
                    getNotificationStyle(notification.type, notification.isRead)
                  )}
                >
                  <div className="flex items-start gap-3">
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
                            <Dot className="w-4 h-4 text-purple-500 fill-purple-500" />
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {notification.relatedId && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 rounded-full hover:bg-white/80"
                              onClick={() => handleOpenChat(notification.relatedId!)}
                              title="Abrir conversa"
                            >
                              <ExternalLink className="w-3 h-3 text-gray-600" />
                            </Button>
                          )}
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 rounded-full hover:bg-white/80"
                              onClick={() => handleMarkAsRead(notification._id)}
                              title="Marcar como lida"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 rounded-full hover:bg-white/80 text-red-500 hover:text-red-700"
                            onClick={() => handleDeleteNotification(notification._id)}
                            title="Remover notificação"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <h4 className={cn(
                        "font-medium text-sm mb-2 leading-tight",
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

                      <div className="flex items-center justify-between">
                        <time className="text-xs text-gray-400" dateTime={notification.createdAt}>
                          {format(new Date(notification.createdAt), "dd/MM 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </time>
                        
                        {!notification.isRead && (
                          <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                            Nova
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
              <MessageCircle className="h-6 w-6 text-purple-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhuma notificação de chat
            </h3>
            <p className="text-gray-500 max-w-sm leading-relaxed">
              Você receberá notificações quando receber mensagens ou quando novas conversas forem criadas.
            </p>
          </div>
        )}
      </div>
    </>
  );

  if (!showWrapper) {
    return (
      <div className={cn("bg-white rounded-lg", className)}>
        <NotificationsContent />
        
        {/* Chat Dialog */}
        <Dialog open={!!selectedChatId} onOpenChange={() => setSelectedChatId(null)}>
          <DialogContent className="max-w-4xl h-[80vh] p-0">
            <VisuallyHidden>
              <DialogTitle>Chat</DialogTitle>
            </VisuallyHidden>
            {selectedChatId && (
              <ChatWindow 
                chatRoomId={selectedChatId}
                onClose={() => setSelectedChatId(null)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <>
      <Card className={cn("bg-white shadow-sm border-gray-200/50", className)}>
        <CardContent className={showTitle ? "" : "p-0"}>
          <NotificationsContent />
        </CardContent>
      </Card>

      {/* Chat Dialog */}
      <Dialog open={!!selectedChatId} onOpenChange={() => setSelectedChatId(null)}>
        <DialogContent className="max-w-4xl h-[80vh] p-0">
          <VisuallyHidden>
            <DialogTitle>Chat</DialogTitle>
          </VisuallyHidden>
          {selectedChatId && (
            <ChatWindow 
              chatRoomId={selectedChatId}
              onClose={() => setSelectedChatId(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
} 