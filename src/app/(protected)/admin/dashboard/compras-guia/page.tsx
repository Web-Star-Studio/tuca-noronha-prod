"use client";

/**
 * Página de Gerenciamento de Compras do Guia
 * 
 * REGRAS DE NEGÓCIO:
 * - Apenas Masters podem acessar esta página
 * - Exibe todas as compras do guia com informações detalhadas
 * - Permite filtrar por status de pagamento
 * - Mostra estatísticas de vendas e receita
 */

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  BookOpen, 
  Search, 
  DollarSign, 
  Users, 
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { DashboardPageHeader } from "../components";

// Status badge configuration
const statusConfig = {
  approved: {
    label: "Aprovado",
    icon: CheckCircle,
    className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  },
  pending: {
    label: "Pendente",
    icon: Clock,
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
  },
  in_process: {
    label: "Em Processo",
    icon: AlertCircle,
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
  },
  rejected: {
    label: "Rejeitado",
    icon: XCircle,
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  },
  cancelled: {
    label: "Cancelado",
    icon: XCircle,
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
  },
  refunded: {
    label: "Reembolsado",
    icon: DollarSign,
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
  },
};

// Payment method labels
const paymentMethodLabels: Record<string, string> = {
  pix: "PIX",
  visa: "Visa",
  mastercard: "Mastercard",
  credit_card: "Cartão de Crédito",
  debit_card: "Cartão de Débito",
  bank_transfer: "Transferência Bancária",
};

export default function ComprasGuiaPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch purchases and stats
  const purchases = useQuery(api.domains.guide.queries.getAllPurchases);
  const stats = useQuery(api.domains.guide.queries.getPurchaseStats);

  // Filter purchases
  const filteredPurchases = useMemo(() => {
    if (!purchases) return [];
    
    return purchases.filter(purchase => {
      // Filter by status
      if (statusFilter !== "all" && purchase.status !== statusFilter) return false;
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          purchase.userName?.toLowerCase().includes(searchLower) ||
          purchase.userEmail?.toLowerCase().includes(searchLower) ||
          purchase.userId?.toLowerCase().includes(searchLower) ||
          purchase.mpPaymentId?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    });
  }, [purchases, statusFilter, searchTerm]);

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Loading state
  if (!purchases || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Carregando compras do guia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        icon={BookOpen}
        title="Compras do Guia"
        description="Acompanhe todas as compras do guia turístico"
      />

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Compras</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.approved} aprovadas
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                De vendas aprovadas
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuários Únicos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
              <p className="text-xs text-muted-foreground">
                Compradores diferentes
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.averageAmount)}</div>
              <p className="text-xs text-muted-foreground">
                Por compra aprovada
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, email, ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="approved">Aprovado</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_process">Em Processo</SelectItem>
                <SelectItem value="rejected">Rejeitado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
                <SelectItem value="refunded">Reembolsado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Purchases Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Compras ({filteredPurchases.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPurchases.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma compra encontrada</h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter !== "all"
                  ? "Tente ajustar os filtros"
                  : "Ainda não há compras do guia"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Data da Compra</TableHead>
                    <TableHead>Data de Aprovação</TableHead>
                    <TableHead>ID Pagamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map((purchase) => {
                    const statusInfo = statusConfig[purchase.status as keyof typeof statusConfig] || statusConfig.pending;
                    const StatusIcon = statusInfo.icon;
                    
                    return (
                      <TableRow key={purchase._id}>
                        <TableCell className="font-medium">
                          {purchase.userName || "—"}
                        </TableCell>
                        <TableCell>{purchase.userEmail}</TableCell>
                        <TableCell>
                          <Badge className={statusInfo.className}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-semibold">
                          {formatCurrency(purchase.amount)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                              {paymentMethodLabels[purchase.paymentMethod || ""] || 
                               purchase.paymentMethod || "—"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(new Date(purchase.purchasedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {purchase.approvedAt 
                            ? format(new Date(purchase.approvedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })
                            : "—"}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {purchase.mpPaymentId}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
