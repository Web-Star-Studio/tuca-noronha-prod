import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bell,
  BellRing,
  CheckCircle,
  Calendar,
  CreditCard,
  CheckCircle2,
  Trash2,
  MessageCircle,
  X,
  Dot,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ui } from "@/lib/ui-config";

interface NotificationCenterProps {
  children?: React.ReactNode;
  className?: string;
}

export function NotificationCenter({ children, className }: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const focusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastFocusActionRef = useRef<string | null>(null);

  // Protected focus handlers to prevent infinite recursion
  const safeFocusHandler = useCallback((action: string, callback: () => void) => {
    const now = Date.now().toString();
    
    // Prevent rapid successive focus actions
    if (lastFocusActionRef.current === action) {
      return;
    }
    
    lastFocusActionRef.current = action;
    
    // Clear any existing timeout
    if (focusTimeoutRef.current) {
      clearTimeout(focusTimeoutRef.current);
    }
    
    // Execute the callback safely
    try {
      callback();
    } catch (error) {
      console.error('Focus handler error:', error);
    }
    
    // Reset the action tracker after a short delay
    focusTimeoutRef.current = setTimeout(() => {
      lastFocusActionRef.current = null;
    }, 100);
  }, []);

  const handleOpenChange = useCallback((open: boolean) => {
    safeFocusHandler(`openChange:${open}`, () => {
      setIsOpen(open);
    });
  }, [safeFocusHandler]);

  // Fetch notifications from Convex
  const notifications = useQuery(api.domains.notifications.queries.getUserNotifications, {
    limit: 50,
  });

  // Get unread count efficiently
  const unreadCount = useQuery(api.domains.notifications.queries.getUnreadNotificationCount);

  // Mutations
  const markAsRead = useMutation(api.domains.notifications.mutations.markAsRead);
  const markAllAsRead = useMutation(api.domains.notifications.mutations.markAllAsRead);
  const deleteNotification = useMutation(api.domains.notifications.mutations.deleteNotification);

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    safeFocusHandler(`markAsRead:${notificationId}`, async () => {
      try {
        await markAsRead({ notificationId });
      } catch (error) {
        toast.error("Erro ao marcar notificação como lida");
        console.error(error);
      }
    });
  }, [safeFocusHandler, markAsRead]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead({});
      toast.success("Todas as notificações foram marcadas como lidas");
    } catch (error) {
      toast.error("Erro ao marcar todas as notificações como lidas");
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
    const iconMap = {
      booking_confirmed: { icon: CheckCircle, color: "text-emerald-500" },
      booking_canceled: { icon: Calendar, color: "text-red-500" },
      booking_updated: { icon: Calendar, color: "text-blue-500" },
      booking_reminder: { icon: BellRing, color: "text-orange-500" },
      payment_received: { icon: CreditCard, color: "text-emerald-500" },
      system_update: { icon: Bell, color: "text-blue-500" },
      chat_message: { icon: MessageCircle, color: "text-purple-500" },
      chat_room_created: { icon: MessageCircle, color: "text-indigo-500" },
    };

    const { icon: IconComponent, color } = iconMap[type] || { icon: Bell, color: "text-gray-500" };
    return <IconComponent className={`w-5 h-5 ${color}`} />;
  };

  const getNotificationVariant = (type: string, isRead: boolean) => {
    if (isRead) {
      return {
        container: "bg-gray-50/80 hover:bg-gray-100/80 border-transparent",
        indicator: null
      };
    }
    
    const variants = {
      booking_confirmed: "border-l-emerald-400 bg-emerald-50/50 hover:bg-emerald-50",
      booking_canceled: "border-l-red-400 bg-red-50/50 hover:bg-red-50",
      booking_updated: "border-l-blue-400 bg-blue-50/50 hover:bg-blue-50",
      booking_reminder: "border-l-orange-400 bg-orange-50/50 hover:bg-orange-50",
      payment_received: "border-l-emerald-400 bg-emerald-50/50 hover:bg-emerald-50",
      system_update: "border-l-blue-400 bg-blue-50/50 hover:bg-blue-50",
      chat_message: "border-l-purple-400 bg-purple-50/50 hover:bg-purple-50",
      chat_room_created: "border-l-indigo-400 bg-indigo-50/50 hover:bg-indigo-50",
    };

    return {
      container: variants[type] || "border-l-gray-400 bg-gray-50/50 hover:bg-gray-50",
      indicator: <Dot className="w-4 h-4 text-blue-500 fill-blue-500" />
    };
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {children || (
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("relative", className)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-medium text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </div>
            )}
          </Button>
        )}
      </SheetTrigger>
      
      <SheetContent className="w-[400px] sm:w-[540px] bg-white shadow-xl border-l">
        <SheetHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-gray-600" />
              <SheetTitle className="text-xl font-semibold text-gray-900">
                Notificações
              </SheetTitle>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs font-medium">
                  {unreadCount} novas
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <CheckCircle2 className="h-4 w-4" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
          <SheetDescription className="text-gray-500">
            Suas notificações e atualizações mais recentes
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4" />

        <ScrollArea className="h-[calc(100vh-140px)]">
          {notifications && notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.map((notification) => {
                const variant = getNotificationVariant(notification.type, notification.isRead);
                
                return (
                  <div
                    key={notification._id}
                    className={cn(
                      "relative p-4 rounded-xl border-l-2 transition-all duration-200 cursor-pointer group",
                      variant.container
                    )}
                    onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (!notification.isRead) {
                          handleMarkAsRead(notification._id);
                        }
                      }
                    }}
                    aria-label={`Notificação: ${notification.title}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <div className="w-9 h-9 rounded-lg bg-white/80 flex items-center justify-center border border-gray-200/50">
                          {getNotificationIcon(notification.type)}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className={cn(
                            "font-medium text-sm leading-tight",
                            !notification.isRead ? "text-gray-900" : "text-gray-600"
                          )}>
                            {notification.title}
                          </h4>
                          <div className="flex items-center gap-2 ml-3">
                            {variant.indicator}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notification._id);
                              }}
                            >
                              <X className="h-3 w-3 text-gray-400 hover:text-red-500" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className={cn(
                          "text-sm leading-relaxed mb-3",
                          !notification.isRead ? "text-gray-700" : "text-gray-500"
                        )}>
                          {notification.message}
                        </p>
                        
                        {notification.data && (
                          <div className="mb-3 p-2 bg-white/60 rounded-lg border border-gray-200/50">
                            <div className="space-y-1 text-xs">
                              {notification.data.confirmationCode && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">Código:</span>
                                  <code className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">
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
                          {format(new Date(notification.createdAt), "dd 'de' MMMM 'às' HH:mm", {
                            locale: ptBR,
                          })}
                        </time>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Bell className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma notificação
              </h3>
              <p className="text-gray-500 max-w-sm leading-relaxed">
                Você receberá notificações sobre suas reservas e atualizações importantes aqui.
              </p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
} 