import { useState, useRef, useCallback, useEffect, cloneElement, isValidElement } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { format, formatDistanceToNow } from "date-fns";
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
import { Bell, BellRing, CheckCircle, Calendar, CreditCard, CheckCircle2, MessageCircle, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";


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

  const normalizedUnreadCount = typeof unreadCount === "number" ? unreadCount : 0;
  const hasUnread = normalizedUnreadCount > 0;
  const formattedUnreadCount = normalizedUnreadCount > 9 ? "9+" : normalizedUnreadCount;

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
        container: "bg-white/60 hover:bg-white border-gray-100 shadow-sm",
        indicator: null
      };
    }
    
    const variants = {
      booking_confirmed: "border-l-emerald-500 bg-gradient-to-r from-emerald-50/80 to-white hover:from-emerald-50 shadow-emerald-500/10",
      booking_canceled: "border-l-red-500 bg-gradient-to-r from-red-50/80 to-white hover:from-red-50 shadow-red-500/10",
      booking_updated: "border-l-blue-500 bg-gradient-to-r from-blue-50/80 to-white hover:from-blue-50 shadow-blue-500/10",
      booking_reminder: "border-l-orange-500 bg-gradient-to-r from-orange-50/80 to-white hover:from-orange-50 shadow-orange-500/10",
      payment_received: "border-l-emerald-500 bg-gradient-to-r from-emerald-50/80 to-white hover:from-emerald-50 shadow-emerald-500/10",
      system_update: "border-l-blue-500 bg-gradient-to-r from-blue-50/80 to-white hover:from-blue-50 shadow-blue-500/10",
      chat_message: "border-l-purple-500 bg-gradient-to-r from-purple-50/80 to-white hover:from-purple-50 shadow-purple-500/10",
      chat_room_created: "border-l-indigo-500 bg-gradient-to-r from-indigo-50/80 to-white hover:from-indigo-50 shadow-indigo-500/10",
    };

    return {
      container: variants[type] || "border-l-gray-500 bg-gradient-to-r from-gray-50/80 to-white hover:from-gray-50 shadow-gray-500/10",
      indicator: <span className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50 animate-pulse" />
    };
  };

  const getNotificationTypeMeta = (type: string) => {
    const meta: Record<string, { label: string; badgeClass: string }> = {
      booking_confirmed: { label: "Reserva confirmada", badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200" },
      booking_canceled: { label: "Reserva cancelada", badgeClass: "bg-red-100 text-red-700 border-red-200" },
      booking_updated: { label: "Reserva atualizada", badgeClass: "bg-blue-100 text-blue-700 border-blue-200" },
      booking_reminder: { label: "Lembrete", badgeClass: "bg-orange-100 text-orange-700 border-orange-200" },
      payment_received: { label: "Pagamento recebido", badgeClass: "bg-emerald-100 text-emerald-700 border-emerald-200" },
      system_update: { label: "Atualização do sistema", badgeClass: "bg-blue-100 text-blue-700 border-blue-200" },
      chat_message: { label: "Nova mensagem", badgeClass: "bg-purple-100 text-purple-700 border-purple-200" },
      chat_room_created: { label: "Novo chat", badgeClass: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    };

    return meta[type] || { label: "Atualização", badgeClass: "bg-gray-100 text-gray-700 border-gray-200" };
  };

  const renderUnreadBadge = () => {
    if (!hasUnread) {
      return null;
    }

    return (
      <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400/70" />
        <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-semibold text-white">
          {formattedUnreadCount}
        </span>
      </span>
    );
  };

  const renderTrigger = () => {
    if (children && isValidElement(children)) {
      return cloneElement(children, {
        className: cn("relative", className, children.props.className),
        children: (
          <>
            {children.props.children}
            {renderUnreadBadge()}
          </>
        ),
      });
    }

    return (
      <Button 
        variant="ghost" 
        size="icon" 
        className={cn("relative", className)}
      >
        <Bell className="h-5 w-5" />
        {renderUnreadBadge()}
      </Button>
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        {renderTrigger()}
      </SheetTrigger>
      
      <SheetContent className="w-[400px] sm:w-[540px] bg-gradient-to-b from-white to-gray-50/30 shadow-2xl border-l border-gray-200/80">
        <SheetHeader className="pb-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/20">
              <Bell className="h-5 w-5 text-white" />
            </div>
            <div className="flex items-baseline gap-2.5">
              <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Notificações
              </SheetTitle>
              {hasUnread && (
                <Badge className="bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-semibold px-2.5 py-1 shadow-sm">
                  {normalizedUnreadCount} {normalizedUnreadCount === 1 ? 'nova' : 'novas'}
                </Badge>
              )}
            </div>
          </div>
          <SheetDescription className="text-sm text-gray-600 leading-relaxed">
            Suas notificações e atualizações mais recentes
          </SheetDescription>
          {hasUnread && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="w-full flex items-center justify-center gap-2 text-sm font-medium border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              Marcar todas como lidas
            </Button>
          )}
        </SheetHeader>

        <Separator className="my-4" />

        <ScrollArea className="h-[calc(100vh-140px)] px-1">
          {notifications === undefined ? (
            <div className="space-y-4 pr-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="animate-pulse rounded-2xl border border-gray-200 bg-gradient-to-r from-gray-50 to-white p-5 shadow-lg"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-gray-200" />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-32 rounded-lg bg-gray-200" />
                        <div className="h-5 w-20 rounded-lg bg-gray-200" />
                      </div>
                      <div className="h-3 w-full rounded-lg bg-gray-200" />
                      <div className="h-3 w-4/5 rounded-lg bg-gray-200" />
                      <div className="h-2 w-40 rounded-lg bg-gray-200" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-3 pr-4">
              {notifications.map((notification) => {
                const variant = getNotificationVariant(notification.type, notification.isRead);
                const meta = getNotificationTypeMeta(notification.type);
                const relativeTime = formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                  locale: ptBR,
                });
                const relativeTimeLabel = relativeTime.charAt(0).toUpperCase() + relativeTime.slice(1);
                
                return (
                  <div
                    key={notification._id}
                    className={cn(
                      "relative p-5 rounded-2xl border-l-[3px] border transition-all duration-300 cursor-pointer group shadow-lg hover:shadow-xl hover:-translate-y-1",
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
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="relative w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-gray-200 shadow-md group-hover:scale-110 transition-transform duration-200">
                          {getNotificationIcon(notification.type)}
                          {!notification.isRead && (
                            <span className="absolute -top-1.5 -right-1.5 h-3 w-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/50 ring-2 ring-white" />
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2.5 gap-3">
                          <div className="flex-1">
                            <h4 className={cn(
                              "font-semibold text-base leading-snug mb-1.5",
                              !notification.isRead ? "text-gray-900" : "text-gray-600"
                            )}>
                              {notification.title}
                            </h4>
                            <Badge
                              variant="outline"
                              className={cn(
                                "inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider shadow-sm",
                                meta.badgeClass
                              )}
                            >
                              {meta.label}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {variant.indicator}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1.5 h-7 w-7 rounded-lg hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteNotification(notification._id);
                              }}
                            >
                              <X className="h-3.5 w-3.5 text-gray-400 hover:text-red-600 transition-colors" />
                            </Button>
                          </div>
                        </div>
                        
                        <p className={cn(
                          "text-sm leading-relaxed mb-3",
                          !notification.isRead ? "text-gray-800" : "text-gray-500"
                        )}>
                          {notification.message}
                        </p>
                        
                        {notification.data && (
                          <div className="mb-3 p-3 bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm">
                            <div className="space-y-1.5 text-xs">
                              {notification.data.confirmationCode && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500 font-medium">Código:</span>
                                  <code className="font-mono bg-white px-2 py-1 rounded-md text-gray-800 border border-gray-200 shadow-sm">
                                    {notification.data.confirmationCode}
                                  </code>
                                </div>
                              )}
                              {notification.data.assetName && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500 font-medium">Local:</span>
                                  <span className="text-gray-800 font-medium">{notification.data.assetName}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        <time className="text-xs text-gray-500 font-medium flex items-center gap-1.5" dateTime={notification.createdAt}>
                          <span className="w-1 h-1 rounded-full bg-gray-300" />
                          {format(new Date(notification.createdAt), "dd 'de' MMMM 'às' HH:mm", {
                            locale: ptBR,
                          })}
                          <span className="text-gray-400">·</span>
                          <span className="text-gray-400">{relativeTimeLabel}</span>
                        </time>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center shadow-lg">
                  <Bell className="h-10 w-10 text-blue-500" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-md">
                  <CheckCircle className="h-5 w-5 text-gray-500" />
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Tudo em dia!
              </h3>
              <p className="text-sm text-gray-600 max-w-sm leading-relaxed">
                Você não tem notificações pendentes. Quando houver novidades sobre suas reservas e atualizações importantes, elas aparecerão aqui.
              </p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
} 
