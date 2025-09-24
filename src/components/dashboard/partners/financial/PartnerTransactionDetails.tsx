"use client";

import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Clock, RefreshCcw, Calendar, DollarSign, Package, Hash, ExternalLink, Copy, FileText } from "lucide-react";
import { toast } from "sonner";

interface PartnerTransactionDetailsProps {
  transactionId: Id<"partnerTransactions">;
  onClose: () => void;
}

export function PartnerTransactionDetails({ 
  transactionId, 
  onClose 
}: PartnerTransactionDetailsProps) {
  const transaction = useQuery(
    api.domains.partners.queries.getTransactionDetails,
    { transactionId }
  );

  if (!transaction) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "failed":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "refunded":
        return <RefreshCcw className="h-5 w-5 text-orange-600" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      pending: "secondary",
      failed: "destructive",
      refunded: "outline",
    };

    const labels: Record<string, string> = {
      completed: "Concluída",
      pending: "Pendente",
      failed: "Falhou",
      refunded: "Reembolsada",
    };

    return (
      <Badge variant={variants[status] || "default"} className="gap-1">
        {getStatusIcon(status)}
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Detalhes da Transação</span>
            {getStatusBadge(transaction.status)}
          </DialogTitle>
          <DialogDescription>
            Informações completas sobre esta transação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Transaction IDs */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Hash className="h-4 w-4" />
              Identificadores
            </h3>
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">ID da Transação</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {transaction._id}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(transaction._id, "ID da transação")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">ID da Reserva</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {transaction.bookingId}
                  </code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => copyToClipboard(transaction.bookingId, "ID da reserva")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Financial Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Detalhes Financeiros
            </h3>
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Valor Total</span>
                <span className="font-medium">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(transaction.amount / 100)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Taxa da Plataforma ({transaction.feePercentage}%)
                </span>
                <span className="text-orange-600">
                  -{new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(transaction.platformFee / 100)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">Valor Líquido</span>
                <span className="font-semibold text-green-600">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(transaction.partnerAmount / 100)}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Booking Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Package className="h-4 w-4" />
              Detalhes da Reserva
            </h3>
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Tipo</span>
                <Badge variant="outline" className="capitalize">
                  {transaction.bookingType.replace("_", " ")}
                </Badge>
              </div>
              {transaction.assetName && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Asset</span>
                  <span className="text-sm font-medium">{transaction.assetName}</span>
                </div>
              )}
              {transaction.customerName && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Cliente</span>
                  <span className="text-sm font-medium">{transaction.customerName}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Timeline */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </h3>
            <div className="space-y-3 pl-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Criada em</span>
                <span className="text-sm">
                  {new Date(transaction.createdAt).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {transaction.completedAt && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Concluída em</span>
                  <span className="text-sm">
                    {new Date(transaction.completedAt).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Metadata */}
          {transaction.metadata && Object.keys(transaction.metadata).length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Metadados Adicionais
                </h3>
                <div className="pl-6">
                  <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
                    {JSON.stringify(transaction.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          {transaction.paymentDetails?.receiptUrl ? (
            <Button
              variant="default"
              className="gap-2"
              onClick={() => {
                window.open(transaction.paymentDetails!.receiptUrl!, "_blank");
              }}
            >
              <ExternalLink className="h-4 w-4" />
              Ver comprovante
            </Button>
          ) : (
            <Button variant="outline" disabled>
              Comprovante indisponível
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 
