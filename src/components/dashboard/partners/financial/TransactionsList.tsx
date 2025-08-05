"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Eye, ArrowUpDown, CheckCircle, XCircle, Clock, RefreshCcw } from "lucide-react";

import { PartnerTransactionDetails } from "./PartnerTransactionDetails";
import { toast } from "sonner";

interface TransactionsListProps {
  partnerId: Id<"partners">;
  dateRange?: {
    startDate: number;
    endDate: number;
  };
}

export function TransactionsList({ partnerId, dateRange }: TransactionsListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch transactions with pagination
  const transactions = useQuery(
    api.domains.partners.queries.getPartnerTransactions,
    {
      partnerId,
      limit: 100, // Fetch more for client-side filtering
    }
  );

  // Apply filters
  const filteredTransactions = transactions?.filter(transaction => {
    const matchesSearch = transaction.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.stripePaymentIntentId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || transaction.status === statusFilter;
    const matchesType = typeFilter === "all" || transaction.bookingType === typeFilter;
    
    let matchesDate = true;
    if (dateRange) {
      matchesDate = transaction.createdAt >= dateRange.startDate && 
                   transaction.createdAt <= dateRange.endDate;
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  }) || [];

  // Sort transactions
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (sortBy === "date") {
      return sortOrder === "asc" 
        ? a.createdAt - b.createdAt 
        : b.createdAt - a.createdAt;
    } else {
      return sortOrder === "asc" 
        ? a.amount - b.amount 
        : b.amount - a.amount;
    }
  });

  // Paginate
  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);
  const paginatedTransactions = sortedTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportTransactions = () => {
    toast.info("Exportação de transações em desenvolvimento");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "refunded":
        return <RefreshCcw className="h-4 w-4 text-orange-600" />;
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

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      activity: "Atividade",
      event: "Evento",
      restaurant: "Restaurante",
      accommodation: "Hospedagem",
      vehicle: "Veículo",
      package: "Pacote",
    };
    return labels[type] || type;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Histórico de Transações</CardTitle>
              <CardDescription>
                Todas as suas transações na plataforma
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              onClick={handleExportTransactions}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="completed">Concluídas</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="failed">Falhadas</SelectItem>
                <SelectItem value="refunded">Reembolsadas</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="activity">Atividades</SelectItem>
                <SelectItem value="event">Eventos</SelectItem>
                <SelectItem value="restaurant">Restaurantes</SelectItem>
                <SelectItem value="accommodation">Hospedagens</SelectItem>
                <SelectItem value="vehicle">Veículos</SelectItem>
                <SelectItem value="package">Pacotes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => {
                        if (sortBy === "date") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortBy("date");
                          setSortOrder("desc");
                        }
                      }}
                    >
                      Data
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Booking ID</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => {
                        if (sortBy === "amount") {
                          setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                        } else {
                          setSortBy("amount");
                          setSortOrder("desc");
                        }
                      }}
                    >
                      Valor Total
                      <ArrowUpDown className="h-3 w-3" />
                    </Button>
                  </TableHead>
                  <TableHead>Taxa</TableHead>
                  <TableHead>Líquido</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      Nenhuma transação encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTransactions.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell className="text-sm">
                        {new Date(transaction.createdAt).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getTypeLabel(transaction.bookingType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {transaction.bookingId.slice(-8).toUpperCase()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(transaction.amount / 100)}
                      </TableCell>
                      <TableCell className="text-orange-600">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(transaction.platformFee / 100)}
                      </TableCell>
                      <TableCell className="font-medium text-green-600">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(transaction.partnerAmount / 100)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(transaction.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTransaction(transaction._id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-600">
                Mostrando {((currentPage - 1) * itemsPerPage) + 1} a{" "}
                {Math.min(currentPage * itemsPerPage, sortedTransactions.length)} de{" "}
                {sortedTransactions.length} transações
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próximo
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Modal */}
      {selectedTransaction && (
        <PartnerTransactionDetails
          transactionId={selectedTransaction as Id<"partnerTransactions">}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </>
  );
} 