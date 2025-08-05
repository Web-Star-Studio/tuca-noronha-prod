"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, XCircle, AlertCircle, DollarSign } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface PartnerTransactionNotificationsProps {
  partnerId?: string;
  limit?: number;
  className?: string;
}

export function PartnerTransactionNotifications({

  limit = 10,
  className,
}: PartnerTransactionNotificationsProps) {
  // Fetch transaction-related notifications
  const notifications = useQuery(api.domains.notifications.queries.getUserNotifications, {
    limit,
    type: undefined, // Get all types, we'll filter client-side
  });

  // Filter for transaction-related notifications
  const transactionNotifications = notifications?.filter((n) =>
    ["new_transaction", "transaction_failed", "transaction_refunded"].includes(n.type)
  );

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_transaction":
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case "transaction_failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "transaction_refunded":
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case "new_transaction":
        return <Badge variant="success">Nova Transação</Badge>;
      case "transaction_failed":
        return <Badge variant="destructive">Falha</Badge>;
      case "transaction_refunded":
        return <Badge variant="warning">Estornado</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  if (!transactionNotifications || transactionNotifications.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações de Transações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Nenhuma notificação de transação no momento
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notificações de Transações
          </div>
          <Badge variant="secondary">{transactionNotifications.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {transactionNotifications.map((notification) => (
          <div
            key={notification._id}
            className={cn(
              "flex items-start gap-3 p-3 rounded-lg border transition-colors",
              notification.isRead
                ? "bg-muted/30 border-muted"
                : "bg-background border-border shadow-sm"
            )}
          >
            <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
            <div className="flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-medium leading-tight">
                  {notification.title}
                </h4>
                {getNotificationBadge(notification.type)}
              </div>
              <p className="text-sm text-muted-foreground">{notification.message}</p>
              
              {/* Transaction Details */}
              {notification.data && (
                <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {notification.data.customerName && (
                    <p>Cliente: {notification.data.customerName}</p>
                  )}
                  {notification.data.assetName && (
                    <p>Serviço: {notification.data.assetName}</p>
                  )}
                  {notification.data.partnerAmount && (
                    <p className="font-medium text-foreground">
                      Valor líquido: R$ {(notification.data.partnerAmount / 100).toFixed(2)}
                    </p>
                  )}
                  {notification.data.refundAmount && (
                    <p className="font-medium text-orange-600">
                      Valor estornado: R$ {(notification.data.refundAmount / 100).toFixed(2)}
                    </p>
                  )}
                  {notification.data.error && (
                    <p className="text-red-600">Erro: {notification.data.error}</p>
                  )}
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(notification.createdAt), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
            {!notification.isRead && (
              <div className="h-2 w-2 rounded-full bg-blue-600 mt-1.5" />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
} 