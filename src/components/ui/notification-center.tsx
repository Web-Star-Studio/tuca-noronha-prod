import { useState } from "react";
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
  AlertTriangle,
  Info,
  X,
  CheckCircle2,
  Trash2,
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

  // Fetch notifications from Convex
  const notifications = useQuery(api.domains.notifications.queries.getUserNotifications, {
    limit: 50,
  });

  // Mutations
  const markAsRead = useMutation(api.domains.notifications.mutations.markAsRead);
  const markAllAsRead = useMutation(api.domains.notifications.mutations.markAllAsRead);
  const deleteNotification = useMutation(api.domains.notifications.mutations.deleteNotification);

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead({ notificationId });
    } catch (error) {
      toast.error("Erro ao marcar notificação como lida");
      console.error(error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const user = await fetch('/api/get-user-id').then(res => res.json());
      if (!user.userId) throw new Error("Usuário não encontrado");
      
      await markAllAsRead({ userId: user.userId });
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
    switch (type) {
      case "booking_confirmed":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "booking_canceled":
        return <X className="w-5 h-5 text-red-500" />;
      case "booking_updated":
        return <Calendar className="w-5 h-5 text-blue-500" />;
      case "booking_reminder":
        return <BellRing className="w-5 h-5 text-orange-500" />;
      case "payment_received":
        return <CreditCard className="w-5 h-5 text-green-500" />;
      case "system_update":
        return <Info className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getNotificationBgColor = (type: string, isRead: boolean) => {
    if (isRead) return "bg-gray-50";
    
    switch (type) {
      case "booking_confirmed":
        return "bg-green-50 border-l-4 border-green-500";
      case "booking_canceled":
        return "bg-red-50 border-l-4 border-red-500";
      case "booking_updated":
        return "bg-blue-50 border-l-4 border-blue-500";
      case "booking_reminder":
        return "bg-orange-50 border-l-4 border-orange-500";
      case "payment_received":
        return "bg-green-50 border-l-4 border-green-500";
      case "system_update":
        return "bg-blue-50 border-l-4 border-blue-500";
      default:
        return "bg-gray-50 border-l-4 border-gray-500";
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {children || (
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("relative", className)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        )}
      </SheetTrigger>
      
      <SheetContent className="w-[400px] sm:w-[540px] bg-white shadow-2xl z-[80]">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount} novas
                </Badge>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 text-sm"
              >
                <CheckCircle2 className="h-4 w-4" />
                Marcar todas como lidas
              </Button>
            )}
          </div>
          <SheetDescription>
            Suas notificações e atualizações mais recentes
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4" />

        <ScrollArea className="h-[calc(100vh-140px)]">
          {notifications && notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <button
                  key={notification._id}
                  type="button"
                  className={cn(
                    "p-4 rounded-lg transition-colors cursor-pointer group w-full text-left",
                    getNotificationBgColor(notification.type, notification.isRead)
                  )}
                  onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                  aria-label={`Notificação: ${notification.title}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className={cn(
                          "font-medium text-sm",
                          !notification.isRead && "text-gray-900",
                          notification.isRead && "text-gray-600"
                        )}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-1 ml-2">
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full" />
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 h-auto"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteNotification(notification._id);
                            }}
                          >
                            <Trash2 className="h-3 w-3 text-gray-400 hover:text-red-500" />
                          </Button>
                        </div>
                      </div>
                      
                      <p className={cn(
                        "text-sm mt-1",
                        !notification.isRead && "text-gray-700",
                        notification.isRead && "text-gray-500"
                      )}>
                        {notification.message}
                      </p>
                      
                      {notification.data && (
                        <div className="mt-2 text-xs text-gray-500 space-y-1">
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
                      
                      <p className="text-xs text-gray-400 mt-2">
                        {format(new Date(notification.createdAt), "dd 'de' MMMM 'às' HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Bell className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma notificação
              </h3>
              <p className="text-gray-500 max-w-sm">
                Você receberá notificações sobre suas reservas e atualizações importantes aqui.
              </p>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
} 