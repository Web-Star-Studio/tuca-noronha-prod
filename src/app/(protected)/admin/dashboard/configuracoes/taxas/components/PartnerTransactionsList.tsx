"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, ExternalLink } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PartnerTransactionsListProps {
  partnerId?: Id<"partners">;
}

export function PartnerTransactionsList({ partnerId }: PartnerTransactionsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  
  // Get all transactions or filter by partner
  const transactions = useQuery(api.domains.partners.queries.listPartnerTransactions, {});
  const partners = useQuery(api.domains.partners.queries.listPartners, {
    paginationOpts: { numItems: 100, cursor: null }
  });

  const filteredTransactions = transactions?.filter(transaction => {
    if (partnerId && transaction.partnerId !== partnerId) return false;
    if (!searchTerm) return true;
    
    const partner = partners?.page.find(p => p._id === transaction.partnerId);
    const searchLower = searchTerm.toLowerCase();
    
    return (
      transaction.bookingId.toLowerCase().includes(searchLower) ||
      transaction.stripePaymentIntentId.toLowerCase().includes(searchLower) ||
      partner?.businessName?.toLowerCase().includes(searchLower) ||
      transaction.bookingType.toLowerCase().includes(searchLower)
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">Concluída</Badge>;
      case "pending":
        return <Badge variant="warning">Pendente</Badge>;
      case "failed":
        return <Badge variant="destructive">Falhou</Badge>;
      case "refunded":
        return <Badge variant="secondary">Reembolsada</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getBookingTypeBadge = (type: string) => {
    switch (type) {
      case "activity":
        return <Badge variant="secondary">Atividade</Badge>;
      case "event":
        return <Badge variant="secondary">Evento</Badge>;
      case "restaurant":
        return <Badge variant="secondary">Restaurante</Badge>;
      case "vehicle":
        return <Badge variant="secondary">Veículo</Badge>;
      case "accommodation":
        return <Badge variant="secondary">Hospedagem</Badge>;
      case "package":
        return <Badge variant="secondary">Pacote</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  if (!transactions || !partners) {
    return <div>Carregando transações...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID da reserva, parceiro, tipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Parceiro</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Reserva</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Taxa</TableHead>
              <TableHead className="text-right">Parceiro Recebe</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground">
                  Nenhuma transação encontrada
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions?.map((transaction) => {
                const partner = partners.page.find(p => p._id === transaction.partnerId);
                
                return (
                  <TableRow key={transaction._id}>
                    <TableCell>
                      <div className="text-sm">
                        {formatDistanceToNow(transaction.createdAt, {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{partner?.businessName || "N/A"}</div>
                        <div className="text-sm text-muted-foreground">
                          {partner?.businessType || ""}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getBookingTypeBadge(transaction.bookingType)}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">{transaction.bookingId}</code>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(transaction.amount / 100)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="text-sm">
                        {formatCurrency(transaction.platformFee / 100)}
                        <div className="text-xs text-muted-foreground">
                          {((transaction.platformFee / transaction.amount) * 100).toFixed(1)}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(transaction.partnerAmount / 100)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.status)}
                    </TableCell>
                    <TableCell>
                      <a
                        href={`https://dashboard.stripe.com/test/payments/${transaction.stripePaymentIntentId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        Ver no Stripe
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {filteredTransactions && filteredTransactions.length > 0 && (
        <div className="flex items-center justify-between px-2 text-sm text-muted-foreground">
          <div>
            Mostrando {filteredTransactions.length} transação(ões)
          </div>
          <div className="flex items-center gap-4">
            <div>
              Total: {formatCurrency(
                filteredTransactions.reduce((sum, t) => sum + t.amount, 0) / 100
              )}
            </div>
            <div>
              Taxas: {formatCurrency(
                filteredTransactions.reduce((sum, t) => sum + t.platformFee, 0) / 100
              )}
            </div>
            <div>
              Parceiros: {formatCurrency(
                filteredTransactions.reduce((sum, t) => sum + t.partnerAmount, 0) / 100
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 